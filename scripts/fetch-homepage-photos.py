"""Descarga fotos para categorias y productos del homepage via Openverse (CC, uso comercial).
Genera public/photos/categorias/*.jpg, public/photos/productos/*.jpg y CREDITS.md con la
atribucion de cada imagen (licencias CC requieren creditos).
"""
import json
import urllib.request
import urllib.parse
import os
import sys

UA = {"User-Agent": "Mozilla/5.0 (JDH-Catalogo mock assets)"}

def search(query, page_size=12):
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
        {"q": query, "license_type": "commercial", "page_size": page_size}
    )
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.load(r).get("results", [])

def pick(results):
    """Primer resultado razonable: jpg directo, dimension suficiente."""
    for res in results:
        u = (res.get("url") or "").lower()
        w = res.get("width") or 0
        h = res.get("height") or 0
        if not u.endswith((".jpg", ".jpeg")):
            continue
        if w and h and min(w, h) < 500:
            continue
        return res
    return None

def download(url, dest):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as f:
        f.write(r.read())

# (carpeta destino, nombre archivo, query)
ITEMS = [
    ("productos", "leche-uht", "milk cartons supermarket"),
]

BASE = os.path.join(os.path.dirname(__file__), "..", "public", "photos")
credits = ["# Creditos de fotos del homepage (mock)", "",
           "Imagenes obtenidas via Openverse (api.openverse.org) con licencia comercial CC.",
           "Atribucion requerida por las licencias:", ""]

os.makedirs(os.path.join(BASE, "categorias"), exist_ok=True)
os.makedirs(os.path.join(BASE, "productos"), exist_ok=True)

ok, fail = 0, 0
for folder, name, query in ITEMS:
    try:
        res = pick(search(query))
        if not res:
            print(f"FAIL {name}: sin resultado util para '{query}'")
            fail += 1
            continue
        dest = os.path.join(BASE, folder, f"{name}.jpg")
        download(res["url"], dest)
        size = os.path.getsize(dest)
        print(f"OK   {name} ({size//1024}KB) <- {res['url']}")
        credits += [f"- `{folder}/{name}.jpg`: {res.get('title') or name}",
                    f"  - Fuente: {res.get('foreign_landing_url') or 'n/a'}",
                    f"  - Autor: {res.get('creator') or 'n/a'} ({res.get('creator_url') or 'n/a'})",
                    f"  - Licencia: {res.get('license')} {res.get('license_version')} — {res.get('license_url') or ''}", ""]
        ok += 1
    except Exception as e:
        print(f"FAIL {name}: {e}")
        fail += 1

with open(os.path.join(BASE, "CREDITS.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(credits))

print(f"\n{ok} descargadas, {fail} fallaron")
sys.exit(0 if fail == 0 else 1)
