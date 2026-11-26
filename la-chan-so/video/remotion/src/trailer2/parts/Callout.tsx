import React from "react"
import { spring, useVideoConfig } from "remotion"
import { alpha, ds } from "../../trailer/bo/mau"
import { ScreenContent } from "../../trailer/bo/Phone"
import { clamp01, easeInOut, ramp } from "../../trailer/bo/time"
import type { Card, CalloutSpec } from "../types"

/** Mảnh phóng to tách ra từ thẻ: bay từ (fromX, fromY) tới (spec.x, spec.y), viền trắng, quầng màu; `pulse`: quầng thở chậm (nút được nhắc tới). */
export function Callout({ card, spec, f, fromX, fromY, away = 0 }: { card: Card; spec: CalloutSpec; f: number; fromX: number; fromY: number; away?: number }) {
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - spec.at, fps, config: { damping: 17, stiffness: 95, mass: 0.9 } })
  const out = spec.until !== undefined ? ramp(f, spec.until, 10, easeInOut) : 0
  const o = clamp01(s * 1.6) * (1 - out) * (1 - away)
  if (s <= 0.001 || o <= 0) return null
  const r = spec.rect
  const width = Math.min(spec.maxW, spec.maxH * r.w / r.h)
  const k = width / r.w
  const h = r.h * k
  const g = { danger: ds.danger, safe: ds.safe, brand: ds.brand }[spec.glow ?? "brand"]
  const breathe = spec.pulse ? 0.5 + 0.5 * Math.sin((f - spec.at) / 9) : 0
  const cx = fromX + (spec.x - fromX) * s, cy = fromY + (spec.y - fromY) * s
  return <div style={{ position: "absolute", left: cx - width / 2, top: cy - h / 2, width, height: h, zIndex: 40, perspective: 1600, opacity: o }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: Math.min(24, h * 0.3), overflow: "hidden", background: "#FFFFFF",
      transform: `scale(${(0.55 + 0.45 * s) * (1 - 0.04 * out)}) rotateY(${(1 - s) * -18}deg)`,
      boxShadow: `0 0 0 4px #FFFFFF, 0 0 ${50 + 40 * breathe}px ${alpha(g, 0.45 + 0.35 * breathe)}, 0 30px 70px ${alpha(ds.brandInk, 0.3)}` }}>
      <div style={{ position: "absolute", left: -r.x * k, top: -r.y * k, width: card.w, height: card.h, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <ScreenContent clip={card} f={f} />
      </div>
    </div>
  </div>
}
