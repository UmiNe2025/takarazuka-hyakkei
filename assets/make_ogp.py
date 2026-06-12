# -*- coding: utf-8 -*-
"""Generate assets/ogp.png (1200x630) for 宝塚百景 — brand-consistent poster.
Run once at build time: python assets/make_ogp.py
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
out_path = os.path.join(os.path.dirname(__file__), "ogp.png")

img = Image.new("RGB", (W, H), "#241d3f")
d = ImageDraw.Draw(img)

# vertical gradient (deep violet -> sumire)
top = (24, 18, 40)
bottom = (56, 40, 92)
for y in range(H):
    t = y / H
    c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    d.line([(0, y), (W, y)], fill=c)

# spotlight glow
glow = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(glow)
gd.ellipse([W/2-430, H-260, W/2+430, H+340], fill=58)
glow = glow.filter(ImageFilter.GaussianBlur(70))
gold_layer = Image.new("RGB", (W, H), (231, 189, 85))
img = Image.composite(gold_layer, img, glow)
d = ImageDraw.Draw(img)

GOLD = (212, 173, 92)
GOLD_BRIGHT = (231, 189, 85)
PAPER = (248, 244, 234)
VIOLET = (155, 127, 212)
VIOLET_DEEP = (122, 92, 184)

# top valance scallops
d.rectangle([0, 0, W, 26], fill=(44, 33, 80))
for cx in range(30, W + 60, 60):
    d.ellipse([cx - 30, 4, cx + 30, 48], fill=(44, 33, 80))
d.line([(0, 50), (W, 50)], fill=GOLD, width=3)

# stars
star_pts = [(90, 130), (200, 90), (1080, 120), (980, 170), (140, 480), (1100, 470), (300, 140), (920, 100)]
for i, (sx, sy) in enumerate(star_pts):
    r = 7 if i % 3 == 0 else 4
    d.polygon([(sx, sy - r), (sx + r * .35, sy - r * .35), (sx + r, sy), (sx + r * .35, sy + r * .35),
               (sx, sy + r), (sx - r * .35, sy + r * .35), (sx - r, sy), (sx - r * .35, sy - r * .35)],
              fill=(240, 220, 168))

# ---- crest: violet with star ----
def paste_petals(base, center, rx, ry, dist, color, n=5):
    petal = Image.new("RGBA", (rx * 2 + 8, ry * 2 + 8), (0, 0, 0, 0))
    pd = ImageDraw.Draw(petal)
    pd.ellipse([4, 4, rx * 2 + 4, ry * 2 + 4], fill=color + (255,))
    for k in range(n):
        ang = -90 + k * (360 / n)
        rot = petal.rotate(-(ang + 90), expand=True, resample=Image.BICUBIC)
        px = center[0] + dist * math.cos(math.radians(ang)) - rot.width // 2
        py = center[1] + dist * math.sin(math.radians(ang)) - rot.height // 2
        base.paste(rot, (int(px), int(py)), rot)

img_rgba = img.convert("RGBA")
CREST = (W // 2, 150)
dd = ImageDraw.Draw(img_rgba)
dd.ellipse([CREST[0]-62, CREST[1]-62, CREST[0]+62, CREST[1]+62], outline=GOLD, width=3)
dd.ellipse([CREST[0]-53, CREST[1]-53, CREST[0]+53, CREST[1]+53], outline=GOLD, width=1)
paste_petals(img_rgba, CREST, 13, 18, 27, VIOLET)
paste_petals(img_rgba, CREST, 6, 10, 20, VIOLET_DEEP)
dd = ImageDraw.Draw(img_rgba)
r = 11
sx, sy = CREST
dd.polygon([(sx, sy - r), (sx + r*.38, sy - r*.32), (sx + r, sy - r*.25), (sx + r*.5, sy + r*.18),
            (sx + r*.62, sy + r), (sx, sy + r*.5), (sx - r*.62, sy + r), (sx - r*.5, sy + r*.18),
            (sx - r, sy - r*.25), (sx - r*.38, sy - r*.32)], fill=GOLD_BRIGHT)
img = img_rgba.convert("RGB")
d = ImageDraw.Draw(img)

# ---- typography ----
def load_font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()

FONTS = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
mincho_paths = [os.path.join(FONTS, f) for f in ("yumindb.ttf", "yumin.ttf", "msmincho.ttc", "meiryo.ttc")]
latin_paths = [os.path.join(FONTS, f) for f in ("georgia.ttf", "times.ttf", "constan.ttf")]

f_title = load_font(mincho_paths, 168)
f_sub = load_font(latin_paths, 30)
f_small = load_font(mincho_paths, 26)

title = "宝塚百景"
tw = d.textlength(title, font=f_title)
d.text(((W - tw) / 2, 222), title, font=f_title, fill=PAPER)

def spaced_text(draw, y, text, font, fill, tracking):
    total = sum(draw.textlength(ch, font=font) + tracking for ch in text) - tracking
    x = (W - total) / 2
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking

spaced_text(d, 448, "100 VIEWS OF TAKARAZUKA", f_sub, GOLD_BRIGHT, 14)

spaced_text(d, 510, "歌劇と巡礼と里山の街 — 兵庫県宝塚市", f_small, (200, 190, 220), 6)
spaced_text(d, 560, "TAKARAZUKA, HYOGO, JAPAN", load_font(latin_paths, 20), (160, 150, 190), 8)

img.save(out_path, "PNG", optimize=True)
print("saved", out_path, os.path.getsize(out_path), "bytes")
