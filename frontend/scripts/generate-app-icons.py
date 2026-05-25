"""Wide logo -> square PNG icons for Expo/Android APK."""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow kerak: pip install Pillow")
    raise SystemExit(1)

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "images" / "logo-brand.png"
OUT = ROOT / "assets" / "images"
SIZE = 1024
PAD = int(SIZE * 0.12)
INNER = SIZE - PAD * 2

img = Image.open(SRC).convert("RGBA")
img.thumbnail((INNER, INNER), Image.Resampling.LANCZOS)
canvas = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 255))
x = (SIZE - img.width) // 2
y = (SIZE - img.height) // 2
canvas.paste(img, (x, y), img)
rgb = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
rgb.paste(canvas, mask=canvas.split()[3])

for name in ("icon.png", "adaptive-icon.png", "splash-icon.png", "favicon.png"):
    out = OUT / name
    rgb.save(out, "PNG", optimize=True)
    print("Yozildi:", out.name)

print("Tayyor.")
