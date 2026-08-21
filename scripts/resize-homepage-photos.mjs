// Redimensiona las fotos del homepage (categorias/productos) para web:
// max 1200px en su lado mayor, JPEG q80 progresivo. Sobre-escribe en su lugar.
import { readdir, stat } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const dirs = ["categorias", "productos"]
const base = path.join(process.cwd(), "public", "photos")

for (const dir of dirs) {
  const folder = path.join(base, dir)
  for (const file of await readdir(folder)) {
    if (!/\.jpe?g$/i.test(file)) continue
    const src = path.join(folder, file)
    const before = (await stat(src)).size
    const tmp = src + ".tmp"
    await sharp(src)
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80, progressive: true })
      .toFile(tmp)
    const { rename, stat: statAfter } = await import("node:fs/promises")
    await rename(tmp, src)
    const after = (await statAfter(src)).size
    console.log(
      `${dir}/${file}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`
    )
  }
}
console.log("done")
