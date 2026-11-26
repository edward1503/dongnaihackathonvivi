import React from "react"
import { alpha, ds, FONT, isDark, layout, type Theme } from "./mau"
import type { Subtitle } from "./types"
import { ramp } from "./time"

/** Phụ đề nhỏ (34 px) một dòng ở đáy, giữa khung. `frame` là khung trong cảnh. */
export function Subtitles({ items, frame, theme }: { items: Subtitle[]; frame: number; theme: Theme }) {
  const cur = items.find(s => frame >= s.from && frame < s.to)
  if (!cur) return null
  const o = Math.min(ramp(frame, cur.from, 4), 1 - ramp(frame, cur.to - 4, 4))
  const dark = isDark(theme)
  return <div style={{ position: "absolute", left: 420, right: 420, bottom: layout.subtitleBottom, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: FONT, fontSize: layout.subSize, lineHeight: 1.3, fontWeight: 500, textAlign: "center", opacity: o,
      color: dark ? "#FFFFFF" : ds.ink, padding: "4px 18px", borderRadius: 12,
      background: dark ? alpha(ds.navy, 0.55) : alpha(ds.surface, 0.78),
      textShadow: dark ? `0 2px 8px ${alpha(ds.navy, 0.8)}` : "none" }}>{cur.text}</div>
  </div>
}
