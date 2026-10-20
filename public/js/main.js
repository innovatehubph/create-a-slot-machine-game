import {
  SYMBOLS, BET_LEVELS, START_BALANCE, REELS,
  spinGrid, evaluate, totalBet,
} from './logic.js';
import { Reel } from './reels.js';
import * as sfx from './audio.js';
import { resizeFx, burst } from './fx.js';

const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG_NS = 'http://www.w3.org/2000/svg';
const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');
const fmtWin = (n) => '+' + fmt(n);

const ui = {
  balance: $('#balance'),
  bet: $('#bet'),
  total: $('#total'),
  lastWin: $('#lastWin'),
  betDown: $('#betDown'),
  betUp: $('#betUp'),
  spin: $('#spin'),
  sound: $('#sound'),
  reset: $('#reset'),
  message: $('#message'),
  grid: $('#grid'),
  lines: $('#lines'),
  banner: $('#banner'),
  bannerTitle: $('#bannerTitle'),
  bannerAmount: $('#bannerAmount'),
  paytable: $('#paytable'),
  loader: $('#loader'),
};

const state = {
  balance: START_BALANCE,
  betIndex: 2,
  spinning: false,
  lastWin: 0,
  wins: [],
  bannerTimer: 0,
};

const reels = [...document.querySelectorAll('.reel')].map(
  (root) => new Reel(root, {
    reduceMotion,
    onStep: () => sfx.tick(),
    onLand: () => sfx.reelStop(),
  }),
);

const betPerLine = () => BET_LEVELS[state.betIndex];
const stake = () => totalBet(betPerLine());
const MIN_STAKE = totalBet(BET_LEVELS[0]);

function renderHud() {
  ui.balance.textContent = fmt(state.balance);
  ui.bet.textContent = fmt(betPerLine());
  ui.total.textContent = fmt(stake());
  ui.spin.disabled = state.spinning || state.balance < stake();
  ui.betDown.disabled = state.spinning || state.betIndex === 0;
  const next = state.betIndex + 1;
  ui.betUp.disabled = state.spinning || next >= BET_LEVELS.length
    || totalBet(BET_LEVELS[next]) > state.balance;
  ui.reset.hidden = state.spinning || state.balance >= MIN_STAKE;
}

// Animate a number from `from` to `to`; a new call on the same node cancels the old one.
function countUp(node, from, to, ms, format = fmt) {
  cancelAnimationFrame(node._raf || 0);
  node.textContent = format(from);
  if (reduceMotion) {
    node.textContent = format(to);
    return;
  }
  const t0 = performance.now();
  const step = (now) => {
    const x = Math.min(1, (now - t0) / ms);
    node.textContent = format(from + (to - from) * (1 - (1 - x) ** 3));
    if (x < 1) node._raf = requestAnimationFrame(step);
  };
  node._raf = requestAnimationFrame(step);
}

function setMessage(text, tone = '') {
  ui.message.textContent = text;
  ui.message.className = 'message ' + tone;
  void ui.message.offsetWidth; // restart the entrance animation
  ui.message.classList.add('pop');
}

function clearWins() {
  state.wins = [];
  ui.lines.innerHTML = '';
  document.querySelectorAll('.cell.win').forEach((c) => c.classList.remove('win'));
  clearTimeout(state.bannerTimer);
  ui.banner.classList.remove('show');
}

function drawLines() {
  ui.lines.innerHTML = '';
  if (!state.wins.length) return;
  const box = ui.grid.getBoundingClientRect();
  ui.lines.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  for (const { rows } of state.wins) {
    const pts = rows.map((row, reel) => {
      const r = reels[reel].cellAt(row).getBoundingClientRect();
      return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
    });
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
    poly.setAttribute('pathLength', '1');
    poly.setAttribute('class', 'win-line');
    ui.lines.appendChild(poly);
    for (const [x, y] of pts) {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      dot.setAttribute('r', 6);
      dot.setAttribute('class', 'win-dot');
      ui.lines.appendChild(dot);
    }
  }
}

function showBanner(title, amount) {
  ui.bannerTitle.textContent = title;
  ui.bannerAmount.textContent = fmtWin(amount);
  ui.banner.classList.remove('show');
  void ui.banner.offsetWidth;
  ui.banner.classList.add('show');
  clearTimeout(state.bannerTimer);
  state.bannerTimer = setTimeout(() => ui.banner.classList.remove('show'), 2600);
}

