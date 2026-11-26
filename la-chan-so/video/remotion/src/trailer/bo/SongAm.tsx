import React from "react"
import { alpha } from "./mau"

/**
 * Sóng âm theo mảng biên độ (mỗi phần tử một khung, 0..1, tính sẵn từ tệp tiếng).
 * Vạch bên phải là khung hiện tại, lịch sử trôi sang trái; đối xứng trên dưới.
 */
export function Waveform({ amps, frame, bars = 44, width = 560, height = 110, color, opacity = 1, step = 1 }: {
  amps: number[]; frame: number; bars?: number; width?: number; height?: number; color: string; opacity?: number; step?: number
}) {
  const gap = width / bars
  const bw = Math.max(3, gap * 0.52)
  return <svg width={width} height={height} style={{ display: "block", overflow: "visible", opacity }}>
    {Array.from({ length: bars }, (_, i) => {
      const k = frame - (bars - 1 - i) * step
      const a = k >= 0 && k < amps.length ? amps[k] : 0
      const h = Math.max(bw, a * height * 0.95)
      const fade = 0.35 + 0.65 * (i / (bars - 1))
      return <rect key={i} x={i * gap + (gap - bw) / 2} y={(height - h) / 2} width={bw} height={h} rx={bw / 2}
        fill={i === bars - 1 ? color : alpha(color, fade)} />
    })}
  </svg>
}
