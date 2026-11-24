// Render vài khung tĩnh để soát: node anh-tinh.mjs TT2 774 1436 ... (ra stills/<comp>-<khung>.jpg)
import { bundle } from "@remotion/bundler"
import { renderStill, selectComposition } from "@remotion/renderer"
import path from "node:path"
const [comp, ...frames] = process.argv.slice(2)
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), outDir: path.resolve("../tmp-bundle") })
const composition = await selectComposition({ serveUrl, id: comp })
for (const f of frames) {
  const output = path.resolve(`stills/${comp}-${f}.jpg`)
  await renderStill({ composition, serveUrl, output, frame: Number(f), imageFormat: "jpeg", jpegQuality: 80 })
  console.log(output)
}
