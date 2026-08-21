"""Descarga logos de marcas para el banner del homepage.
Fuente 1: Clearbit Logo API (https://logo.clearbit.com/<domain>) — logo real de
la empresa. Fuente 2 (fallback): favicon de Google (sz=128).
Guarda en public/photos/marcas/<id>.png y reporta los que fallaron (el
componente usa monograma como fallback visual).
"""
import json
import os
import sys
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (JDH-Catalogo mock assets)"}

# (id, nombre, dominio probable)
MARCAS = [
    ("alpina", "Alpina", "alpina.com"),
    ("colanta", "Colanta", "www.colanta.com.co"),
    ("frio-pacifico", "Frío Pacífico", "www.friopacifico.com.co"),
    ("rica", "Rica", "rica.com.co"),
    ("zenu", "Zenú", "zenu.com.co"),
    ("pietran", "Pietrán", "pietran.com.co"),
    ("nacional-chocolates", "Nacional de Chocolates", "chocolates.com.co"),
    ("colombina", "Colombina", "colombina.com"),
    ("fanny", "Fanny", "www.productosfanny.com"),
    ("aguila-roja", "Café Águila Roja", "aguilaroja.com"),
    ("sello-rojo", "Sello Rojo", "sellorojo.com"),
    ("la-bastilla", "La Bastilla", "www.labastilla.com.co"),
    ("roa", "Roa", "www.roaflorhuila.com"),
    ("flor-huila", "Flor Huila", "www.florhuila.com"),
    ("harinas-huila", "Harinas del Huila", "www.harinasdelhuila.com"),
    ("don-limpio", "Don Limpio", "www.donlimpio.com.co"),
    ("fabuloso", "Fabuloso", "www.fabuloso.com"),
    ("ariel", "Ariel", "www.ariel.co"),
    ("suavitel", "Suavitel", "www.suavitel.com"),
    ("colgate", "Colgate", "colgate.com"),
    ("postobon", "Postobón", "postobon.com"),
    ("coca-cola", "Coca-Cola", "coca-cola.com"),
    ("pepsi", "Pepsi", "pepsi.com"),
    ("aguila-cerveza", "Águila", "aguila.com"),
    ("poker", "Poker", "www.cervezapoker.com"),
    ("tosh", "Tosh", "tosh.com.co"),
    ("noel", "Noel", "noel.com.co"),
    ("doria", "Doria", "www.doria.com.co"),
    ("del-huerto", "Del Huerto", "delhuerto.com"),
    ("crem-helado", "Crem Helado", "www.cremhelado.com.co"),
    # Candidatos adicionales (para reemplazar las que no tienen favicon)
    ("alqueria", "Alquería", "www.alqueria.com.co"),
    ("ramo", "Productos Ramo", "www.ramo.com.co"),
    ("diana", "Arroz Diana", "www.diana.com.co"),
    ("maggi", "Maggi", "www.maggi.com"),
    ("nestle", "Nestlé", "www.nestle.com"),
    ("nescafe", "Nescafé", "www.nescafe.com"),
    ("kelloggs", "Kellogg's", "www.kelloggs.com"),
    ("quaker", "Quaker", "www.quakeroats.com"),
    ("bimbo", "Bimbo", "www.grupobimbo.com"),
    ("knorr", "Knorr", "www.knorr.com"),
    ("heinz", "Heinz", "www.heinz.com"),
    ("delmonte", "Del Monte", "www.delmonte.com"),
    ("pringles", "Pringles", "www.pringles.com"),
    ("oreo", "Oreo", "www.oreo.com"),
    ("mccain", "McCain", "www.mccain.com"),
    ("oetker", "Oetker", "www.oetker.com"),
    ("sanfernando", "San Fernando", "www.sanfernando.com.pe"),
    ("gloria", "Gloria", "www.gloria.com.pe"),
    ("incakola", "Inca Kola", "www.incakola.com.pe"),
    ("bigcola", "Big Cola", "www.bigcola.com"),
    # Refinamiento: dominios alternativos para los que dieron placeholder
    ("aguila-cerveza2", "Águila (cerveza)", "www.aguilacerveza.com"),
    ("bimbo2", "Bimbo", "www.bimbo.com.mx"),
    ("coca-cola2", "Coca-Cola", "www.cocacola.com"),
    ("colgate2", "Colgate", "www.colgatepalmolive.com"),
    ("colombina2", "Colombina", "www.colombina.com.co"),
    ("nacional-chocolates2", "Nacional de Chocolates", "www.nutresa.com"),
    ("nescafe2", "Nescafé", "www.nescafe.com.co"),
    ("postobon2", "Postobón", "www.postobon.com.co"),
    ("sello-rojo2", "Sello Rojo", "www.sellorojo.com.co"),
    ("danone", "Danone", "www.danone.com"),
    ("arcor", "Arcor", "www.arcor.com"),
    ("lactalis", "Lactalis", "www.lactalis.com"),
    ("yoplait", "Yoplait", "www.yoplait.com"),
    ("campbells", "Campbell's", "www.campbells.com"),
    ("lipton", "Lipton", "www.lipton.com"),
    ("corona", "Corona", "www.corona.com"),
    ("isabel", "Isabel", "www.isabel.com.co"),
    ("sancor", "Sancor", "www.sancor.com.ar"),
    ("lays", "Lay's", "www.lays.com"),
    ("doritos", "Doritos", "www.doritos.com"),
    ("nutella", "Nutella", "www.nutella.com"),
    ("maseca", "Maseca", "www.maseca.com"),
]

BASE = os.path.join(os.path.dirname(__file__), "..", "public", "photos", "marcas")
os.makedirs(BASE, exist_ok=True)


def fetch(url, dest):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        data = r.read()
    if len(data) < 500:
        raise ValueError("respuesta muy pequena (placeholder)")
    with open(dest, "wb") as f:
        f.write(data)


ok, fail = [], []
for mid, nombre, dominio in MARCAS:
    dest = os.path.join(BASE, f"{mid}.png")
    try:
        fetch(f"https://logo.clearbit.com/{dominio}", dest)
        print(f"OK  {mid} (clearbit)")
        ok.append(mid)
        continue
    except Exception:
        pass
    try:
        fetch(
            f"https://www.google.com/s2/favicons?domain={dominio}&sz=128",
            dest,
        )
        print(f"OK  {mid} (favicon)")
        ok.append(mid)
    except Exception as e:
        print(f"FAIL {mid}: {e}")
        fail.append(mid)

print(f"\n{len(ok)} ok, {len(fail)} fail: {fail}")
sys.exit(0 if not fail else 1)
