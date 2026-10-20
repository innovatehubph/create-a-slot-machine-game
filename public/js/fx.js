// Coin burst drawn on a full-screen canvas.
const canvas = document.getElementById('fx');
const g = canvas.getContext('2d');
const GRAVITY = 1500;
let parts = [];
let raf = 0;
let last = 0;
let w = 0;
let h = 0;

export function resizeFx() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function burst(x, y, count = 60) {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
    const speed = 420 + Math.random() * 680;
    parts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      phase: Math.random() * Math.PI * 2,
      spin: 6 + Math.random() * 8,
      size: 7 + Math.random() * 6,
      age: 0,
      life: 1.4 + Math.random() * 0.9,
    });
  }
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
}

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  g.clearRect(0, 0, w, h);
  parts = parts.filter((p) => {
    p.age += dt;
    if (p.age >= p.life || p.y > h + 40) return false;
    p.vy += GRAVITY * dt;
    p.vx *= 1 - 0.8 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.phase += p.spin * dt;
    draw(p);
    return true;
  });
  raf = parts.length ? requestAnimationFrame(frame) : 0;
}

function draw(p) {
  const flip = Math.max(0.15, Math.abs(Math.cos(p.phase)));
  g.save();
  g.translate(p.x, p.y);
  g.scale(flip, 1);
  g.globalAlpha = Math.min(1, (p.life - p.age) * 2);
  const grad = g.createRadialGradient(-p.size * 0.3, -p.size * 0.3, 1, 0, 0, p.size);
  grad.addColorStop(0, '#fff6c9');
  grad.addColorStop(0.5, '#f5c542');
  grad.addColorStop(1, '#b7791f');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, p.size, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
