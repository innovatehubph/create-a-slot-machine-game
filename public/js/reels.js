// Reel animation: a looping virtual tape per reel, eased landing and a small settle bounce.
import { SYMBOLS, pickSymbol } from './logic.js';

const GLYPH = Object.fromEntries(SYMBOLS.map((s) => [s.id, s.glyph]));
const TAPE_LEN = 24;        // symbols on each reel's virtual tape
const MAX_SPEED = 15;       // cells per second at full spin
const ACCEL_TIME = 0.25;    // seconds to reach full spin speed
const MIN_LAND_CELLS = 6;   // distance travelled while landing (must exceed visible rows)
const SETTLE_TIME = 0.2;    // bounce duration after landing
const BOUNCE_CELLS = 0.12;  // overshoot on settle

const wrap = (v, m) => ((v % m) + m) % m;
const easeOutCubic = (x) => 1 - (1 - x) ** 3;

export class Reel {
  constructor(root, { reduceMotion = false, onStep = null, onLand = null } = {}) {
    this.windowEl = root.querySelector('.reel-window');
    this.strip = root.querySelector('.reel-strip');
    this.reduce = reduceMotion;
    this.onStep = onStep;
    this.onLand = onLand;

    this.cells = [];
    for (let i = 0; i < TAPE_LEN; i++) {
      const el = document.createElement('div');
      el.className = 'cell';
      this.strip.appendChild(el);
      this.cells.push(el);
    }
    for (let i = 0; i < TAPE_LEN; i++) this.setCell(i, pickSymbol().id);

    this.p = 0;            // current position in cells
    this.v = 0;            // current speed in cells per second
    this.mode = 'idle';    // idle | spin | landing | settle
    this.pending = null;   // { ids, timeLeft, tense } waiting for its stop delay
    this.tween = null;
    this.settleT = 0;
    this.resolve = null;
    this.landIndex = 0;
    this.lastStep = 0;
    this.frame = null;
    this.last = 0;
    this.cellH = 100;
    this.measure();
    this.render();
  }

  measure() {
    this.cellH = this.cells[0].offsetHeight || 100;
  }

  setCell(i, id) {
    const idx = wrap(i, TAPE_LEN);
    const el = this.cells[idx];
    el.dataset.symbol = id;
    el.textContent = GLYPH[id];
  }

  // Element showing the given row (0 = top) after the reel has landed.
  cellAt(row) {
    return this.cells[wrap(this.landIndex + row, TAPE_LEN)];
  }

  spin() {
    if (this.mode !== 'idle') return;
    this.mode = 'spin';
    this.v = 0;
    this.pending = null;
    this.kick();
  }

  // ids: symbol ids for rows top, middle, bottom. Resolves once the reel has settled.
  stop(ids, { delay = 0, tense = false } = {}) {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.pending = { ids, timeLeft: delay / 1000, tense };
      if (tense) this.windowEl.classList.add('tense');
    });
  }

  kick() {
    if (this.frame) return;
    this.last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.step(dt);
      this.render();
      this.frame = this.mode === 'idle' ? null : requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  step(dt) {
    if (this.mode === 'spin' && this.pending) {
      this.pending.timeLeft -= dt;
      if (this.pending.timeLeft <= 0) this.beginLanding();
    }

    if (this.mode === 'spin') {
      const top = this.reduce ? MAX_SPEED * 0.6 : MAX_SPEED;
      this.v = Math.min(top, this.v + (top / ACCEL_TIME) * dt);
      this.p += this.v * dt;
      this.windowEl.classList.toggle('blur', !this.reduce && this.v > 8);
    } else if (this.mode === 'landing') {
      const tw = this.tween;
      tw.t += dt;
      const x = Math.min(1, tw.t / tw.T);
      this.p = tw.from + (tw.to - tw.from) * easeOutCubic(x);
      if (x >= 1) {
        this.p = tw.to;
        this.mode = 'settle';
        this.settleT = 0;
      }
    } else if (this.mode === 'settle') {
      this.settleT += dt;
      const x = Math.min(1, this.settleT / SETTLE_TIME);
      this.p = this.tween.to + (this.reduce ? 0 : BOUNCE_CELLS * Math.sin(Math.PI * x));
      if (x >= 1) this.finish();
    }

    if (this.onStep && (this.mode === 'spin' || this.mode === 'landing')) {
      const s = Math.floor(this.p);
      if (s !== this.lastStep) {
        this.lastStep = s;
        this.onStep(this);
      }
    }
  }

  beginLanding() {
    const { ids, tense } = this.pending;
    this.pending = null;
    const p0 = this.p;
    const minDist = this.reduce ? 4 : MIN_LAND_CELLS + (tense ? 2 : 0);
    // Write the result into tape cells that are still off-screen, then ease onto them.
    const to = Math.ceil(p0 + minDist);
    ids.forEach((id, row) => this.setCell(to + row, id));

    const d = to - p0;
    const v0 = Math.max(this.v, 4);
    let T = Math.max(this.reduce ? 0.3 : 0.9, (3 * d) / v0); // initial slope matches current speed
    if (tense) T *= 1.3;
    this.tween = { from: p0, to, t: 0, T };
    this.landIndex = to;
    this.mode = 'landing';
  }

  finish() {
    this.p = wrap(this.tween.to, TAPE_LEN);
    this.mode = 'idle';
    this.v = 0;
    this.tween = null;
    this.windowEl.classList.remove('blur', 'tense');
    this.render();
    if (this.onLand) this.onLand(this);
    const resolve = this.resolve;
    this.resolve = null;
    if (resolve) resolve();
  }

  render() {
    const h = this.cellH;
    for (let i = 0; i < TAPE_LEN; i++) {
      let r = wrap(i - this.p, TAPE_LEN);
      if (r > TAPE_LEN / 2) r -= TAPE_LEN;
      this.cells[i].style.transform = `translate3d(0,${(r * h).toFixed(2)}px,0)`;
    }
  }
}
