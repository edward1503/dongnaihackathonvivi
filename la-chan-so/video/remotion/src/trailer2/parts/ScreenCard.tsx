import React from "react"
import { spring, useVideoConfig } from "remotion"
import { alpha, ds, FONT, v3 } from "../../trailer/bo/mau"
import { ScreenContent } from "../../trailer/bo/Phone"
import { clamp01 } from "../../trailer/bo/time"
import type { Card } from "../types"

/**
 * Thẻ giao diện nổi: màn điện thoại (viền máy mảnh, bo góc) hoặc cửa sổ trình duyệt; phối cảnh 3D nhẹ, bóng đổ mềm.
 * Vào hình bằng lò xo từ bên phải rồi thẳng dần. `depth` 0..2: số thẻ mới hơn đã chồng lên (thẻ lùi trái, nhỏ, mờ).
 * `away` 0..1: rời cảnh. `size`: chiều cao (điện thoại) hoặc bề rộng (trình duyệt).
 */
export function ScreenCard({ card, f, x, y, size, rotY = -12, rotX = 5, depth = 0, away = 0, scale = 1, z = 0 }: {
  card: Card; f: number; x: number; y: number; size: number; rotY?: number; rotX?: number; depth?: number; away?: number; scale?: number; z?: number
}) {
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - card.enter, fps, config: { damping: 20, stiffness: 75, mass: 1 } })
  if (s <= 0.001 || depth >= 2.4) return null
  const browser = card.kind === "browser"
  const bare = card.kind === "bare"   // màn tự có khung tối bo góc (trang gọi video): không lồng thêm viền máy
  const bezel = browser || bare ? 0 : 9
  const bar = browser ? 40 : 0
  let w: number, h: number, innerW: number, innerH: number
  if (browser) { w = size; innerW = size; innerH = size * card.h / card.w; h = innerH + bar }
  else { h = size; innerH = h - bezel * 2; innerW = innerH * card.w / card.h; w = innerW + bezel * 2 }
  const k = innerW / card.w
  const tx = (1 - s) * 380 - away * 300 - depth * 240
  const sc = (0.88 + 0.12 * s) * (1 - 0.15 * depth) * (1 - 0.1 * away) * scale
  const o = clamp01(s * 1.4) * (1 - away) * (1 - 0.42 * depth)
  return <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, zIndex: z - Math.round(depth * 2), perspective: 2400, opacity: o }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: browser ? 18 : bare ? 34 : 46, overflow: "hidden", background: browser ? "#FFFFFF" : v3.frame,
      transform: `translateX(${tx}px) rotateY(${rotY - (1 - s) * 16 - depth * 6}deg) rotateX(${rotX * s}deg) scale(${sc})`,
      boxShadow: `0 50px 110px ${alpha(ds.brandInk, 0.28)}, 0 14px 34px ${alpha(ds.brandInk, 0.16)}, 0 0 0 1px ${alpha(ds.brandInk, 0.08)}` }}>
      {browser && <div style={{ height: bar, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: ds.surface2,
        borderBottom: `1px solid ${ds.outline2}`, fontFamily: FONT, fontSize: 17, color: ds.ink2 }}>
        {[ds.dangerLine, ds.warnLine, ds.safeLine].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
        <span style={{ marginLeft: 14 }}>Trang đội tình nguyện</span>
      </div>}
      <div style={{ position: "absolute", left: bezel, top: bezel + bar, width: innerW, height: innerH, borderRadius: browser ? 0 : bare ? 34 : 38, overflow: "hidden", background: ds.bg }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: card.w, height: card.h, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          <ScreenContent clip={card} f={f} />
        </div>
      </div>
    </div>
  </div>
}
