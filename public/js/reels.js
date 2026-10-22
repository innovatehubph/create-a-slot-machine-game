// Reel drum animation: each reel is a 3D cylinder of symbols that spins, eases onto a result and settles.
import { pickSymbol } from './logic.js';
import { SYMBOL_ART } from './symbols.js';

const TAPE_LEN = 16;                        // symbols around each drum
const STEP = 22.5;                          // degrees between neighbouring symbols
const STEP_RAD = (STEP * Math.PI) / 180;
const MAX_SPEED = 12;                       // symbols per second at full spin
const ACCEL_TIME = 0.25;                    // seconds to reach full spin speed
const MIN_LAND_CELLS = 5;                   // travel while landing; overwritten symbols stay behind the drum
const SETTLE_TIME = 0.2;                    // bounce duration after landing
const BOUNCE_CELLS = 0.12;                  // overshoot on settle

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
    this.faces = [];
    this.shades = [];
    for (let i = 0; i < TAPE_LEN; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const face = document.createElement('div');
      face.className = 'face';
      const shade = document.createElement('div');
      shade.className = 'shade';
      cell.append(face, shade);
      this.strip.appendChild(cell);
      this.cells.push(cell);
      this.faces.push(face);
      this.shades.push(shade);
    }
    for (let i = 0; i < TAPE_LEN; i++) this.setCell(i, pickSymbol().id);

    this.p = 0;            // current position in symbols
    this.v = 0;            // current speed in symbols per second
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
    this.radius = 100 / Math.sin(STEP_RAD);
    this.measure();
    this.render();
  }

  measure() {
    this.cellH = this.cells[0].offsetHeight || 100;
    this.radius = this.cellH / Math.sin(STEP_RAD);
  }

  setCell(i, id) {
    const idx = wrap(i, TAPE_LEN);
    this.cells[idx].dataset.symbol = id;
    this.faces[idx].innerHTML = SYMBOL_ART[id];
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
    // Write the result onto symbols behind the drum, then ease the drum onto them.
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
    this.windowEl.classList.remove('blur', 'tense', 'sheen');
    void this.windowEl.offsetWidth;
    this.windowEl.classList.add('sheen');
    this.render();
    if (this.onLand) this.onLand(this);
    const resolve = this.resolve;
    this.resolve = null;
    if (resolve) resolve();
  }

  // Place each symbol on the drum: row 1 (middle) faces the viewer, rows 0 and 2 curve away.
  render() {
    const R = this.radius;
    for (let i = 0; i < TAPE_LEN; i++) {
      let r = wrap(i - this.p, TAPE_LEN);
      if (r > TAPE_LEN / 2) r -= TAPE_LEN;
      const th = (r - 1) * STEP_RAD;
      const cos = Math.cos(th);
      const y = R * Math.sin(th);
      const z = R * (cos - 1);
      const tilt = (-th * 180) / Math.PI;
      this.cells[i].style.transform =
        `translate3d(0,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${tilt.toFixed(2)}deg)`;
      this.shades[i].style.opacity = Math.min(0.62, (1 - cos) * 3).toFixed(3);
    }
  }
}
