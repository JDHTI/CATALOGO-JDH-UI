"""Genera public/og/catalogo-jdh.jpg, la imagen de vista previa al compartir
el enlace (Open Graph / Twitter card).

1200x630 en JPG porque es lo único que todos los scrapers aceptan sin
sorpresas: Teams, LinkedIn y algunos clientes de WhatsApp descartan WebP y
muestran un icono genérico. Foto del camión a sangre a la derecha, panel
tinta (#1D1D1B) a la izquierda con el logo blanco y el título.

Uso: python scripts/generate-og-image.py  (necesita Pillow)
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
INK = (0x1D, 0x1D, 0x1B)
PANEL_W = 620
FADE_W = 160

foto = Image.open(ROOT / "public/photos/camion-carretera.webp").convert("RGB")
# Cubre el área a la derecha del panel (más el degradado) recortando al centro.
area_w = W - PANEL_W + FADE_W
escala = max(area_w / foto.width, H / foto.height)
foto = foto.resize((round(foto.width * escala), round(foto.height * escala)), Image.LANCZOS)
izq = (foto.width - area_w) // 2
sup = (foto.height - H) // 2
foto = foto.crop((izq, sup, izq + area_w, sup + H))

lienzo = Image.new("RGB", (W, H), INK)
lienzo.paste(foto, (PANEL_W - FADE_W, 0))

# Degradado tinta → transparente para fundir el panel con la foto.
fade = Image.new("L", (FADE_W, H))
for x in range(FADE_W):
    fade.paste(round(255 * (1 - x / FADE_W)), (x, 0, x + 1, H))
lienzo.paste(Image.new("RGB", (FADE_W, H), INK), (PANEL_W - FADE_W, 0), fade)

logo = Image.open(ROOT / "public/logos/full-white.png").convert("RGBA")
logo_w = 380
logo = logo.resize((logo_w, round(logo.height * logo_w / logo.width)), Image.LANCZOS)
x0 = 72
lienzo.paste(logo, (x0, 150), logo)

fuentes = ROOT / "docs/brand/fonts"
titulo = ImageFont.truetype(str(fuentes / "Centrale Sans Bold.otf"), 46)
sub = ImageFont.truetype(str(fuentes / "Centrale Sans Regular.otf"), 25)
d = ImageDraw.Draw(lienzo)
y = 150 + logo.height + 48
d.text((x0, y), "Catálogo de productos", font=titulo, fill="white")
d.text(
    (x0, y + 64),
    "Institucional · Food service · Retail",
    font=sub,
    fill=(0xD6, 0xD3, 0xCE),
)

salida = ROOT / "public/og/catalogo-jdh.jpg"
salida.parent.mkdir(exist_ok=True)
lienzo.save(salida, "JPEG", quality=86, optimize=True, progressive=True)
print(f"{salida.relative_to(ROOT)}  {salida.stat().st_size // 1024} KB")
