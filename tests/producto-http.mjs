import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { createServer } from "node:http"
import { createRequire } from "node:module"
import { JSDOM } from "jsdom"

// Prueba HTTP contra Next real. El API sintético vive solo durante esta ejecución.
const require = createRequire(import.meta.url)
const editorial = {
  id: 42,
  sku: "TEST-42",
  nombre: "Producto de prueba",
  descripcion: "68450362",
  marca: null,
  fabricante: null,
  proveedor: { id: 7, nombre: "Proveedor de prueba" },
  categoria: null,
  subcategoria: null,
  imagenUrl: null,
  imagenes: [],
  descripcionLarga: "Primer párrafo editorial.\n\nSegundo párrafo editorial.",
  seo: {
    title: "Título editorial | JDH",
    description: "Resumen editorial de prueba.",
  },
}
const legacy = { ...editorial, id: 44 }
delete legacy.seo
delete legacy.descripcionLarga
const attack = '</script><script id="injected">alert("xss")</script>'
const fixtures = new Map([
  ["42", editorial],
  [
    "43",
    {
      ...editorial,
      id: 43,
      descripcionLarga: null,
      seo: { title: null, description: null },
    },
  ],
  ["44", legacy],
  [
    "45",
    {
      ...editorial,
      id: 45,
      nombre: attack,
      descripcionLarga: attack,
      seo: { title: attack, description: attack },
    },
  ],
])
const reads = new Map()
const api = createServer((req, res) => {
  const id = req.url.split("/").at(-1)
  reads.set(id, (reads.get(id) ?? 0) + 1)
  res.setHeader("Content-Type", "application/json")
  res.statusCode = id === "503" ? 503 : fixtures.has(id) ? 200 : 404
  res.end(
    JSON.stringify(
      fixtures.get(id) ?? {
        statusCode: res.statusCode,
        message: "Error de prueba",
      }
    )
  )
})
api.listen(0, "127.0.0.1")
await once(api, "listening")
const apiPort = api.address().port
const reservation = createServer()
reservation.listen(0, "127.0.0.1")
await once(reservation, "listening")
const port = reservation.address().port
await new Promise((resolve) => reservation.close(resolve))

const next = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "dev", "--port", String(port)],
  {
    windowsHide: true,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}/api/v1`,
      NEXT_PUBLIC_SITE_URL: "https://catalogo.jdh.com.co",
      AUTH_MICROSOFT_ENTRA_ID_ID: "test-client",
      AUTH_MICROSOFT_ENTRA_ID_SECRET: "test-client-secret",
      AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: "test-tenant",
      BETTER_AUTH_SECRET: "test-only-secret-for-editorial-integration-42",
      DATABASE_URL: "postgres://test:test@127.0.0.1:1/test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  }
)
let output = ""
next.stdout.on("data", (data) => {
  output += data
})
next.stderr.on("data", (data) => {
  output += data
})

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Next no arrancó: ${output}`)),
      90_000
    )
    next.stdout.on("data", (data) => {
      if (/Ready in/.test(String(data))) {
        clearTimeout(timer)
        resolve()
      }
    })
    next.once("exit", (code) => {
      clearTimeout(timer)
      reject(new Error(`Next terminó (${code}): ${output}`))
    })
  })

  for (const [id, expected] of fixtures) {
    const response = await fetch(
      `http://localhost:${port}/productos/${id}?utm_source=test`,
      {
        headers: { "User-Agent": "Twitterbot" },
        signal: AbortSignal.timeout(120_000),
      }
    )
    const document = new JSDOM(await response.text()).window.document
    assert.equal(response.status, 200)
    assert.equal(document.title, expected.seo?.title ?? expected.nombre)
    assert.equal(
      document.querySelector('meta[name="description"]').content,
      expected.seo?.description ?? expected.nombre
    )
    assert.equal(
      document.querySelector('meta[property="og:title"]').content,
      expected.seo?.title ?? expected.nombre
    )
    assert.equal(
      document.querySelector('meta[property="og:description"]').content,
      expected.seo?.description ?? expected.nombre
    )
    assert.equal(
      document.querySelector('link[rel="canonical"]').href,
      `https://catalogo.jdh.com.co/productos/${id}`
    )
    assert.equal(
      document.querySelector('meta[property="og:image"]').content,
      "https://catalogo.jdh.com.co/og/catalogo-jdh.jpg"
    )
    assert.equal(
      document.querySelector('meta[name="twitter:image"]').content,
      "https://catalogo.jdh.com.co/og/catalogo-jdh.jpg"
    )
    assert.equal(document.querySelector("h1").textContent, expected.nombre)
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    )
    assert.equal(scripts.length, 1)
    const product = JSON.parse(scripts[0].textContent)
    assert.equal(product.name, expected.nombre)
    assert.equal(product.description, expected.descripcionLarga ?? undefined)
    for (const field of ["offers", "aggregateRating", "review", "image"])
      assert.equal(product[field], undefined)
    const description = document.querySelector(
      '[aria-label="Descripción del producto"]'
    )
    assert.equal(Boolean(description), Boolean(expected.descripcionLarga))
    if (id === "42") assert.equal(description.querySelectorAll("p").length, 2)
    assert.equal(document.querySelector("#injected"), null)
    assert.equal(
      reads.get(id),
      1,
      "página y metadata deben compartir una lectura"
    )
    console.log(
      `PASS HTTP /productos/${id}: SSR, SEO, canonical, JSON-LD y escape`
    )
  }

  for (const id of ["404", "503"]) {
    const response = await fetch(`http://localhost:${port}/productos/${id}`, {
      headers: { "User-Agent": "Twitterbot" },
      signal: AbortSignal.timeout(30_000),
    })
    const document = new JSDOM(await response.text()).window.document
    assert.equal(
      document.querySelector('script[type="application/ld+json"]'),
      null
    )
    assert.equal(document.querySelector('link[rel="canonical"]'), null)
    if (id === "404") {
      assert.match(document.body.textContent, /Producto no encontrado/)
      assert.ok(
        [...document.querySelectorAll('meta[name="robots"]')].some((meta) =>
          meta.content.includes("noindex")
        )
      )
    } else {
      assert.ok([200, 500].includes(response.status))
      assert.ok(
        [...document.querySelectorAll('meta[name="robots"]')].some((meta) =>
          meta.content.includes("noindex")
        )
      )
    }
    console.log(`PASS HTTP /productos/${id}: sin datos de producto falsos`)
  }
} catch (error) {
  console.error(output)
  throw error
} finally {
  // El PID es exclusivamente el proceso que acaba de crear esta prueba.
  if (process.platform === "win32") {
    const kill = spawn("taskkill", ["/pid", String(next.pid), "/t", "/f"], {
      windowsHide: true,
      stdio: "ignore",
    })
    await once(kill, "exit")
  } else {
    next.kill("SIGTERM")
  }
  api.closeAllConnections()
  await new Promise((resolve) => api.close(resolve))
}
