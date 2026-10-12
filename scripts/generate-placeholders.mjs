// Generates stylised SVG placeholder images into public/images.
// Run with: npm run images   — replace the output with real photography for a client.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const { PRODUCTS } = await import(pathToFileURL(path.join(root, 'js', 'products.js')).href);

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => clamp(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Simple silhouettes drawn in an 800x1000 box
const SHAPES = {
  Outerwear: 'M300 210 L400 250 L500 210 L625 300 L605 840 L440 850 L440 420 L400 395 L360 420 L360 850 L195 840 L175 300 Z',
  Dresses: 'M335 220 L400 300 L465 220 L505 255 L485 430 L585 820 Q400 870 215 820 L315 430 L295 255 Z',
  Knitwear: 'M320 235 Q400 295 480 235 L630 335 L585 490 L525 450 L525 770 L275 770 L275 450 L215 490 L170 335 Z',
  Trousers: 'M295 240 L505 240 L545 810 L430 810 L400 450 L370 810 L255 810 Z',
  Accessories: 'M255 470 H545 L580 790 H220 Z',
};

function svg({ w = 800, h = 1000, bgA, bgB, shape, fill, flip = false, label = '' }) {
  const dark = shade(fill, -0.3);
  const light = shade(fill, 0.25);
  const bag = shape === SHAPES.Accessories;
  const handle = bag
    ? `<path d="M330 470 C330 290 470 290 470 470" fill="none" stroke="${dark}" stroke-width="16" stroke-linecap="round"/>`
    : '';
  const folds = bag
    ? ''
    : `<path d="M400 400 V820" stroke="${dark}" stroke-width="3" opacity=".35"/>
       <path d="M340 470 Q330 640 300 800 M460 470 Q470 640 500 800" stroke="${dark}" stroke-width="3" fill="none" opacity=".25"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${fill}"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <path d="M${flip ? 130 : 200} 1000 V430 A${flip ? 270 : 200} ${flip ? 270 : 200} 0 0 1 ${flip ? 670 : 600} 430 V1000 Z" fill="#fff" opacity=".28"/>
  <ellipse cx="400" cy="900" rx="210" ry="22" fill="#000" opacity=".12"/>
  <g transform="${flip ? 'translate(800 0) scale(-1 1)' : ''}">
    ${handle}
    <path d="${shape}" fill="url(#g)" stroke="${dark}" stroke-width="3" stroke-opacity=".45" stroke-linejoin="round"/>
    ${folds}
  </g>
</svg>
`;
}

await mkdir(path.join(root, 'images'), { recursive: true });
const out = (name, data) => writeFile(path.join(root, 'images', name), data);

const bgs = [['#dfe4ea', '#c4ccd6'], ['#ead9dc', '#d7bcc2'], ['#d9e0dc', '#bfcbc4'], ['#e3e1ea', '#c9c5d8']];

let i = 0;
for (const p of PRODUCTS) {
  const shape = SHAPES[p.category];
  const [a1, b1] = bgs[i % bgs.length];
  const [a2, b2] = bgs[(i + 1) % bgs.length];
  const c2 = (p.colors[1] || p.colors[0]).hex;
  await out(p.id + '-a.svg', svg({ bgA: a1, bgB: b1, shape, fill: p.colors[0].hex, label: p.name }));
  await out(p.id + '-b.svg', svg({ bgA: a2, bgB: b2, shape, fill: c2, flip: true, label: p.name + ' alternate view' }));
  i++;
}

// Hero: coat, dress and trousers on a wide canvas
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100" role="img" aria-label="Campaign placeholder">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9d3d6"/><stop offset="1" stop-color="#cdb3ba"/></linearGradient></defs>
  <rect width="900" height="1100" fill="url(#bg)"/>
  <path d="M120 1100 V520 A330 330 0 0 1 780 520 V1100 Z" fill="#fff" opacity=".32"/>
  <ellipse cx="450" cy="1000" rx="330" ry="26" fill="#000" opacity=".12"/>
  <g transform="translate(60 40) scale(1.0)"><path d="${SHAPES.Outerwear}" fill="#4a5d70"/><path d="M400 395 V850" stroke="#2e3d4c" stroke-width="3" opacity=".4"/></g>
  <g transform="translate(330 120) scale(.82)"><path d="${SHAPES.Dresses}" fill="#7a1f34"/></g>
</svg>
`;
await out('hero.svg', hero);

const looks = [
  [SHAPES.Outerwear, '#7a1f34', '#e3e1ea', '#c9c5d8'],
  [SHAPES.Dresses, '#a9b9c9', '#ead9dc', '#d7bcc2'],
  [SHAPES.Trousers, '#1d2a44', '#d9e0dc', '#bfcbc4'],
];
for (let n = 0; n < looks.length; n++) {
  const [shape, fill, a, b] = looks[n];
  await out(`look-${n + 1}.svg`, svg({ w: 800, h: 1000, bgA: a, bgB: b, shape, fill, flip: n === 1, label: `Look ${n + 1}` }));
}
console.log('Placeholder images written to public/images');
