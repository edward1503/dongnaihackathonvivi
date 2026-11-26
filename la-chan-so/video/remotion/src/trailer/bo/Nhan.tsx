import React from "react"
import { alpha, ds, FONT, isDark, layout, type Theme } from "./mau"

/** Nhãn nhỏ góc dưới trái: "Dữ liệu minh họa · …". */
export function DataTag({ text, theme, opacity = 1 }: { text: string; theme: Theme; opacity?: number }) {
  const dark = isDark(theme)
  return <div style={{ position: "absolute", left: layout.margin, bottom: layout.subtitleBottom - 6, opacity, display: "flex", alignItems: "center", gap: 10,
    fontFamily: FONT, fontSize: 24, fontWeight: 500, color: dark ? alpha(ds.brandC, 0.85) : ds.ink2, maxWidth: 340, lineHeight: 1.3,
    padding: "4px 12px", borderRadius: 10, background: dark ? alpha(ds.navy, 0.55) : alpha(ds.surface, 0.78) }}>
    <svg width={18} height={18} viewBox="0 0 24 24" style={{ flex: "none" }}>
      <circle cx={12} cy={12} r={10} fill="none" stroke="currentColor" strokeWidth={2} />
      <path d="M12 10.5v6M12 7.2v.2" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
    </svg>
    <span>{text}</span>
  </div>
}

/** Nhãn "Mô phỏng · giọng AI đóng vai" cho đoạn có giọng kẻ gian. */
export function SimTag({ text = "Mô phỏng · giọng AI đóng vai", style }: { text?: string; style?: React.CSSProperties }) {
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 999,
    background: alpha(ds.danger, 0.16), border: `1.5px solid ${alpha(ds.dangerLine, 0.7)}`, color: ds.dangerC,
    fontFamily: FONT, fontSize: 28, fontWeight: 600, whiteSpace: "nowrap", ...style }}>
    <span style={{ width: 10, height: 10, borderRadius: 5, background: ds.dangerLine }} />{text}
  </div>
}

/** Chip trụ góc trên trái, kèm ba vòng nhỏ: vòng đang nói tới sáng lên. Trụ cộng đồng to và sáng hơn. */
export function PillarChip({ ring, text, strong, theme, opacity = 1 }: { ring: 1 | 2 | 3; text: string; strong?: boolean; theme: Theme; opacity?: number }) {
  const dark = isDark(theme)
  const bg = strong ? ds.brand : dark ? alpha(ds.navy2, 0.9) : ds.surface
  const fg = strong ? "#FFFFFF" : dark ? ds.brandC : ds.brandInk
  const ringOn = strong ? "#FFFFFF" : ds.brand
  const ringOff = strong ? alpha("#FFFFFF", 0.35) : alpha(ds.brand, 0.25)
  const s = strong ? 1.18 : 1
  return <div style={{ position: "absolute", left: layout.margin, top: 72, opacity, transformOrigin: "0 50%", transform: `scale(${s})`,
    display: "flex", alignItems: "center", gap: 14, padding: "10px 24px 10px 14px", borderRadius: 999, background: bg,
    border: strong ? "none" : `1.5px solid ${dark ? alpha(ds.brandLine, 0.35) : ds.outline2}`,
    boxShadow: strong ? `0 10px 30px ${alpha(ds.brand, 0.35)}` : `0 6px 20px ${alpha(ds.ink, 0.08)}`,
    fontFamily: FONT, fontSize: 28, fontWeight: 700, color: fg, whiteSpace: "nowrap" }}>
    <svg width={34} height={34} viewBox="-17 -17 34 34">
      {[6, 10.5, 15].map((r, i) => <circle key={i} r={r} fill="none" stroke={i + 1 <= ring ? ringOn : ringOff} strokeWidth={i + 1 === ring ? 2.6 : 1.6} />)}
    </svg>
    {text}
  </div>
}

/** Dấu "giữ chỗ" trên bản nháp (đoạn quay chưa có). */
export function DraftTag({ id, x, y }: { id: string; x: number; y: number }) {
  return <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, 0)", padding: "3px 10px", borderRadius: 6,
    background: alpha(ds.warn, 0.85), color: "#fff", fontFamily: FONT, fontSize: 15, fontWeight: 600, whiteSpace: "nowrap" }}>giữ chỗ · {id}</div>
}
