// Marquee bulb chase and a pointer-driven 3D tilt for the cabinet.
export function initScene({ reduceMotion }) {
  document.querySelectorAll('.bulbs').forEach((row) => {
    const count = Number(row.dataset.count || 24);
    for (let i = 0; i < count; i++) {
      const bulb = document.createElement('span');
      bulb.className = 'bulb';
      bulb.style.animationDelay = `${(i % 4) * 0.25}s`;
      row.appendChild(bulb);
    }
  });

  if (reduceMotion || !window.matchMedia('(pointer: fine)').matches) return;

  const cabinet = document.querySelector('.cabinet');
  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let raf = 0;

  const tick = () => {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    cabinet.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
    cabinet.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
    const settling = Math.abs(tx - x) + Math.abs(ty - y) > 0.0005;
    raf = settling ? requestAnimationFrame(tick) : 0;
  };
  const aim = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
    aim();
  });
  document.documentElement.addEventListener('pointerleave', () => {
    tx = 0;
    ty = 0;
    aim();
  });
}
