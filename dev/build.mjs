// Renders src/*.liquid for every scenario into dev/out/<scenario>_<view>_<device>.html with the real framework CSS/JS.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { Liquid } from 'liquidjs'; import { S } from './scenarios.mjs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const transform = createRequire(import.meta.url)('../src/transform.js');
const engine = new Liquid();
// Stand-in for TRMNL's qr_code filter: crisp SVG, `size` px per module, 2-module quiet zone.
const QR = createRequire(import.meta.url)('qrcode');
engine.registerFilter('qr_code', (text, size = 3, level = 'l') => {
  const q = QR.create(String(text), { errorCorrectionLevel: String(level).toUpperCase() }), n = q.modules.size, m = 2, w = (n + m * 2) * size;
  let r = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules.get(y, x)) r += `<rect x="${(x + m) * size}" y="${(y + m) * size}" width="${size}" height="${size}"/>`;
  return `<svg class="ld-qr" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" shape-rendering="crispEdges"><rect width="${w}" height="${w}" fill="#fff"/><g fill="#000">${r}</g></svg>`;
});
engine.registerFilter('number_with_delimiter', (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
engine.registerFilter('base64_encode', (s) => Buffer.from(String(s)).toString('base64'));
const DEV = { og: 'screen--og screen--1bit screen--md', x: 'screen--v2 screen--4bit screen--lg', xp: 'screen--v2 screen--4bit screen--lg screen--portrait' };
const MASH = { half_horizontal: ['mashup--1Tx1B', 2], half_vertical: ['mashup--1Lx1R', 2], quadrant: ['mashup--2x2', 4] };
const imgmap = fs.existsSync(path.join(root, 'dev/out/imgmap.json')) ? JSON.parse(read('dev/out/imgmap.json')) : {};
const MEASURE = `<script>window.addEventListener('load',()=>setTimeout(()=>{document.body.setAttribute('data-r',JSON.stringify([...document.querySelectorAll('.view img.image-dither')].map(i=>{const r=i.getBoundingClientRect();return [i.getAttribute('src'),r.width,r.height,!!i.closest('.bg--black'),getComputedStyle(i).objectFit]})))},1500))</script>`;
fs.mkdirSync(path.join(root, 'dev/out'), { recursive: true });
const data = {};
for (const [name, s] of Object.entries(S)) {
  
  const { loot } = transform(s.input()); data[name] = loot;
  for (const v of ['full', 'half_horizontal', 'half_vertical', 'quadrant']) for (const [dk, dc] of Object.entries(DEV)) {
    const id = `${name}_${v}_${dk}`;
    if (!fs.existsSync(path.join(root, `src/${v}.liquid`))) continue;
    const ctx = { loot, trmnl: { user: { locale: s.lang, utc_offset: s.off }, plugin_settings: { instance_name: 'Loot Drop', custom_fields_values: { language: 'auto' } } } };
    let body = await engine.parseAndRender(read('src/shared.liquid') + read(`src/${v}.liquid`), ctx);
    let k = 0; body = body.replace(/(<img class="image image-dither[^"]*" src=")([^"]+)/g, (a, p, src) => p + (imgmap[id] ? imgmap[id][k++] : src));
    let inner = `<div class="view view--${v}">${body}</div>`;
    const m = MASH[v];
    if (m) inner = `<div class="mashup ${m[0]}">${inner}${`<div class="view view--${v}"><div class="layout"></div></div>`.repeat(m[1] - 1)}</div>`;
    fs.writeFileSync(path.join(root, `dev/out/${id}.html`), `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://trmnl.com/css/latest/plugins.css"><script src="https://trmnl.com/js/latest/plugins.js"></script></head><body class="environment trmnl"><div class="screen ${dc}">${inner}</div>${process.env.MEASURE ? MEASURE : ''}</body></html>`);
  }
}
fs.writeFileSync(path.join(root, 'dev/out/data.json'), JSON.stringify(data, null, 1));