async function spin() {
  if (state.spinning || state.balance < stake()) return;
  sfx.unlock();
  sfx.click();
  clearWins();

  const bet = betPerLine();
  const cost = totalBet(bet);
  state.spinning = true;
  state.balance -= cost;
  renderHud();
  ui.lastWin.textContent = fmt(0);
  setMessage('Good luck!');

  const grid = spinGrid(); // grid[reel][row]
  // Suspense: if the first two reels match on the middle row, slow the last reel down.
  const tense = grid[0][1].id === grid[1][1].id;

  reels.forEach((r) => r.spin());
  sfx.spinStart();
  const landed = reels.map((reel, i) => reel.stop(grid[i].map((s) => s.id), {
    delay: reduceMotion ? 150 + i * 120 : 700 + i * 420,
    tense: tense && i === REELS - 1,
  }));
  await Promise.all(landed);
  settle(grid, bet, cost);
}

function settle(grid, bet, cost) {
  const { wins, total } = evaluate(grid, bet);
  state.spinning = false;
  state.lastWin = total;
  const before = state.balance;
  state.balance += total;
  renderHud();

  if (total === 0) {
    ui.lastWin.textContent = fmt(0);
    setMessage('No win this time. Spin again!');
    return;
  }

  state.wins = wins;
  for (const { rows } of wins) {
    rows.forEach((row, reel) => reels[reel].cellAt(row).classList.add('win'));
  }
  drawLines();
  countUp(ui.balance, before, state.balance, 900);
  countUp(ui.lastWin, 0, total, 900, fmtWin);

  const mult = total / cost;
  const tier = mult >= 100 ? 'Jackpot' : mult >= 30 ? 'Mega win' : mult >= 10 ? 'Big win' : '';
  if (tier) {
    showBanner(tier, total);
    sfx.win(true);
  } else {
    sfx.win(false);
  }
  if (!reduceMotion) {
    const box = ui.grid.getBoundingClientRect();
    burst(box.left + box.width / 2, box.top + box.height / 2, Math.min(150, 40 + Math.round(mult * 3)));
  }
  const n = wins.length;
  setMessage(`${n} winning line${n > 1 ? 's' : ''}!`, 'win');
}

function changeBet(step) {
  if (state.spinning) return;
  const next = state.betIndex + step;
  if (next < 0 || next >= BET_LEVELS.length) return;
  if (step > 0 && totalBet(BET_LEVELS[next]) > state.balance) return;
  sfx.unlock();
  sfx.click();
  state.betIndex = next;
  renderHud();
}

function renderSound() {
  const m = sfx.isMuted();
  ui.sound.textContent = m ? '🔇' : '🔊';
  ui.sound.setAttribute('aria-pressed', String(m));
  ui.sound.setAttribute('aria-label', m ? 'Sound off' : 'Sound on');
}

ui.spin.addEventListener('click', spin);
ui.betDown.addEventListener('click', () => changeBet(-1));
ui.betUp.addEventListener('click', () => changeBet(1));
ui.sound.addEventListener('click', () => {
  sfx.unlock();
  sfx.setMuted(!sfx.isMuted());
  renderSound();
});
ui.reset.addEventListener('click', () => {
  state.balance = START_BALANCE;
  state.betIndex = 2;
  state.lastWin = 0;
  clearWins();
  ui.lastWin.textContent = fmt(0);
  setMessage('Credits restored. Good luck!');
  renderHud();
});

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.repeat) return;
  if (e.target.closest?.('button, a, input, select, textarea')) return; // let controls handle their own keys
  e.preventDefault();
  spin();
});

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    reels.forEach((r) => { r.measure(); r.render(); });
    resizeFx();
    drawLines();
  }, 120);
});

ui.paytable.innerHTML = SYMBOLS.slice().reverse().map((s) => `
  <div class="pay-card">
    <span class="pay-glyph" data-symbol="${s.id}">${s.glyph}</span>
    <span class="pay-name">${s.label}</span>
    <span class="pay-value">×${s.pay}</span>
  </div>`).join('');

resizeFx();
renderHud();
renderSound();
setMessage('Press Spin or the space bar to play');
requestAnimationFrame(() => ui.loader.classList.add('hide'));
