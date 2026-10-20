// Synthesised sound effects with the Web Audio API, so no audio files are needed.
const KEY = 'neonslots.muted';
let ctx = null;
let master = null;
let noiseBuf = null;
let lastTick = 0;
let muted = readMuted();

function readMuted() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function saveMuted(value) {
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    // Storage can be unavailable in private windows; the setting then lasts for this page only.
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  saveMuted(value);
  if (master) master.gain.value = value ? 0 : 0.5;
}

// Browsers only allow audio after a user gesture, so call this from a click or key handler.
export function unlock() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    noiseBuf = makeNoise(ctx);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function makeNoise(c) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function ready() {
  return ctx && !muted && ctx.state === 'running';
}

function noise(at, dur, { type = 'bandpass', freq = 2000, to = freq, q = 1, vol = 0.2 } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, at);
  filter.frequency.exponentialRampToValueAtTime(to, at + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(at, Math.random() * 0.2);
  src.stop(at + dur + 0.01);
}

function tone(at, freq, dur, { type = 'triangle', vol = 0.2, slideTo = null } = {}) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(master);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function click() {
  if (!ready()) return;
  tone(ctx.currentTime, 1400, 0.035, { type: 'square', vol: 0.05 });
}

// Called for every symbol that passes the window while a reel moves; throttled so it stays a light click.
export function tick() {
  if (!ready()) return;
  const now = ctx.currentTime;
  if (now - lastTick < 0.035) return;
  lastTick = now;
  noise(now, 0.03, { freq: 3200, q: 2.5, vol: 0.1 });
}

export function spinStart() {
  if (!ready()) return;
  noise(ctx.currentTime, 0.45, { type: 'lowpass', freq: 300, to: 2600, q: 0.7, vol: 0.14 });
}

export function reelStop() {
  if (!ready()) return;
  const now = ctx.currentTime;
  tone(now, 150, 0.16, { type: 'sine', vol: 0.45, slideTo: 55 });
  noise(now, 0.05, { freq: 800, q: 1, vol: 0.18 });
}

export function win(big = false) {
  if (!ready()) return;
  const now = ctx.currentTime;
  const notes = big
    ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1046.5, 1318.5, 1568]
    : [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(now + i * (big ? 0.09 : 0.075), f, big ? 0.5 : 0.28, { vol: 0.16 }));
}
