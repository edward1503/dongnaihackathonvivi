import React from "react"
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { alpha, ds, FONT } from "../../trailer/bo/mau"
import { easeInOut, easeOut, ramp } from "../../trailer/bo/time"
import type { Section } from "../types"

export const MARK = { x: 96, y: 52, tile: 60 }   // biểu tượng nhỏ góc trên trái suốt phim

function Tile({ logo, size, x, y, o = 1, rot = 0 }: { logo: string | null; size: number; x: number; y: number; o?: number; rot?: number }) {
  return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size * 0.26, background: "#FFFFFF",
    overflow: "hidden", opacity: o, transform: `rotate(${rot}deg)`,
    boxShadow: `0 ${size * 0.15}px ${size * 0.4}px ${alpha(ds.brandInk, 0.25)}, 0 0 0 1px ${alpha(ds.brandInk, 0.06)}` }}>
    {logo && <Img src={staticFile(logo)} style={{ position: "absolute", left: -size * 0.21, top: -size * 0.2, width: size * 1.42, height: size * 1.42 }} />}
  </div>
}

/** Khung mở: biểu tượng nổi lên giữa nền sáng, tên bên dưới; cuối nhịp cả cụm thu về góc trên trái. */
export function Intro({ s, logo }: { s: Section; logo: string | null }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = spring({ frame: f - 4, fps, config: { damping: 14, stiffness: 110, mass: 0.8 } })
  const name = spring({ frame: f - 12, fps, config: { damping: 16, stiffness: 120, mass: 0.8 } })
  const q = ramp(f, s.duration - 20, 20, easeInOut)
  const size = 220 + (MARK.tile - 220) * q
  const x = 960 + (MARK.x + MARK.tile / 2 - 960) * q, y = 400 + (MARK.y + MARK.tile / 2 - 400) * q
  return <div style={{ position: "absolute", inset: 0 }}>
    <Tile logo={logo} size={size * (0.6 + 0.4 * pop)} x={x} y={y} o={Math.min(1, pop * 1.5)} rot={(1 - pop) * -8} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 150, letterSpacing: "-0.03em",
      color: ds.ink, lineHeight: 1.1, opacity: Math.min(1, name * 1.5) * (1 - q), transform: `translateY(${(1 - name) * 40 - 120 * q}px) scale(${1 - 0.5 * q})` }}>{s.name}</div>
  </div>
}

/** Khung kết: biểu tượng và tên lớn giữa khung, câu kết, dòng đội, ghi công nhạc, ghi chú dữ liệu minh họa. */
export function Outro({ s, logo }: { s: Section; logo: string | null }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = spring({ frame: f - 2, fps, config: { damping: 15, stiffness: 100, mass: 0.9 } })
  const close = ramp(f, s.closingAt ?? 120, 16, easeOut)
  const lift = ramp(f, s.closingAt ?? 120, 20, easeInOut)
  return <div style={{ position: "absolute", inset: 0 }}>
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${-70 * lift}px)` }}>
      <Tile logo={logo} size={200 * (0.6 + 0.4 * pop)} x={960} y={330} o={Math.min(1, pop * 1.5)} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 460, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 140, letterSpacing: "-0.03em",
        color: ds.ink, lineHeight: 1.1, opacity: Math.min(1, pop * 1.5), transform: `translateY(${(1 - pop) * 40}px)` }}>{s.name}</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 590, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 52, color: ds.brand,
      opacity: close, transform: `translateY(${(1 - close) * 16}px)` }}>{s.closing}</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 34, color: ds.brandInk,
      opacity: ramp(f, (s.closingAt ?? 120) + 10, 16, easeOut) }}>
      <span style={{ padding: "12px 28px", borderRadius: 999, background: ds.brandC, border: `1.5px solid ${ds.brandLine}` }}>{s.team}</span>
    </div>
    {s.credit && <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontFamily: FONT, fontSize: 20, fontWeight: 500, lineHeight: 1.45,
      color: ds.ink2, opacity: ramp(f, (s.closingAt ?? 120) + 16, 16, easeOut) }}>{s.credit.map((c, i) => <div key={i}>{c}</div>)}</div>}
    {s.note && <div style={{ position: "absolute", left: 96, bottom: 120, fontFamily: FONT, fontSize: 22, fontWeight: 500, color: ds.ink2,
      opacity: ramp(f, (s.closingAt ?? 120) + 16, 16, easeOut) }}>{s.note}</div>}
  </div>
}
