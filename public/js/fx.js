// Full-screen canvas effects: gold coins, sparks, shock rings and light rays.
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

function launch(p) {
  parts.push(p);
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
}

export function coinBurst(x, y, count = 60) {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
    const speed = 420 + Math.random() * 680;
    launch({
      type: 'coin',
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
}

export function sparkles(x, y, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 220;
    launch({
      type: 'spark',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      size: 3 + Math.random() * 5,
      age: 0,
      life: 0.6 + Math.random() * 0.6,
    });
  }
}

export function shockwave(x, y, big = false) {
  launch({
    type: 'ring',
    x,
    y,
    age: 0,
    life: big ? 0.9 : 0.55,
    r1: big ? Math.max(w, h) * 0.55 : 120,
    width: big ? 10 : 5,
  });
}

export function rays(x, y) {
  launch({ type: 'rays', x, y, age: 0, life: 1.6, rot: Math.random() * Math.PI });
}

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  g.clearRect(0, 0, w, h);
  parts = parts.filter((p) => step(p, dt));
  raf = parts.length ? requestAnimationFrame(frame) : 0;
}

function step(p, dt) {
  p.age += dt;
  if (p.age >= p.life) return false;
  const t = p.age / p.life;
  if (p.type === 'coin') {
    p.vy += GRAVITY * dt;
    p.vx *= 1 - 0.8 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.phase += p.spin * dt;
    if (p.y > h + 40) return false;
    drawCoin(p);
  } else if (p.type === 'spark') {
    p.vy += 380 * dt;
    p.vx *= 1 - 2.2 * dt;
    p.vy *= 1 - 1.2 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    drawSpark(p, t);
  } else if (p.type === 'ring') {
    drawRing(p, t);
  } else {
    drawRays(p, t);
  }
  return true;
}

function drawCoin(p) {
  const flip = Math.max(0.15, Math.abs(Math.cos(p.phase)));
  g.save();
  g.translate(p.x, p.y);
  g.scale(flip, 1);
  g.globalAlpha = Math.min(1, (p.life - p.age) * 2);
  const grad = g.createRadialGradient(-p.size * 0.3, -p.size * 0.3, 1, 0, 0, p.size);
  grad.addColorStop(0, '#fff6c9');
  grad.addColorStop(0.5, '#f5c542');
  grad.addColorStop(1, '#8a5a0c');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, p.size, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function drawSpark(p, t) {
  const a = 1 - t;
  const s = p.size * (0.4 + 0.6 * a);
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = a;
  g.translate(p.x, p.y);
  g.fillStyle = '#fff3b8';
  g.beginPath();
  g.moveTo(0, -s);
  g.quadraticCurveTo(0, 0, s, 0);
  g.quadraticCurveTo(0, 0, 0, s);
  g.quadraticCurveTo(0, 0, -s, 0);
  g.quadraticCurveTo(0, 0, 0, -s);
  g.fill();
  g.restore();
}

function drawRing(p, t) {
  const eased = 1 - (1 - t) ** 3;
  const r = 10 + (p.r1 - 10) * eased;
  g.save();
  g.globalAlpha = (1 - t) * 0.8;
  g.strokeStyle = '#ffd36a';
  g.lineWidth = p.width * (1 - t) + 1;
  g.shadowColor = '#ffb030';
  g.shadowBlur = 18;
  g.beginPath();
  g.arc(p.x, p.y, r, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}

function drawRays(p, t) {
  const R = Math.max(w, h) * 0.9;
  const n = 14;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = (1 - t) * 0.35;
  g.translate(p.x, p.y);
  g.rotate(p.rot + t * 0.4);
  for (let i = 0; i < n; i++) {
    g.rotate((Math.PI * 2) / n);
    const grad = g.createLinearGradient(0, 0, R, 0);
    grad.addColorStop(0, 'rgba(255, 230, 150, 0.9)');
    grad.addColorStop(1, 'rgba(255, 230, 150, 0)');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(R, -R * 0.035);
    g.lineTo(R, R * 0.035);
    g.closePath();
    g.fill();
  }
  g.restore();
}
