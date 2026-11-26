import React from "react"
import { alpha, ds } from "./mau"
import { clamp01, easeInOut } from "./time"

// Biến hình: tán ba cây (đường bao ba vòng tán) → dáng núi → khiên (khớp đúng khiên trong logo-c.png).
// Ba hình được lấy mẫu thành cùng số điểm theo độ dài cung, cùng chiều, cùng điểm đầu, rồi nội suy từng điểm.

type P = [number, number]
const N = 180

function resample(poly: P[], n = N): P[] {
  const pts = [...poly, poly[0]]
  const seg: number[] = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(d); total += d }
  const out: P[] = []
  let i = 0, acc = 0
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total
    while (i < seg.length - 1 && acc + seg[i] < target) { acc += seg[i]; i++ }
    const t = seg[i] ? (target - acc) / seg[i] : 0
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t])
  }
  // Cùng chiều kim đồng hồ trên màn hình, điểm đầu là điểm "dưới trái" nhất.
  let area = 0
  for (let k = 0; k < n; k++) { const a = out[k], b = out[(k + 1) % n]; area += a[0] * b[1] - b[0] * a[1] }
  const cw = area > 0 ? out : out.reverse()
  let best = 0
  for (let k = 1; k < n; k++) if (cw[k][1] - cw[k][0] > cw[best][1] - cw[best][0]) best = k
  return [...cw.slice(best), ...cw.slice(0, best)]
}

const quad = (a: P, c: P, b: P, steps = 24): P[] => Array.from({ length: steps }, (_, i) => {
  const t = i / steps, u = 1 - t
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as P
})

/** Khiên của logo, theo toạ độ ảnh logo 1024×1024 vẽ cỡ `size` tâm (cx, cy). */
export function shieldPoints(cx: number, cy: number, size: number): P[] {
  const m = (x: number, y: number): P => [cx + ((x - 512) / 1024) * size, cy + ((y - 512) / 1024) * size]
  const poly: P[] = [
    m(275, 392), m(512, 338), m(749, 392), m(752, 600),
    ...quad(m(752, 600), m(745, 762), m(512, 848)),
    ...quad(m(512, 848), m(279, 762), m(272, 600)),
  ]
  return resample(poly)
}

/** Đường bao trên của ba vòng tán, khép bằng đường đáy. */
export function ridgePoints(crowns: { x: number; y: number; r: number }[], baseY: number): P[] {
  const x0 = Math.min(...crowns.map(c => c.x - c.r)), x1 = Math.max(...crowns.map(c => c.x + c.r))
  const top: P[] = []
  for (let k = 0; k <= 120; k++) {
    const x = x0 + ((x1 - x0) * k) / 120
    let y = baseY
    for (const c of crowns) { const dx = x - c.x; if (Math.abs(dx) <= c.r) y = Math.min(y, c.y - Math.sqrt(c.r * c.r - dx * dx)) }
    top.push([x, y])
  }
  return resample([[x0, baseY], ...top, [x1, baseY]])
}

/** Dáng núi ba đỉnh, đỉnh giữa cao nhất. */
export function mountainPoints(cx: number, baseY: number, w: number, h: number): P[] {
  const p = (fx: number, fy: number): P => [cx + fx * w, baseY - fy * h]
  return resample([p(-0.5, 0), p(-0.3, 0.42), p(-0.22, 0.36), p(0, 1), p(0.2, 0.5), p(0.27, 0.56), p(0.5, 0)])
}

const mix = (a: P[], b: P[], t: number): P[] => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t])
const toPath = (pts: P[]) => "M" + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L") + " Z"

/** morph 0..1: tán → núi; 1..2: núi → khiên. fill 0..1: đổ màu thương hiệu vào hình. */
export function MountainShield({ shapes, morph, fill = 0, draw = 1, opacity = 1 }: {
  shapes: { ridge: P[]; mountain: P[]; shield: P[] }; morph: number; fill?: number; draw?: number; opacity?: number
}) {
  const m = Math.max(0, Math.min(2, morph))
  const pts = m <= 1 ? mix(shapes.ridge, shapes.mountain, easeInOut(m)) : mix(shapes.mountain, shapes.shield, easeInOut(m - 1))
  const d = toPath(pts)
  return <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity,
    filter: `drop-shadow(0 0 8px ${alpha(ds.brandLine, 0.85)}) drop-shadow(0 0 28px ${alpha(ds.brand, 0.6)})` }}>
    <defs>
      <linearGradient id="nui-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ds.brand} />
        <stop offset="1" stopColor={ds.brandInk} />
      </linearGradient>
    </defs>
    <path d={d} fill="url(#nui-fill)" fillOpacity={clamp01(fill)} stroke={ds.brandC} strokeWidth={4} strokeLinejoin="round"
      pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(draw)} />
  </svg>
}
