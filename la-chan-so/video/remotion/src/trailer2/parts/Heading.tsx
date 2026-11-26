import React from "react"
import { Words } from "../../ui"
import { alpha, ds, FONT } from "../../trailer/bo/mau"
import { easeInOut, easeOut, ramp } from "../../trailer/bo/time"

/** Chip tính năng nhỏ và tiêu đề đậm (800) bật từng từ; có thể đổi tiêu đề giữa phần. `away` 0..1: trượt lên, mờ khi sang phần sau. */
export function Heading({ f, chip, titles, accent = "brand", away = 0, x = 120, y = 190, width = 820 }: {
  f: number; chip: string | null; titles: { text: string; at: number }[]; accent?: "danger" | "brand"; away?: number; x?: number; y?: number; width?: number
}) {
  const chipIn = ramp(f, 2, 14, easeOut)
  const o = 1 - away
  if (o <= 0) return null
  const acc = accent === "danger" ? ds.danger : ds.brand
  return <div style={{ position: "absolute", left: x, top: y, width, opacity: o, transform: `translateY(${-40 * easeInOut(away)}px)` }}>
    {chip && <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 20px", borderRadius: 999, marginBottom: 20,
      background: accent === "danger" ? ds.dangerC : ds.brandC, border: `1.5px solid ${accent === "danger" ? ds.dangerLine : ds.brandLine}`,
      color: accent === "danger" ? ds.dangerInk : ds.brandInk, fontFamily: FONT, fontSize: 28, fontWeight: 700, opacity: chipIn,
      transform: `translateY(${(1 - chipIn) * 12}px)` }}>
      <span style={{ width: 10, height: 10, borderRadius: 5, background: acc }} />{chip}
    </div>}
    <div style={{ position: "relative", minHeight: 220 }}>
      {titles.map((t, i) => {
        const next = titles[i + 1]
        const out = next ? ramp(f, next.at - 8, 8, easeInOut) : 0
        if (f < t.at || out >= 1) return null
        const len = t.text.replace(/\*/g, "").length
        return <div key={i} style={{ position: "absolute", left: 0, top: 0, width, opacity: 1 - out }}>
          <Words text={t.text} at={t.at / 30} size={len > 30 ? 76 : len > 22 ? 88 : 100} weight={800} color={ds.ink} accent={acc} center={false} stagger={2.4}
            style={{ lineHeight: 1.06, letterSpacing: "-0.025em", textWrap: "balance" as never }} />
        </div>
      })}
    </div>
  </div>
}
