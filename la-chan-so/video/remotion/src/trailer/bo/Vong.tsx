import React from "react"
import { alpha, ds } from "./mau"
import { clamp01 } from "./time"

// Ba vòng đồng tâm vẽ dần bằng stroke-dashoffset (bắt đầu từ đỉnh, theo chiều kim đồng hồ).
export function Rings({ cx, cy, radii, progress, color = ds.brandC, glow = true, width = 3, opacity = 1, labels, labelSize = 30, labelColor }: {
  cx: number; cy: number; radii: number[]; progress: number[]; color?: string; glow?: boolean; width?: number; opacity?: number
  labels?: string[]; labelSize?: number; labelColor?: string
}) {
  const R = Math.max(...radii) + 40
  return <div style={{ position: "absolute", left: cx - R, top: cy - R, width: R * 2, height: R * 2, opacity }}>
    <svg width={R * 2} height={R * 2} viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} style={{ overflow: "visible",
      filter: glow ? `drop-shadow(0 0 6px ${alpha(ds.brandLine, 0.8)}) drop-shadow(0 0 18px ${alpha(ds.brand, 0.5)})` : undefined }}>
      {radii.map((r, i) => {
        const p = clamp01(progress[i] ?? 0)
        if (p <= 0) return null
        return <circle key={i} cx={0} cy={0} r={r} fill="none" stroke={color} strokeWidth={width - i * 0.4} strokeLinecap="round"
          opacity={0.95 - i * 0.18} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} transform="rotate(-90)" />
      })}
    </svg>
    {labels?.map((t, i) => {
      const p = clamp01(((progress[i] ?? 0) - 0.5) * 2)
      if (p <= 0 || !t) return null
      return <div key={i} style={{ position: "absolute", left: R, top: R - radii[i] - labelSize * 0.75, transform: `translateX(-50%)`, opacity: p,
        padding: "4px 16px", borderRadius: 999, background: alpha(ds.navy, 0.85), border: `1.5px solid ${alpha(color, 0.6)}`,
        fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 600, fontSize: labelSize, color: labelColor ?? color, whiteSpace: "nowrap" }}>{t}</div>
    })}
  </div>
}
