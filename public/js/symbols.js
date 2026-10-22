// Hand-drawn SVG artwork for each symbol. Gradients come from the shared <defs> block in index.html.
const art = (inner) => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${inner}</svg>`;

export const SYMBOL_ART = {
  cherry: art(`
    <path d="M36 54 Q42 32 52 16" fill="none" stroke="url(#gStem)" stroke-width="4" stroke-linecap="round"/>
    <path d="M66 60 Q61 36 52 16" fill="none" stroke="url(#gStem)" stroke-width="4" stroke-linecap="round"/>
    <path d="M52 16 Q66 2 86 10 Q74 26 52 16Z" fill="url(#gLeaf)"/>
    <circle cx="34" cy="70" r="19" fill="url(#gRed)"/>
    <circle cx="66" cy="66" r="19" fill="url(#gRed)"/>
    <ellipse cx="27" cy="62" rx="6" ry="3.5" fill="#fff" opacity=".75" transform="rotate(-25 27 62)"/>
    <ellipse cx="59" cy="58" rx="6" ry="3.5" fill="#fff" opacity=".75" transform="rotate(-25 59 58)"/>`),

  lemon: art(`
    <path d="M12 58 C16 30 50 22 72 33 C88 40 89 64 75 74 C56 86 22 82 12 58Z" fill="url(#gLemon)"/>
    <path d="M64 34 Q70 14 88 16 Q82 32 64 34Z" fill="url(#gLeaf)"/>
    <ellipse cx="34" cy="44" rx="13" ry="5" fill="#fff" opacity=".65" transform="rotate(-18 34 44)"/>
    <ellipse cx="52" cy="66" rx="16" ry="4" fill="#8a5a00" opacity=".12" transform="rotate(-10 52 66)"/>`),

  grape: art(`
    <path d="M50 26 Q52 14 62 8" fill="none" stroke="url(#gStem)" stroke-width="4" stroke-linecap="round"/>
    <path d="M55 16 Q74 4 86 16 Q72 26 55 16Z" fill="url(#gLeaf)"/>
    <circle cx="38" cy="36" r="12" fill="url(#gGrape)"/>
    <circle cx="62" cy="36" r="12" fill="url(#gGrape)"/>
    <circle cx="26" cy="56" r="12" fill="url(#gGrape)"/>
    <circle cx="50" cy="56" r="12" fill="url(#gGrape)"/>
    <circle cx="74" cy="56" r="12" fill="url(#gGrape)"/>
    <circle cx="38" cy="76" r="12" fill="url(#gGrape)"/>
    <circle cx="62" cy="76" r="12" fill="url(#gGrape)"/>
    <ellipse cx="34" cy="31" rx="4" ry="2.5" fill="#fff" opacity=".7" transform="rotate(-25 34 31)"/>
    <ellipse cx="58" cy="31" rx="4" ry="2.5" fill="#fff" opacity=".7" transform="rotate(-25 58 31)"/>
    <ellipse cx="46" cy="51" rx="4" ry="2.5" fill="#fff" opacity=".6" transform="rotate(-25 46 51)"/>`),

  bell: art(`
    <path d="M50 14 C34 14 28 28 28 44 L28 62 L18 74 L82 74 L72 62 L72 44 C72 28 66 14 50 14Z" fill="url(#gGold)"/>
    <circle cx="50" cy="12" r="5.5" fill="url(#gGoldDark)"/>
    <path d="M41 80 Q50 98 59 80 Z" fill="url(#gGoldDark)"/>
    <path d="M36 42 Q37 28 48 23" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
    <path d="M20 74 L80 74" stroke="#7a4f08" stroke-width="2" opacity=".35"/>`),

  diamond: art(`
    <polygon points="30,24 70,24 88,42 50,90 12,42" fill="url(#gDiamond)"/>
    <polygon points="30,24 70,24 88,42 12,42" fill="#fff" opacity=".4"/>
    <polyline points="12,42 50,90 88,42" fill="none" stroke="#0b2d66" stroke-width="1.5" opacity=".45"/>
    <line x1="30" y1="24" x2="50" y2="90" stroke="#fff" stroke-width="1" opacity=".4"/>
    <line x1="70" y1="24" x2="50" y2="90" stroke="#fff" stroke-width="1" opacity=".4"/>
    <polygon points="30,24 40,42 22,42" fill="#fff" opacity=".55"/>`),

  seven: art(`
    <text x="50" y="84" text-anchor="middle" font-family="Bungee, Impact, 'Arial Black', sans-serif" font-size="96" font-weight="900" fill="url(#gSeven)" stroke="#4a0712" stroke-width="3" paint-order="stroke">7</text>`),
};
