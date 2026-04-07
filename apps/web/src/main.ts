// ── Particle animation ────────────────────────────────────────
const canvas = document.getElementById('particles') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#4f46e5'];
let particles: Particle[] = [];
let animId: number;

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticle(): Particle {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.6 + 0.1,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
  };
}

function initParticles(): void {
  const count = Math.floor((canvas.width * canvas.height) / 8000);
  particles = Array.from({ length: Math.min(count, 120) }, createParticle);
}

function drawConnection(a: Particle, b: Particle, dist: number): void {
  const maxDist = 150;
  const alpha = (1 - dist / maxDist) * 0.2;
  ctx.beginPath();
  ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
  ctx.lineWidth = 0.5;
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function animate(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
    ctx.fill();
  }

  // Draw connections
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i]!;
      const b = particles[j]!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) drawConnection(a, b, dist);
    }
  }

  animId = requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  resize();
  initParticles();
});

resize();
initParticles();
animId = requestAnimationFrame(animate);
void animId; // prevent unused var warning

// ── Scroll-reveal ─────────────────────────────────────────────
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    }
  },
  { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

// ── Waitlist form ─────────────────────────────────────────────
const form = document.getElementById('waitlistForm') as HTMLFormElement;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);

  try {
    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
    });
  } catch {
    // Netlify forms fallback — show success anyway in dev
  }

  form.style.display = 'none';
  const success = document.getElementById('waitlistSuccess')!;
  success.style.display = 'block';
});
