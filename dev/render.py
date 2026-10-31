# Device-faithful mockups: measure every dithered image, prepare it for its exact box and panel, shoot, quantize.
# Usage: python3 dev/render.py [filter]   (from repo root, with `python3 -m http.server 8793` running)
import json, os, re, subprocess, glob, sys, hashlib, urllib.request, io, html
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
C = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
only = sys.argv[1] if len(sys.argv) > 1 else ''
def size(id): return (1404, 1872) if id.endswith('_xp') else (1872, 1404) if id.endswith('_x') else (800, 480)
def chrome(*a): return subprocess.run([C, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=15000', *a], capture_output=True, text=True).stdout
def src(url, dark=False):
    os.makedirs('dev/cache', exist_ok=True); f = 'dev/cache/' + hashlib.md5(url.encode()).hexdigest() + '.png'
    if not os.path.exists(f) or not os.path.getsize(f):
        b = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})).read(); open(f, 'wb').write(b)
    im = Image.open(f).convert('RGBA'); bg = Image.new('RGBA', im.size, 'black' if dark else 'white'); bg.alpha_composite(im); return bg.convert('L')
env = {**os.environ, 'TZ': 'UTC'}
if os.path.exists('dev/out/imgmap.json'): os.remove('dev/out/imgmap.json')
subprocess.run(['node', 'dev/build.mjs'], env={**env, 'MEASURE': '1'}, check=True)
pages = [f for f in sorted(glob.glob('dev/out/*.html')) if only in f]
def measure(f):
    id = os.path.basename(f)[:-5]; w, h = size(id)
    dom = chrome(f'--window-size={w},{h}', '--dump-dom', f'http://localhost:8793/{f}')
    return id, json.loads(html.unescape(re.search(r'data-r="([^"]*)"', dom).group(1)))
os.makedirs('dev/out/img', exist_ok=True); imgmap = {}
with ThreadPoolExecutor(8) as ex: found = list(ex.map(measure, pages))
pal = Image.new('P', (1, 1)); pal.putpalette(sum([[i * 17] * 3 for i in range(16)], []) + [0] * 720)
for id, imgs in found:
    imgmap[id] = []
    for k, (url, bw, bh, dark, fit) in enumerate(imgs):
        im = src(url, dark)
        if fit == 'cover':
            s = max(bw / im.width, bh / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
            x, y = (im.width - round(bw)) // 2, (im.height - round(bh)) // 2; im = im.crop((x, y, x + round(bw), y + round(bh)))
        else:
            s = min(bw / im.width, bh / im.height)
            im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        im = im.convert('1') if id.endswith('_og') else im.convert('RGB').quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG).convert('L')
        out = f'dev/out/img/{id}_{k}.png'; im.save(out); imgmap[id].append('img/' + os.path.basename(out))
json.dump(imgmap, open('dev/out/imgmap.json', 'w'))
subprocess.run(['node', 'dev/build.mjs'], env=env, check=True)
os.makedirs('concept/device', exist_ok=True)
def shoot(f):
    id = os.path.basename(f)[:-5]; w, h = size(id); shot = f'dev/out/{id}.png'
    chrome(f'--window-size={w},{h}', '--force-device-scale-factor=1', f'--screenshot={shot}', f'http://localhost:8793/{f}')
    im = Image.open(shot).convert('L')
    im = im.point(lambda v: 255 if v > 127 else 0).convert('1') if id.endswith('_og') else im.point(lambda v: round(v / 17) * 17)
    im.save(f'concept/device/{id}.png', optimize=True)
with ThreadPoolExecutor(8) as ex: list(ex.map(shoot, pages))
print('done', len(pages))
