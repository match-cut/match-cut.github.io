// Pixel helpers shared by the game (browser) and build-profiles.js (Node): a 5x7 bitmap font and the avatar drawing.
//  * Pixel.avatar(seed) -> {vb, bg, fill, rects:[[x,y,w,h]...]}   (draw the rects in `fill` on a `bg` square of vb x vb units)
//    - normal seed: GitHub-style 5x5 mirrored identicon (vb 6)
//    - seed starting with "@" (e.g. "@knox"): the name written in pixel letters in a gold frame (vb 20). Only the dev account may have such
//      a seed: the database rules reject '@' avatars from anyone else, and avatars can't be uploaded, so no other profile can look like this.
(function (root) {
'use strict';
const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'], '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'], '#': ['.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.#.#.'],
  ':': ['.....', '..#..', '.....', '.....', '..#..', '.....', '.....'], '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'], ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};
const glyph = ch => G[String(ch).toUpperCase()] || G[' '];

// Text as rects at (x, y), each font pixel = `s` units, 1 pixel gap between letters. Returns {rects, w, h}.
function text(str, x, y, s) {
  const rects = [];
  let cx = x;
  for (const ch of String(str)) {
    glyph(ch).forEach((row, ry) => { for (let rx = 0; rx < 5; rx++) if (row[rx] === '#') rects.push([cx + rx * s, y + ry * s, s, s]); });
    cx += 6 * s;
  }
  return {rects, w: Math.max(0, String(str).length * 6 - 1) * s, h: 7 * s};
}

function cyrb(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return [h1 >>> 0, h2 >>> 0];
}

function avatar(seed) {
  seed = String(seed || '?');
  if (seed[0] === '~' && SPRITES[seed.slice(1)]) return spriteAvatar(seed.slice(1));
  if (seed[0] === '@') {   // dev/owner avatar: the name in pixel letters (up to 4 characters, two per row) inside a gold frame
    const name = seed.slice(1).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || '?';
    const rows = name.length <= 2 ? [name] : [name.slice(0, 2), name.slice(2)];
    const rects = [[0, 0, 20, 1], [0, 19, 20, 1], [0, 0, 1, 20], [19, 0, 1, 20]];
    const totalH = rows.length * 7 + (rows.length - 1) * 2, y0 = Math.floor((20 - totalH) / 2);
    rows.forEach((r, i) => { const w = r.length * 6 - 1; rects.push(...text(r, Math.floor((20 - w) / 2), y0 + i * 9, 1).rects); });
    return {vb: 20, bg: '#0b0f0b', layers: [{fill: '#ffd84a', rgb: [255, 216, 74], rects}], bgRgb: [11, 15, 11]};
  }
  const [a, b] = cyrb(seed), rects = [];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if ((a >>> (y * 3 + x)) & 1) { rects.push([x + .5, y + .5, 1, 1]); if (x < 2) rects.push([4 - x + .5, y + .5, 1, 1]); }
  const hue = b % 360;
  return {vb: 6, bg: '#0b0f0b', layers: [{fill: `hsl(${hue} 70% 60%)`, rgb: hslToRgb(hue, .7, .6), rects}], bgRgb: [11, 15, 11]};
}

