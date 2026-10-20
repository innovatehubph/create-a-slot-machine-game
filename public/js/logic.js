// Pure game logic: symbols, weighted random picks, paylines and payouts.
// No DOM access, so it can run in the browser and under `node --test`.

export const REELS = 3;
export const ROWS = 3;
export const START_BALANCE = 1000;

// `weight` is the relative chance of a symbol landing on any cell.
// `pay` is the multiplier of the line bet for three of a kind on one payline.
export const SYMBOLS = [
  { id: 'cherry', glyph: '🍒', label: 'Cherry', weight: 10, pay: 7 },
  { id: 'lemon', glyph: '🍋', label: 'Lemon', weight: 8, pay: 15 },
  { id: 'grape', glyph: '🍇', label: 'Grape', weight: 6, pay: 30 },
  { id: 'bell', glyph: '🔔', label: 'Bell', weight: 4, pay: 70 },
  { id: 'diamond', glyph: '💎', label: 'Diamond', weight: 2, pay: 200 },
  { id: 'seven', glyph: '7', label: 'Seven', weight: 1, pay: 600 },
];

// Each payline lists the row (0 = top, 2 = bottom) it uses on reel 0, 1 and 2.
export const PAYLINES = [
  [1, 1, 1], // middle row
  [0, 0, 0], // top row
  [2, 2, 2], // bottom row
  [0, 1, 2], // diagonal down
  [2, 1, 0], // diagonal up
];

export const BET_LEVELS = [1, 2, 5, 10, 20, 50, 100]; // bet per line

const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);

export function randomUnit() {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

export function pickSymbol(rng = randomUnit) {
  let r = rng() * TOTAL_WEIGHT;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r < 0) return s;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

// grid[reel][row] -> symbol
export function spinGrid(rng = randomUnit) {
  return Array.from({ length: REELS }, () =>
    Array.from({ length: ROWS }, () => pickSymbol(rng)),
  );
}

export function totalBet(betPerLine) {
  return betPerLine * PAYLINES.length;
}

export function evaluate(grid, betPerLine) {
  const wins = [];
  PAYLINES.forEach((rows, lineIndex) => {
    const symbols = rows.map((row, reel) => grid[reel][row]);
    const first = symbols[0];
    if (symbols.every((s) => s.id === first.id)) {
      wins.push({
        lineIndex,
        rows,
        symbol: first.id,
        amount: first.pay * betPerLine,
      });
    }
  });
  const total = wins.reduce((sum, w) => sum + w.amount, 0);
  return { wins, total };
}

// Analytic return to player as a fraction of the stake.
// Lines share cells, but each line's expected payout depends only on its own
// three independent cells, so the sum over lines is exact.
export function expectedReturn() {
  return SYMBOLS.reduce((acc, s) => acc + (s.weight / TOTAL_WEIGHT) ** 3 * s.pay, 0);
}
