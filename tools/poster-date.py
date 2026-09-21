#!/usr/bin/env python3
"""Redraw the date on the webinar poster and inline it into index.html.

    python3 tools/poster-date.py "Rabu, 07 Oktober 2026"

The poster is the Scalev page's own (poster-source.webp, 640x640, untouched).
Its bottom line is a group centred on the canvas - Zoom logo, dot,
"Live | <date> | 19.30 - 22.30 WIB", dot - and only the date changes. It is
drawn in Poppins Bold at the size and tracking that reproduce the source's
"Selasa, 23 Desember 2025" pixel for pixel, and the pieces either side of it
slide in (or out) by half the width it gives up (or takes), so the group stays
centred.

Needs Pillow. Poppins Bold is fetched from google/fonts on first run and kept in
tools/.cache/.
"""
import base64
import io
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
PAGE = HERE.parent / 'index.html'
SOURCE = HERE / 'poster-source.webp'
FONT = HERE / '.cache' / 'Poppins-Bold.ttf'
FONT_URL = 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf'

SIZE, TRACK = 15.0, -0.2      # px, px between glyphs - fitted to the source
OX, OY = 0.25, -0.25          # sub-pixel offset of the fitted source glyphs
SS = 8                        # supersampling
BAND = (566, 628)             # rows of the Zoom line
LEFT = (48, 230)              # logo and its glow, dot, "Live |"
RIGHT = (430, 579)            # "| 19.30 - 22.30 WIB", dot
DATE_X, DATE_W, CAP_Y = 234, 193, 590   # the source date's ink: left, width, cap line


def render(text):
    """White-on-black mask of `text`, cap line at y=4, ink from x=4."""
    f = ImageFont.truetype(str(FONT), SIZE * SS)
    cap = f.getbbox('2')[1]
    canvas = Image.new('L', (int(f.getlength(text) + 40 * SS), int(SIZE * 2 * SS)), 0)
    draw = ImageDraw.Draw(canvas)
    x = (4 + OX) * SS
    for i, ch in enumerate(text):
        draw.text((x, (4 + OY) * SS - cap), ch, font=f, fill=255)
        nxt = text[i + 1] if i + 1 < len(text) else ''
        x += f.getlength(ch + nxt) - f.getlength(nxt) + TRACK * SS  # keeps kerning
    return canvas.resize((canvas.width // SS, canvas.height // SS), Image.BOX)


def poster(date):
    im = Image.open(SOURCE).convert('RGB')
    mask = render(date)
    bb = mask.getbbox()
    delta = DATE_W - (bb[2] - bb[0])
    sl = delta // 2
    sr = delta - sl
    y0, y1 = BAND
    left = im.crop((LEFT[0], y0, LEFT[1], y1))
    right = im.crop((RIGHT[0], y0, RIGHT[1], y1))
    im.paste((0, 0, 0), (LEFT[0], y0, RIGHT[1], y1))
    im.paste(left, (LEFT[0] + sl, y0))
    im.paste(right, (RIGHT[0] - sr, y0))
    x = DATE_X + sl - (bb[0] - 4)
    im.paste(Image.new('RGB', mask.size, (255, 255, 255)), (x - 4, CAP_Y - 4), mask)
    return im


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    if not FONT.exists():
        FONT.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(FONT_URL, FONT)
    buf = io.BytesIO()
    poster(sys.argv[1]).save(buf, 'WEBP', quality=88, method=6)
    uri = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    html = PAGE.read_text()
    html, n = re.subn(r'(<figure class="webposter[^"]*">\s*<img src=")[^"]+', lambda m: m.group(1) + uri, html)
    if n != 1:
        sys.exit('index.html: expected one <figure class="webposter"> with an <img>, found %d' % n)
    PAGE.write_text(html)
    print('poster redrawn for %r, %d KB' % (sys.argv[1], len(buf.getvalue()) // 1024))


if __name__ == '__main__':
    main()
