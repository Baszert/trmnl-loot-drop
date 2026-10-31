# Loot Drop icon in the house template (512x512): shadow plate, lighter face, 20 px black strokes, content clipped to the face.
# Usage: python3 dev/icon.py  ->  icon.svg (then export icon.png with Chrome)
import re
U = 22
CHEST = """
...KKKKKKKKKK...
..KBBBBBBBBBBK..
..KbbbbbbbbbbK..
..KKKKKKKKKKKK..
.KYYYGYYYYGYYYK.
KYYGYYYWYYYGYYYK
KKKKKKKKKKKKKKKK
KBBBBBKYYKBBBBBK
KbbbbbKKYKbbbbbK
KBBBBBKKKKBBBBBK
KbbbbbbbbbbbbbbK
KBBBBBBBBBBBBBBK
KKKKKKKKKKKKKKKK"""
SPARK = """
.K.
KWK
.K."""
COL = {'K': '#000', 'B': '#8A4B1A', 'b': '#B8692C', 'Y': '#FFD54A', 'G': '#E8A21C', 'W': '#FFFFFF'}
def pix(art, ox, oy, u):
    out = []
    for y, r in enumerate(art.strip('\n').split('\n')):
        for ch, col in COL.items():
            for m in re.finditer(re.escape(ch) + '+', r):
                out.append(f'<rect x="{ox + m.start() * u}" y="{oy + y * u}" width="{(m.end() - m.start()) * u}" height="{u}" fill="{col}"/>')
    return ''.join(out)
w = 16 * U; ox = 10 + (453 - w) // 2; oy = 170
body = pix(CHEST, ox, oy, U)
body += pix(SPARK, ox + 1 * U, oy - 4 * U, U) + pix(SPARK, ox + 11 * U, oy - 6 * U, U) + pix(SPARK, ox + 6 * U, oy - 3 * U + 6, 16)
open('icon.svg', 'w').write(f'''<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<clipPath id="face"><rect x="10" y="10" width="453" height="454" rx="50"/></clipPath>
</defs>
<rect x="10" y="10" width="492" height="492" rx="90" fill="#7A3E0E"/>
<rect x="10" y="10" width="492" height="492" rx="90" stroke="black" stroke-width="20"/>
<rect x="10" y="10" width="453" height="454" rx="50" fill="#F4B63F"/>
<g clip-path="url(#face)" shape-rendering="crispEdges">
<!-- the floor the loot sits on -->
<rect x="0" y="{oy + 13 * U - 4}" width="480" height="200" fill="#C8841F"/>
<rect x="0" y="{oy + 13 * U - 14}" width="480" height="20" fill="black"/>
<!-- a pixel chest full of gold, with sparkles -->
{body}
</g>
<rect x="10" y="10" width="453" height="454" rx="50" stroke="black" stroke-width="20"/>
</svg>
''')