// ---- pixel-art sprites: avatars with a seed "~<id>" (24 of them: animals, creatures and kaomoji-style faces) ----
// 12x12, drawn as the LEFT half (6 characters per row) and mirrored; m = overrides applied to both sides, f = overrides applied once ([x, y, char]).
// '.' is the tile background, the other characters are palette entries ('k' = the dark outline).
const KK = '#14161c';
const SP = (name, bg, pal, h, m, f) => ({name, bg, pal: {k: KK, ...pal}, h, m: m || [], f: f || []});
const FACE = ['......', '..kkkk', '.kyyyy', 'kyyyyy', 'kyyyyy', 'kyyyyy', 'kyyyyy', 'kyyyyy', 'kyyyyy', '.kyyyy', '..kkkk', '......'];
const SPRITES = {
  cat: SP('Cat', '#5d84c4', {o: '#f2a65a', d: '#c0702a', w: '#fff2dc', p: '#ff8fa3', g: '#6fe37d'},
    ['.k....', '.kk...', '.kpk..', '.kookk', 'kooooo', 'koddoo', 'kogkoo', 'koooww', 'kooowp', '.kowwk', '..kkkk', '......']),
  dog: SP('Dog', '#6f9a58', {t: '#d9a066', b: '#8a5226', w: '#fff0d8', p: '#ff8fa3'},
    ['......', '..kkkk', '.ktttt', 'kbbttt', 'kbbktt', 'kbbttt', 'kbbtww', '.kttwk', '.kttwk', '..kwwp', '...kkk', '......']),
  fox: SP('Fox', '#8a6fb8', {o: '#f07b2a', w: '#ffffff', d: '#8a3b12'},
    ['.k....', '.kk...', '.kok..', '.kookk', 'kooooo', 'kookoo', 'kowwoo', 'kowwww', '.kwwwk', '..kwwk', '...kkk', '......']),
  frog: SP('Frog', '#7fb0d9', {g: '#5cc24a', l: '#a8f07a', w: '#ffffff'},
    ['.kkk..', 'kwwwk.', 'kwkwk.', 'kkgggg', 'kggggg', 'kgggkg', 'kggggg', 'kkkkkk', 'kgllgg', '.kllll', '..kkkk', '......']),
  owl: SP('Owl', '#6d78c4', {b: '#8a5a2b', t: '#d9a066', w: '#ffffff', y: '#ffd84a'},
    ['.k....', '.kbk..', '.kbbkk', 'kbbbbb', 'kbwwwb', 'kbwkwb', 'kbwwwb', 'kbbbby', '.kttty', '.ktttt', '..kkkk', '......']),
  panda: SP('Panda', '#7aae95', {w: '#f5f5f5'},
    ['kk....', 'kkk...', 'kkkwww', '.kwwww', 'kwwwww', 'kwkkww', 'kwkwww', 'kwwwwk', '.kwwwk', '..kwww', '...kkk', '......']),
  penguin: SP('Penguin', '#6fb2d9', {w: '#f5f5f5', o: '#ff9e2a'},
    ['..kkkk', '.kkkkk', 'kkkkkk', 'kkwwkk', 'kkwkkk', 'kkkkko', 'kwwwwo', 'kwwwww', 'kwwwww', '.kwwww', '..kooo', '......']),
  rabbit: SP('Rabbit', '#b08fd0', {w: '#fbfbfb', p: '#ff9fb5'},
    ['.kk...', 'kwwk..', 'kwpk..', 'kwpk..', 'kwwkkk', 'kwwwww', 'kwkwww', 'kwwwww', 'kwwwwp', '.kwwwk', '..kkkk', '......']),
  bear: SP('Bear', '#6fa8a0', {b: '#a0622d', t: '#e0b27a'},
    ['.kk...', 'kbbk..', 'kbbkkk', '.kbbbb', 'kbbbbb', 'kbkbbb', 'kbbbbb', 'kbbttt', 'kbbttk', '.kbttt', '..kkkk', '......']),
  pig: SP('Pig', '#8d7ac4', {p: '#ff9fb8', d: '#ff6f98'},
    ['.kk...', 'kppk..', 'kppkkk', '.kpppp', 'kppppp', 'kpkppp', 'kppppp', 'kpdddd', 'kpddkd', '.kpddd', '..kkkk', '......']),
  bee: SP('Bee', '#7a8fd0', {y: '#ffd84a', c: '#bfe9ff'},
    ['.k....', '.k....', '..kkkk', '.kyyyy', 'kyyyyy', 'kykyyy', 'kyyyyy', 'kkkkkk', 'kyyyyy', '.kkkkk', '...kkk', '......'], [], [[0, 3, 'c'], [0, 4, 'c'], [11, 3, 'c'], [11, 4, 'c']]),
  chick: SP('Chick', '#6aa9d9', {y: '#ffe066', o: '#ff9e2a'},
    ['......', '..kkkk', '.kyyyy', 'kyyyyy', 'kyykyy', 'kyyyyo', 'kyyyoo', 'kyyyyy', '.kyyyy', '..kkkk', '..ooo.', '......']),
  ghost: SP('Ghost', '#6f7fc4', {w: '#f4f7ff'},
    ['..kkkk', '.kwwww', 'kwwwww', 'kwwwww', 'kwkkww', 'kwkkww', 'kwwwww', 'kwwwkk', 'kwwwkk', 'kwwwww', 'kwkwwk', '.k.kk.']),
  robot: SP('Robot', '#7ab08a', {s: '#b0bec5', c: '#4dd0e1', r: '#ff5252', w: '#ffffff'},
    ['....rr', '....kk', '.kkkkk', 'ksssss', 'ksccss', 'ksccss', 'ksssss', 'kskkkk', 'kswsws', 'ksssss', '.kkkkk', '......']),
  alien: SP('Alien', '#8d6fb0', {g: '#7ee06a'},
    ['..kkkk', '.kgggg', 'kggggg', 'kggggg', 'kgkkgg', 'kgkkkg', 'kggkkg', 'kggggg', '.kgggg', '..kggk', '...kkk', '......']),
  skull: SP('Skull', '#6b6f9a', {w: '#f1efe6'},
    ['..kkkk', '.kwwww', 'kwwwww', 'kwwwww', 'kwkkww', 'kwkkww', 'kwwwww', 'kwwwwk', '.kwwww', '..kwkw', '..kwkw', '...kkk']),
  // kaomoji-style faces
  happy: SP('Happy ^_^', '#5d84c4', {y: '#ffd84a', p: '#ff8fa3'}, FACE, [[2, 5, 'k'], [3, 4, 'k'], [4, 5, 'k'], [3, 7, 'k'], [4, 8, 'k'], [5, 8, 'k'], [2, 6, 'p']]),
  angry: SP('Angry >_<', '#8a4a4a', {y: '#ff7a59'}, FACE, [[2, 3, 'k'], [3, 4, 'k'], [2, 5, 'k'], [4, 8, 'k'], [5, 8, 'k']]),
  cry: SP('Cry T_T', '#5d84c4', {y: '#ffe08a', b: '#4aa3ff'}, FACE, [[2, 3, 'k'], [3, 3, 'k'], [4, 3, 'k'], [3, 4, 'k'], [3, 5, 'k'], [3, 6, 'b'], [3, 7, 'b'], [4, 8, 'k'], [5, 7, 'k']]),
  cool: SP('Cool B)', '#7a6fb8', {y: '#ffd84a', w: '#ffffff'}, FACE, [[2, 4, 'k'], [3, 4, 'k'], [4, 4, 'k'], [5, 4, 'k'], [2, 5, 'k'], [3, 5, 'k'], [4, 5, 'k'], [3, 4, 'w']], [[4, 8, 'k'], [5, 8, 'k'], [6, 8, 'k'], [7, 8, 'k'], [8, 7, 'k']]),
  wink: SP('Wink ;)', '#b06fa8', {y: '#ffd84a', p: '#ff8fa3', w: '#ffffff'}, FACE, [[3, 7, 'k'], [4, 8, 'k'], [5, 8, 'k'], [2, 6, 'p']], [[2, 4, 'k'], [3, 4, 'k'], [4, 4, 'k'], [7, 3, 'w'], [8, 3, 'k'], [7, 4, 'k'], [8, 4, 'k']]),
  love: SP('Love <3', '#6f5a9f', {y: '#ffd84a', r: '#ff3b5c'}, FACE, [[2, 3, 'r'], [4, 3, 'r'], [2, 4, 'r'], [3, 4, 'r'], [4, 4, 'r'], [3, 5, 'r'], [3, 7, 'k'], [4, 8, 'k'], [5, 8, 'k']]),
  shock: SP('Shock o_o', '#5fa0a0', {y: '#ffd84a', w: '#ffffff'}, FACE, [[3, 4, 'w'], [4, 4, 'w'], [3, 5, 'w'], [4, 5, 'k']], [[5, 8, 'k'], [6, 8, 'k'], [5, 9, 'k'], [6, 9, 'k']]),
  sleepy: SP('Sleepy -_-', '#6f7ab8', {y: '#c9b6ff'}, FACE, [[2, 5, 'k'], [3, 5, 'k'], [4, 5, 'k']], [[5, 8, 'k'], [6, 8, 'k']]),
};
const SPRITE_IDS = Object.keys(SPRITES);
function spriteGrid(sp) {
  const g = sp.h.map(r => (r + [...r].reverse().join('')).split(''));
  sp.m.forEach(([x, y, c]) => { g[y][x] = c; g[y][11 - x] = c; });
  sp.f.forEach(([x, y, c]) => { g[y][x] = c; });
  return g;
}
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function spriteAvatar(id) {
  const sp = SPRITES[id], g = spriteGrid(sp), by = new Map();
  g.forEach((row, y) => {
    for (let x = 0; x < 12;) {
      const c = row[x];
      if (c === '.' || !sp.pal[c]) { x++; continue; }
      let e = x;
      while (e + 1 < 12 && row[e + 1] === c) e++;
      if (!by.has(c)) by.set(c, []);
      by.get(c).push([x, y, e - x + 1, 1]);
      x = e + 1;
    }
  });
  const layers = [...by].map(([c, rects]) => ({fill: sp.pal[c], rgb: hexRgb(sp.pal[c]), rects}));
  return {vb: 12, bg: sp.bg, bgRgb: hexRgb(sp.bg), layers, name: sp.name};
}
const randomSeed = () => '~' + SPRITE_IDS[Math.floor(Math.random() * SPRITE_IDS.length)];   // a random sprite (default for new players)
const randomPatternSeed = () => Array.from({length: 6}, () => Math.floor(Math.random() * 36).toString(36)).join('');   // a random GitHub-style pattern

function hslToRgb(h, s, l) {
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// File name of an avatar's PNG (av/<name>.png, generated by build-profiles.js; used as the chat mirror's avatar picture)
const seedFile = seed => String(seed || '?').replace(/^@/, 'at_').replace(/^~/, 'px_').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60);

const api = {glyph, text, avatar, cyrb, hslToRgb, seedFile, sprites: SPRITE_IDS.map(id => ({id, seed: '~' + id, name: SPRITES[id].name})), randomSeed, randomPatternSeed};
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Pixel = api;
})(typeof window !== 'undefined' ? window : globalThis);
