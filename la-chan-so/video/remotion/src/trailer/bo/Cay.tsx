import React, { useMemo } from "react"
import { alpha, ds } from "./mau"
import { clamp01, seeded } from "./time"

// Cây non nét mảnh phát sáng. Sinh cành bằng số ngẫu nhiên có hạt giống (cùng hạt giống, cùng một cây ở mọi khung).
// Đơn vị nội bộ: gốc ở (0, 0), cao 1, trục y hướng xuống (cây mọc về phía y âm).

type Leaf = { x: number; y: number; angle: number; size: number }
type Branch = { x0: number; y0: number; x1: number; y1: number; cx: number; cy: number; depth: number; phase: number; children: Branch[]; leaves: Leaf[] }
type Shape = { root: Branch; depth: number; crown: { x: number; y: number; r: number } }

const MAX_DEPTH = 4

function build(seed: number): Shape {
  const rnd = seeded(seed * 7919 + 17)
  const leaves: Leaf[] = []
  const grow = (depth: number, x: number, y: number, angle: number, len: number): Branch => {
    const a = (angle * Math.PI) / 180
    const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len
    const bend = (rnd() - 0.5) * len * 0.22
    const cx = (x + x1) / 2 - Math.sin(a) * bend, cy = (y + y1) / 2 + Math.cos(a) * bend
    const b: Branch = { x0: x, y0: y, x1, y1, cx, cy, depth, phase: rnd() * Math.PI * 2, children: [], leaves: [] }
    if (depth < MAX_DEPTH - 1) {
      const spreads = depth === 0 ? [-30, -4, 26] : depth === 1 ? [-26, 22] : rnd() < 0.5 ? [-24, 20] : [-20, 4, 26]
      for (const s of spreads) {
        const childAngle = angle + s + (rnd() - 0.5) * 12
        // Giữ dáng cây non thẳng: cành không chúc xuống dưới phương ngang.
        const clampedAngle = Math.max(-168, Math.min(-12, childAngle))
        b.children.push(grow(depth + 1, x1, y1, clampedAngle, len * (0.66 + rnd() * 0.14)))
      }
    }
    if (depth >= 2) {
      const n = depth === MAX_DEPTH - 1 ? 3 : 1
      for (let i = 0; i < n; i++) {
        const t = depth === MAX_DEPTH - 1 ? 0.55 + i * 0.22 : 0.6
        const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx + t * t * x1
        const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * y1
        const side = i % 2 === 0 ? 1 : -1
        const leaf = { x: px, y: py, angle: angle + side * (30 + rnd() * 25), size: 0.05 + rnd() * 0.025 }
        b.leaves.push(leaf)
        leaves.push(leaf)
      }
    }
    return b
  }
  const root = grow(0, 0, 0, -90 + (rnd() - 0.5) * 4, 0.36)
  // Tán: vòng tròn ôm phần lớn lá (dùng để ghép tán thành núi ở cảnh kết).
  const mx = leaves.reduce((s, l) => s + l.x, 0) / leaves.length
  const my = leaves.reduce((s, l) => s + l.y, 0) / leaves.length
  const r = Math.max(...leaves.map(l => Math.hypot(l.x - mx, l.y - my))) * 0.92
  return { root, depth: MAX_DEPTH, crown: { x: mx, y: my, r } }
}

const cache = new Map<number, Shape>()
function shapeOf(seed: number) {
  let s = cache.get(seed)
  if (!s) { s = build(seed); cache.set(seed, s) }
  return s
}

/** Vòng tán của cây (px màn hình), để khớp hình núi ở cảnh kết. */
export function treeCrown(seed: number, x: number, base: number, h: number) {
  const c = shapeOf(seed).crown
  return { x: x + c.x * h, y: base + c.y * h, r: c.r * h }
}

export type TreeProps = {
  x: number; base: number; h: number; seed?: number
  /** 0..1: cây vẽ dần từ gốc lên ngọn, lá bật ra cuối cùng. */
  grow?: number
  /** Biên độ gió 0..1 (cây nghiêng theo gió khi kẻ gian nói). */
  wind?: number
  frame: number
  tone?: "night" | "day"
  opacity?: number
  /** Độ nghiêng cả cây (độ). */
  lean?: number
  stroke?: number
}

export function Tree({ x, base, h, seed = 1, grow = 1, wind = 0, frame, tone = "night", opacity = 1, lean = 0, stroke = 3 }: TreeProps) {
  const shape = useMemo(() => shapeOf(seed), [seed])
  const line = tone === "night" ? ds.brandC : ds.brand
  const leafFill = tone === "night" ? alpha(ds.brandLine, 0.22) : alpha(ds.brandC, 0.9)
  const sw = stroke / h
  const levels = shape.depth + 0.8
  const g = clamp01(grow) * levels

  const renderBranch = (b: Branch, key: string): React.ReactNode => {
    const p = clamp01(g - b.depth)
    if (p <= 0) return null
    // Gió: cành ở tầng cao lắc nhiều hơn, lệch pha nhau cho tự nhiên.
    const gust = Math.sin(frame / 13 + b.phase) * 0.6 + Math.sin(frame / 5.3 + b.phase * 1.7) * 0.4
    const rot = wind * (1.2 + b.depth * 2.2) * gust + (b.depth === 0 ? lean : 0) + wind * b.depth * 1.6
    const leafP = clamp01((g - b.depth - 0.7) / 0.6)
    const w = sw * (b.depth === 0 ? 1.5 : b.depth === 1 ? 1.2 : 1)
    return <g key={key} transform={`rotate(${rot} ${b.x0} ${b.y0})`}>
      <path d={`M${b.x0} ${b.y0} Q${b.cx} ${b.cy} ${b.x1} ${b.y1}`} fill="none" stroke={line} strokeWidth={w} strokeLinecap="round"
        pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      {leafP > 0 && b.leaves.map((l, i) => {
        const s = l.size * leafP
        return <path key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.angle})`}
          d={`M0 0 Q${s * 0.5} ${-s * 0.42} ${s} 0 Q${s * 0.5} ${s * 0.42} 0 0 Z`}
          fill={leafFill} stroke={line} strokeWidth={sw * 0.8} strokeLinejoin="round" opacity={leafP} />
      })}
      {b.children.map((c, i) => renderBranch(c, `${key}-${i}`))}
    </g>
  }

  const glow = tone === "night"
    ? `drop-shadow(0 0 ${h * 0.012}px ${alpha(ds.brandLine, 0.9)}) drop-shadow(0 0 ${h * 0.045}px ${alpha(ds.brand, 0.7)})`
    : undefined
  const W = h * 1.6, H = h * 1.25
  return <svg width={W} height={H} viewBox={`-0.8 -1.15 1.6 1.25`}
    style={{ position: "absolute", left: x - W / 2, top: base - h * 1.15, overflow: "visible", opacity, filter: glow }}>
    {renderBranch(shape.root, "r")}
  </svg>
}

/** Đường đất mảnh dưới gốc cây, mờ dần hai đầu. */
export function Ground({ x, y, w, tone = "night", progress = 1, opacity = 1 }: { x: number; y: number; w: number; tone?: "night" | "day"; progress?: number; opacity?: number }) {
  const c = tone === "night" ? ds.brandLine : ds.brand
  const half = (w / 2) * clamp01(progress)
  return <div style={{ position: "absolute", left: x - half, top: y - 1, width: half * 2, height: 2, opacity: opacity * 0.6,
    background: `linear-gradient(90deg, ${alpha(c, 0)}, ${alpha(c, 0.9)} 50%, ${alpha(c, 0)})` }} />
}
