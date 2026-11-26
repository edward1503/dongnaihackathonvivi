// Render nhiều khung tĩnh của LCSTrailer với một lần đóng gói (chạy trong container lcs-trailer-render, thư mục /app).
//   node trailer-cong-cu/anh-trailer.mjs 30 120 455 …   → out/anh/<khung>.jpg
import { bundle } from "@remotion/bundler"
import { renderStill, selectComposition } from "@remotion/renderer"
import path from "node:path"
import fs from "node:fs"

const frames = process.argv.slice(2).map(Number).filter(n => Number.isFinite(n))
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), outDir: "/tmp/lcs-trailer-bundle", enableCaching: false })
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "LCSTrailer" })
fs.mkdirSync("out/anh", { recursive: true })
const t0 = Date.now()
for (const f of frames) {
  const output = path.resolve(`out/anh/${f}.jpg`)
  await renderStill({ composition, serveUrl, output, frame: Math.min(f, composition.durationInFrames - 1), imageFormat: "jpeg", jpegQuality: 88 })
  console.log("ANH", f)
}
console.log(`XONG ${frames.length} ảnh ${((Date.now() - t0) / 1000).toFixed(1)}s, tổng ${composition.durationInFrames} khung`)
