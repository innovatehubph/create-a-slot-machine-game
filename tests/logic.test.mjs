import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SYMBOLS, PAYLINES, BET_LEVELS, REELS, ROWS,
  pickSymbol, spinGrid, evaluate, totalBet, expectedReturn,
} from '../public/js/logic.js';

const S = (id) => SYMBOLS.find((s) => s.id === id);

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('pickSymbol maps the random range onto the weights', () => {
  assert.equal(pickSymbol(() => 0).id, 'cherry');
  assert.equal(pickSymbol(() => 0.999999).id, 'seven');
});

test('spinGrid returns reels x rows of symbols', () => {
  const grid = spinGrid(mulberry32(1));
  assert.equal(grid.length, REELS);
  for (const reel of grid) {
    assert.equal(reel.length, ROWS);
    for (const s of reel) assert.ok(SYMBOLS.includes(s));
  }
});

test('all cherries on every line pays every line', () => {
  const c = S('cherry');
  const grid = Array.from({ length: REELS }, () => Array(ROWS).fill(c));
  const { wins, total } = evaluate(grid, 5);
  assert.equal(wins.length, PAYLINES.length);
  assert.equal(total, PAYLINES.length * c.pay * 5);
});

test('a single diagonal win is detected on the right line', () => {
  const L = S('lemon');
  const C = S('cherry');
  const grid = Array.from({ length: REELS }, () => Array(ROWS).fill(L));
  grid[0][0] = C;
  grid[1][1] = C;
  grid[2][2] = C;
  const { wins, total } = evaluate(grid, 10);
  assert.equal(wins.length, 1);
  assert.equal(wins[0].lineIndex, 3);
  assert.equal(wins[0].symbol, 'cherry');
  assert.equal(total, C.pay * 10);
});

test('two of a kind does not pay', () => {
  // Middle row is lemon, lemon, bell: two matches, no payline is complete.
  const grid = [
    [S('cherry'), S('lemon'), S('grape')],
    [S('lemon'), S('lemon'), S('bell')],
    [S('grape'), S('bell'), S('bell')],
  ];
  const { wins, total } = evaluate(grid, 5);
  assert.equal(wins.length, 0);
  assert.equal(total, 0);
});

test('totalBet multiplies by the number of paylines', () => {
  assert.equal(totalBet(5), 5 * PAYLINES.length);
  assert.deepEqual(BET_LEVELS, [...BET_LEVELS].sort((a, b) => a - b));
});

test('analytic return to player is about 93.5%', () => {
  const rtp = expectedReturn();
  assert.ok(rtp > 0.934 && rtp < 0.935, `RTP was ${rtp}`);
});

test('simulated return to player agrees with the analytic value', () => {
  const rng = mulberry32(20261020);
  const spins = 300000;
  const bet = 1;
  let paid = 0;
  for (let i = 0; i < spins; i++) {
    paid += evaluate(spinGrid(rng), bet).total;
  }
  const simulated = paid / (spins * totalBet(bet));
  assert.ok(Math.abs(simulated - expectedReturn()) < 0.02, `simulated ${simulated}`);
});
