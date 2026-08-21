"""
Convierte los .otf originales de Centrale Sans a .woff2 para la web.

Fuente:  docs/brand/fonts/*.otf   (fuera de public/, no se despliega)
Salida:  public/fonts/*.woff2     (lo que sirve la app)

DESIGN.md §2.4 exige .woff2 con `font-display: swap`; los .otf de la skill de
marca pesan casi el doble. Solo se convierten los cuatro pesos autorizados por
el manual (Light/Regular/Medium/Bold) y sus itálicas — las itálicas se declaran
en globals.css pero el navegador solo las descarga si algo las usa.

Requiere Python con `fonttools` y `brotli`:
    pip install fonttools brotli

Uso (desde la raíz del repo):
    python scripts/generate-font-assets.py

Es un script one-off, igual que `generate-brand-assets.mjs`: se ejecuta a mano
cuando cambian los archivos de fuente, no en cada build.
"""

import os
import sys

from fontTools.ttLib import TTFont

SRC_DIR = os.path.join("docs", "brand", "fonts")
OUT_DIR = os.path.join("public", "fonts")

# (archivo original, nombre de salida). El nombre de salida sigue la convención
# kebab-case del proyecto — los originales traen espacios.
FONTS = [
    ("Centrale Sans Light.otf", "centrale-sans-light.woff2"),
    ("Centrale Sans Regular.otf", "centrale-sans-regular.woff2"),
    ("Centrale Sans Medium.otf", "centrale-sans-medium.woff2"),
    ("Centrale Sans Bold.otf", "centrale-sans-bold.woff2"),
    ("Centrale Sans Light Italic.otf", "centrale-sans-light-italic.woff2"),
    ("Centrale Sans Regular Italic.otf", "centrale-sans-regular-italic.woff2"),
    ("Centrale Sans Medium Italic.otf", "centrale-sans-medium-italic.woff2"),
    ("Centrale Sans Bold Italic.otf", "centrale-sans-bold-italic.woff2"),
]


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    missing = []

    for src_name, out_name in FONTS:
        src = os.path.join(SRC_DIR, src_name)
        out = os.path.join(OUT_DIR, out_name)

        if not os.path.exists(src):
            missing.append(src)
            continue

        font = TTFont(src)
        font.flavor = "woff2"
        font.save(out)

        before = os.path.getsize(src) // 1024
        after = os.path.getsize(out) // 1024
        print(f"[fonts] {out_name:38} {before:>4} KB -> {after:>4} KB")

    if missing:
        print("\n[fonts] No encontrados:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
