import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SYMBOLS } from '../public/js/logic.js';
import { SYMBOL_ART } from '../public/js/symbols.js';

test('every symbol has SVG artwork', () => {
  for (const s of SYMBOLS) {
    assert.ok(SYMBOL_ART[s.id], `missing art for ${s.id}`);
    assert.match(SYMBOL_ART[s.id], /^<svg viewBox="0 0 100 100"/);
  }
});
