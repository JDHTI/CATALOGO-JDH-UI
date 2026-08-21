/**
 * One-off: derive web-ready brand assets from the source logos.
 *
 * Input  (huge source PNGs, up to ~33 MP):
 *   public/Logo Blanco JDH/Logo blanco (1..4).png
 *   public/Logo Negro  JDH/Logo negro  (1..4).png
 * Mapping: 1 → full, 2 → text, 3 → mark, 4 → compact.
 *
 * Output:
 *   public/logos/{full|text|mark|compact}-{white|black}.png   (resized)
 *   public/icons/icon-192.png, icon-512.png, icon-maskable-512.png (from white mark on ink)
 *
 * Then moves the source folders out of public/ (they'd otherwise deploy) into
 * docs/brand/. Run once:  node scripts/generate-brand-assets.mjs
 */
import { existsSync } from "node:fs"
import { mkdir, readdir, rename } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const publicDir = path.join(root, "public")
const logosOut = path.join(publicDir, "logos")
const iconsOut = path.join(publicDir, "icons")
const brandArchive = path.join(root, "docs", "brand")

const INK = "#1D1D1B"

// variant index (1-based, as in the filenames) → output name + target width
const VARIANTS = [
  { index: 1, name: "full", width: 1200 },
  { index: 2, name: "text", width: 1200 },
  { index: 3, name: "mark", width: 1024 },
  { index: 4, name: "compact", width: 1200 },
]

const TONES = [
  { folder: "Logo Blanco JDH", file: "Logo blanco", tone: "white" },
  { folder: "Logo Negro JDH", file: "Logo negro", tone: "black" },
]

async function main() {
  await mkdir(logosOut, { recursive: true })
  await mkdir(iconsOut, { recursive: true })

  for (const { folder, file, tone } of TONES) {
    for (const { index, name, width } of VARIANTS) {
      const src = path.join(publicDir, folder, `${file} (${index}).png`)
      if (!existsSync(src)) {
        console.warn(`! missing source, skipped: ${src}`)
        continue
      }
      const dest = path.join(logosOut, `${name}-${tone}.png`)
      await sharp(src)
        .resize({ width, withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(dest)
      console.log(`→ ${path.relative(root, dest)}`)
    }
  }

  // PWA icons from the white mark (variant 3, blanco) on an ink tile.
  const markWhite = path.join(
    publicDir,
    "Logo Blanco JDH",
    "Logo blanco (3).png"
  )
  const iconSpecs = [
    { size: 192, scale: 0.7, out: "icon-192.png" },
    { size: 512, scale: 0.7, out: "icon-512.png" },
    { size: 512, scale: 0.6, out: "icon-maskable-512.png" }, // extra safe-zone padding
  ]
  for (const { size, scale, out } of iconSpecs) {
    const mark = await sharp(markWhite)
      .resize({
        width: Math.round(size * scale),
        height: Math.round(size * scale),
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer()
    await sharp({
      create: { width: size, height: size, channels: 4, background: INK },
    })
      .composite([{ input: mark, gravity: "center" }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(iconsOut, out))
    console.log(`→ ${path.relative(root, path.join(iconsOut, out))}`)
  }

  // Move the source folders out of public/ so they don't deploy.
  await mkdir(brandArchive, { recursive: true })
  for (const { folder } of TONES) {
    const from = path.join(publicDir, folder)
    if (existsSync(from)) {
      const to = path.join(brandArchive, folder)
      await rename(from, to)
      console.log(
        `moved ${path.relative(root, from)} → ${path.relative(root, to)}`
      )
    }
  }

  // Sanity: list what's left in public/logos and public/icons
  console.log("\nlogos:", (await readdir(logosOut)).join(", "))
  console.log("icons:", (await readdir(iconsOut)).join(", "))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
