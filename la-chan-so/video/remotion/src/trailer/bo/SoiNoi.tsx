import React from "react"
import { alpha, ds } from "./mau"
import { clamp01 } from "./time"

type P = [number, number]
const bez = (a: P, c1: P, c2: P, b: P, t: number): P => {
  const u = 1 - t
  return [u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
    u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]
}

/** Sợi nối cong giữa hai điểm, vẽ dần (draw 0..1), một xung sáng chạy dọc (pulse 0..1, null là không có). */
export function Thread({ from, to, bend = -120, draw = 1, pulse = null, color = ds.brand, width = 4, opacity = 1 }: {
  from: P; to: P; bend?: number; draw?: number; pulse?: number | null; color?: string; width?: number; opacity?: number
}) {
  const dx = to[0] - from[0], dy = to[1] - from[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len, ny = dx / len
  const c1: P = [from[0] + dx * 0.3 + nx * bend, from[1] + dy * 0.3 + ny * bend]
  const c2: P = [from[0] + dx * 0.7 + nx * bend, from[1] + dy * 0.7 + ny * bend]
  const d = `M${from[0]} ${from[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${to[0]} ${to[1]}`
  const pt = pulse === null ? null : bez(from, c1, c2, to, clamp01(pulse))
  const pOpacity = pulse === null ? 0 : Math.sin(Math.PI * clamp01(pulse))
  return <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity }}>
    <path d={d} fill="none" stroke={alpha(color, 0.25)} strokeWidth={width * 3} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(draw)} />
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(draw)} />
    {pt && <>
      <circle cx={pt[0]} cy={pt[1]} r={26} fill={alpha(color, 0.25 * pOpacity)} />
      <circle cx={pt[0]} cy={pt[1]} r={11} fill={color} opacity={pOpacity} />
      <circle cx={pt[0]} cy={pt[1]} r={5} fill="#FFFFFF" opacity={pOpacity} />
    </>}
  </svg>
}
