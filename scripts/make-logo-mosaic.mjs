// Mosaico de logos SOLO de los candidatos a revisar (con lista impresa en orden).
import path from "node:path"
import sharp from "sharp"

// Orden exacto del mosaico (6 por fila)
const FILES = [
  "aguila-roja",
  "alpina",
  "crem-helado",
  "delmonte",
  "maggi",
  "nestle",
  "noel",
  "oetker",
  "oreo",
  "pepsi",
  "pietran",
  "pringles",
  "quaker",
  "rica",
  "tosh",
  "zenu",
  "bimbo2",
  "coca-cola2",
  "colgate2",
  "danone",
  "arcor",
  "lactalis",
  "yoplait",
  "campbells",
  "lipton",
  "corona",
  "lays",
  "doritos",
  "nutella",
  "heinz",
  "knorr",
  "nescafe",
]

const dir = path.join(process.cwd(), "public", "photos", "marcas")
const CELL = 128
const COLS = 6

const buffers = []
for (const name of FILES) {
  buffers.push(
    sharp(path.join(dir, `${name}.png`))
      .resize(CELL - 16, CELL - 16, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer()
  )
}
const rows = Math.ceil(FILES.length / COLS)
const canvas = sharp({
  create: {
    width: COLS * CELL,
    height: rows * CELL,
    channels: 4,
    background: { r: 245, g: 245, b: 245, alpha: 1 },
  },
})
const composites = (await Promise.all(buffers)).map((buf, i) => ({
  input: buf,
  left: (i % COLS) * CELL + 8,
  top: Math.floor(i / COLS) * CELL + 8,
}))
await canvas
  .composite(composites)
  .png()
  .toFile(path.join(process.cwd(), "scripts", "logos-review.png"))
console.log(FILES.join(", "))
