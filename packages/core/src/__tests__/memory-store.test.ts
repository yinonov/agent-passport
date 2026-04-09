import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { MemoryStore } from '../memory-store.js';
import type { MemoryCategory } from '@agent-passport/schema';

function makeItem(overrides: Partial<{ content: string; category: MemoryCategory; source: string; confidence: number; tags: string[] }> = {}) {
  return {
    category: (overrides.category ?? 'PROFILE') as MemoryCategory,
    content: overrides.content ?? 'Test content',
    source: overrides.source ?? 'test',
    confidence: overrides.confidence ?? 0.9,
    tags: overrides.tags ?? [],
  };
}

describe('MemoryStore', () => {
  it('add returns item with id and PENDING state', () => {
    const store = new MemoryStore();
    const item = store.add(makeItem({ content: 'My name is Alice' }));

    assert.ok(item.id, 'should have an id');
    assert.equal(item.reviewState, 'PENDING');
    assert.equal(item.content, 'My name is Alice');
    assert.ok(item.timestamp, 'should have a timestamp');
    assert.equal(store.size, 1);
  });

  it('approve changes state to APPROVED', () => {
    const store = new MemoryStore();
    const item = store.add(makeItem());
    const approved = store.approve(item.id);

    assert.equal(approved.reviewState, 'APPROVED');
    assert.equal(store.get(item.id)?.reviewState, 'APPROVED');
  });

  it('reject changes state to REJECTED', () => {
    const store = new MemoryStore();
    const item = store.add(makeItem());
    store.reject(item.id);

    assert.equal(store.get(item.id)?.reviewState, 'REJECTED');
  });

  it('edit updates content and sets EDITED', () => {
    const store = new MemoryStore();
    const item = store.add(makeItem({ content: 'original' }));
    const edited = store.edit(item.id, { content: 'updated' });

    assert.equal(edited.content, 'updated');
    assert.equal(edited.reviewState, 'EDITED');
    assert.equal(store.get(item.id)?.content, 'updated');
  });

  it('query by category works', () => {
    const store = new MemoryStore();
    store.add(makeItem({ category: 'PROFILE' }));
    store.add(makeItem({ category: 'PREFERENCE' }));
    store.add(makeItem({ category: 'PROFILE' }));

    const profiles = store.query({ category: 'PROFILE' });
    assert.equal(profiles.length, 2);

    const prefs = store.query({ category: 'PREFERENCE' });
    assert.equal(prefs.length, 1);
  });

  it('export/import roundtrip preserves data', () => {
    const store = new MemoryStore();
    store.add(makeItem({ content: 'item one', category: 'PROFILE' }));
    store.add(makeItem({ content: 'item two', category: 'PREFERENCE' }));

    const exported = store.export();

    const newStore = new MemoryStore();
    const count = newStore.import(exported);

    assert.equal(count, 2);
    assert.equal(newStore.size, 2);
  });

  it('getPending returns only pending items', () => {
    const store = new MemoryStore();
    const item1 = store.add(makeItem({ content: 'pending item' }));
    const item2 = store.add(makeItem({ content: 'approved item' }));
    store.approve(item2.id);

    const pending = store.getPending();
    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, item1.id);
  });

  it('getApproved returns APPROVED and EDITED items', () => {
    const store = new MemoryStore();
    const item1 = store.add(makeItem({ content: 'to approve' }));
    const item2 = store.add(makeItem({ content: 'to edit' }));
    store.add(makeItem({ content: 'stays pending' }));
    const item4 = store.add(makeItem({ content: 'to reject' }));

    store.approve(item1.id);
    store.edit(item2.id, { content: 'edited content' });
    store.reject(item4.id);

    const approved = store.getApproved();
    assert.equal(approved.length, 2);

    const states = approved.map((i) => i.reviewState).sort();
    assert.deepEqual(states, ['APPROVED', 'EDITED']);
  });

  it('clear removes all items', () => {
    const store = new MemoryStore();
    store.add(makeItem());
    store.add(makeItem());
    assert.equal(store.size, 2);

    store.clear();
    assert.equal(store.size, 0);
  });

  it('throws when approving non-existent item', () => {
    const store = new MemoryStore();
    assert.throws(() => store.approve('non-existent-id'), /not found/);
  });
});
