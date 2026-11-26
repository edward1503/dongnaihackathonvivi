import React from "react"
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion"
import { Words } from "../../ui"
import { alpha, ds, FONT, inkFor, isDark, layout, type Theme } from "./mau"
import { easeInOut, ramp } from "./time"

/**
 * Tiêu đề chữ động (Words của ui.tsx): từng từ bật lên lệch nhau, phần *…* đổi màu nhấn.
 * at/out: khung trong cảnh. Chữ đứng yên từ khi hiện đủ tới `out`.
 */
export function Title({ text, at, out, theme, x = layout.textLeft, y, width = layout.textWidth, size = layout.titleSize, accent, align = "left", color, weight = 700 }: {
  text: string; at: number; out?: number; theme: Theme; x?: number; y: number; width?: number; size?: number; accent?: string
  align?: "left" | "center"; color?: string; weight?: number
}) {
  const f = useCurrentFrame()
  const o = out === undefined ? 1 : 1 - ramp(f, out, 8, easeInOut)
  if (o <= 0 || f < at) return null
  const ink = inkFor(theme)
  return <div style={{ position: "absolute", left: align === "center" ? x - width / 2 : x, top: y, width, opacity: o }}>
    <Words text={text} at={at / 30} size={size} color={color ?? ink.text} accent={accent ?? (isDark(theme) ? ds.brandLine : ds.brand)} weight={weight}
      center={align === "center"} stagger={2.2} style={{ textWrap: "balance" as never, lineHeight: 1.16 }} />
  </div>
}

/** Tranh minh họa phủ kín khung, đẩy chậm vào (Ken Burns), có thể tối đi. */
export function Illustration({ src, from = 0, dur = 300, zoom = [1.0, 1.06], origin = "50% 50%", dim = 0, opacity = 1, tint = ds.navy }: {
  src: string; from?: number; dur?: number; zoom?: [number, number]; origin?: string; dim?: number; opacity?: number; tint?: string
}) {
  const f = useCurrentFrame()
  const z = interpolate(f, [from, from + dur], zoom, { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  if (opacity <= 0) return null
  return <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
    <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`, transformOrigin: origin }} />
    {dim > 0 && <AbsoluteFill style={{ background: alpha(tint, dim) }} />}
  </AbsoluteFill>
}

/** Nhãn nhỏ đặt cạnh hình (vd "AI đóng vai"). */
export function Pill({ children, x, y, tone = "ai", opacity = 1, size = 26 }: { children: React.ReactNode; x: number; y: number; tone?: "ai" | "danger" | "brand" | "safe"; opacity?: number; size?: number }) {
  const c = { ai: [ds.aiC, ds.aiInk, ds.aiLine], danger: [ds.dangerC, ds.dangerInk, ds.dangerLine], brand: [ds.brandC, ds.brandInk, ds.brandLine], safe: [ds.safeC, ds.safeInk, ds.safeLine] }[tone]
  return <div style={{ position: "absolute", left: x, top: y, opacity, padding: "8px 18px", borderRadius: 999, background: c[0], color: c[1], border: `1.5px solid ${c[2]}`,
    fontFamily: FONT, fontSize: size, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</div>
}

/** Chữ thường (không động), cho nhãn nhỏ và dòng phụ. */
export function Text({ children, x, y, size = 36, color = ds.ink, weight = 600, width, align = "left", opacity = 1, style }: {
  children: React.ReactNode; x: number; y: number; size?: number; color?: string; weight?: number; width?: number; align?: "left" | "center"; opacity?: number; style?: React.CSSProperties
}) {
  return <div style={{ position: "absolute", left: align === "center" && width ? x - width / 2 : x, top: y, width, textAlign: align, opacity,
    fontFamily: FONT, fontSize: size, fontWeight: weight, color, lineHeight: 1.25, ...style }}>{children}</div>
}
