import React from "react"
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import type { Lang } from "./content"

// Màu lấy từ web (ui/src/index.css).
export const C = {
  bg: "#f7f4ee", card: "#fffefa", ink: "#0c354b", muted: "#5f7077", teal: "#527b7a", tealSoft: "#e8eef0",
  accent: "#2f7f78", clay: "#b15c39", border: "#dcded8", muted2: "#eeece5",
}
export const FONT = "'Be Vietnam Pro', system-ui, sans-serif"
export const SW = 1440
export const SH = 810
export const out = Easing.bezier(0.22, 1, 0.36, 1)
export const inOut = Easing.bezier(0.65, 0, 0.35, 1)

export const sec = (s: number) => Math.round(s * 30)
export function prog(frame: number, start: number, dur: number, ease = out) {
  return interpolate(frame, [sec(start), sec(start + dur)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })
}

/** Nền kem của web với vài mảng màu mờ trôi chậm và lưới chấm rất nhạt. */
export function Background() {
  const f = useCurrentFrame()
  const blob = (x: number, y: number, size: number, color: string, speed: number, phase: number) => (
    <div style={{
      position: "absolute", width: size, height: size, borderRadius: "50%", filter: "blur(90px)", opacity: 0.55,
      left: x + Math.sin(f / speed + phase) * 70, top: y + Math.cos(f / (speed * 1.3) + phase) * 50,
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
    }} />
  )
  return <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
    {blob(-260, -320, 1100, "rgba(82,123,122,0.45)", 140, 0)}
    {blob(1150, 420, 1000, "rgba(12,53,75,0.22)", 170, 2)}
    {blob(600, 700, 800, "rgba(177,92,57,0.14)", 200, 4)}
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(12,53,75,0.07) 1.2px, transparent 1.2px)", backgroundSize: "30px 30px" }} />
  </AbsoluteFill>
}

/** Mờ dần vào và ra ở hai đầu một cảnh. */
export function SceneFade({ dur, children }: { dur: number; children: React.ReactNode }) {
  const f = useCurrentFrame()
  const total = sec(dur)
  const o = interpolate(f, [0, 9, total - 7, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>
}

/** Chữ hiện từng từ: mờ, hơi trồi lên, rõ dần. *…* là phần nhấn màu. */
export function Words({ text, at, size = 56, color = C.ink, accent = C.accent, weight = 700, stagger = 2.4, style, center = true }: {
  text: string; at: number; size?: number; color?: string; accent?: string; weight?: number; stagger?: number; style?: React.CSSProperties; center?: boolean
}) {
  const f = useCurrentFrame()
  const tokens: { w: string; hi: boolean }[] = []
  let hi = false
  for (const raw of text.split(" ")) {
    let w = raw
    const open = w.startsWith("*")
    if (open) { hi = true; w = w.slice(1) }
    const close = w.endsWith("*") || w.endsWith("*.") || w.endsWith("*,")
    const clean = w.replace(/\*/g, "")
    tokens.push({ w: clean, hi })
    if (close) hi = false
  }
  return <div style={{ fontFamily: FONT, fontSize: size, fontWeight: weight, color, lineHeight: 1.18, letterSpacing: "-0.015em",
    textAlign: center ? "center" : "left", ...style }}>
    {tokens.map((t, i) => {
      const p = interpolate(f, [sec(at) + i * stagger, sec(at) + i * stagger + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: out })
      return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, transform: `translateY(${(1 - p) * 22}px)`,
        filter: `blur(${(1 - p) * 6}px)`, color: t.hi ? accent : color }}>{t.w}{i < tokens.length - 1 ? " " : ""}</span>
    })}
  </div>
}

export function Typewriter({ text, at, cps = 22, size = 30, color = C.muted, weight = 500 }: { text: string; at: number; cps?: number; size?: number; color?: string; weight?: number }) {
  const f = useCurrentFrame()
  const n = Math.max(0, Math.floor((f - sec(at)) / 30 * cps))
  const caret = Math.floor(f / 15) % 2 === 0
  return <span style={{ fontFamily: FONT, fontSize: size, color, fontWeight: weight }}>
    {text.slice(0, n)}<span style={{ opacity: caret ? 1 : 0, color: C.accent }}>|</span>
  </span>
}

export function Pop({ at, children, style, from = 0.85 }: { at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - sec(at), fps, config: { damping: 15, stiffness: 140, mass: 0.7 } })
  return <div style={{ opacity: Math.min(1, s * 1.4), transform: `scale(${from + (1 - from) * s}) translateY(${(1 - s) * 18}px)`, ...style }}>{children}</div>
}

export function Chip({ children, tone = "plain", style }: { children: React.ReactNode; tone?: "plain" | "accent" | "clay" | "ink"; style?: React.CSSProperties }) {
  const tones = {
    plain: { background: C.card, color: C.ink, border: `1.5px solid ${C.border}` },
    accent: { background: "#e5f1ef", color: "#1f5f59", border: "1.5px solid #b9d8d3" },
    clay: { background: "#f8e9e2", color: C.clay, border: "1.5px solid #ecc8b8" },
    ink: { background: C.ink, color: C.card, border: `1.5px solid ${C.ink}` },
  }
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 22px", borderRadius: 999, fontFamily: FONT,
    fontSize: 26, fontWeight: 600, boxShadow: "0 10px 30px rgba(12,53,75,0.10)", whiteSpace: "nowrap", ...tones[tone], ...style }}>{children}</div>
}

export function Spinner({ size = 24, color = C.accent }: { size?: number; color?: string }) {
  const f = useCurrentFrame()
  return <div style={{ width: size, height: size, borderRadius: "50%", border: `3px solid ${color}33`, borderTopColor: color, transform: `rotate(${f * 14}deg)` }} />
}

export type Rect = { x: number; y: number; w: number; h: number; r?: number }
type View = { z: number; tx: number; ty: number }

/** Góc nhìn camera để vùng `r` (toạ độ CSS của ảnh chụp 1440×810) nằm giữa khung, có lề. */
export function frameRect(r: Rect | "full", pad = 40, zmax = 2.2): View {
  if (r === "full") return { z: 1, tx: 0, ty: 0 }
  const z = Math.max(1, Math.min(zmax, SW / (r.w + pad * 2), SH / (r.h + pad * 2)))
  let tx = SW / 2 - (r.x + r.w / 2) * z
  let ty = SH / 2 - (r.y + r.h / 2) * z
  tx = Math.min(0, Math.max(SW - SW * z, tx))
  ty = Math.min(0, Math.max(SH - SH * z, ty))
  return { z, tx, ty }
}

export type CamKey = { at: number; to: Rect | "full"; pad?: number; zmax?: number; dur?: number }
function viewAt(frame: number, keys: CamKey[]): View {
  let v = frameRect(keys[0].to, keys[0].pad, keys[0].zmax)
  for (const k of keys.slice(1)) {
    const p = prog(frame, k.at, k.dur ?? 1.1, inOut)
    if (p <= 0) break
    const t = frameRect(k.to, k.pad, k.zmax)
    v = { z: v.z + (t.z - v.z) * p, tx: v.tx + (t.tx - v.tx) * p, ty: v.ty + (t.ty - v.ty) * p }
  }
  return v
}

export type CursorKey = { at: number; x: number; y: number; click?: boolean }
export type Mark = { at: number; until?: number; rect: Rect; tone?: "accent" | "clay"; pad?: number }
/** Ảnh tĩnh (mặc định hòa vào ảnh trước 0,45 s; cut: thay ngay) hoặc một đoạn cuộn trang quay sẵn (film: tên, frames khung, mỗi khung một khung video). */
export type Shot = { name: string; at: number; cut?: boolean; dir?: string; ext?: string } | { film: string; frames: number; at: number; dir?: string; fade?: number }

/** Cửa sổ ứng dụng: ảnh chụp thật của web, camera phóng tới vùng cần xem, con trỏ, khung tô sáng. */
export function AppView({ lang, shots, cam, cursor = [], marks = [], enter = "tilt", width = 1440, x, y, children, dir = "shots" }: {
  lang: Lang; shots: Shot[]; cam: CamKey[]; cursor?: CursorKey[]; marks?: Mark[]; dir?: string
  enter?: "tilt" | "rise" | "none"; width?: number; x?: number; y?: number; children?: React.ReactNode
}) {
  const f = useCurrentFrame()
  const k = width / SW
  const v = viewAt(f, cam)
  const e = enter === "none" ? 1 : prog(f, 0, 1.4, out)
  const rx = enter === "tilt" ? (1 - e) * 24 : 0
  const ry = enter === "tilt" ? (1 - e) * -18 : 0
  const rz = enter === "tilt" ? (1 - e) * 4 : 0
  const ty = enter === "rise" ? (1 - e) * 60 : enter === "tilt" ? (1 - e) * 80 : 0
  const left = x ?? (1920 - width) / 2
  const top = y ?? 150
  return <div style={{ position: "absolute", left, top, width, height: SH * k, perspective: 2200 }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 18, overflow: "hidden", background: C.card, opacity: Math.min(1, e * 1.6),
      transform: `translateY(${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${0.92 + 0.08 * e})`,
      boxShadow: "0 50px 100px rgba(12,53,75,0.20), 0 0 0 1px rgba(12,53,75,0.10)" }}>
      <div style={{ width: SW, height: SH, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <div style={{ position: "relative", width: SW, height: SH, transformOrigin: "0 0", transform: `translate(${v.tx}px, ${v.ty}px) scale(${v.z})` }}>
          {shots.map((s, i) => {
            const base = `${s.dir ?? dir}/${lang}`
            const start = sec(s.at)
            if (i > 0 && f < start) return null
            // Ảnh sau phủ kín thì không vẽ ảnh trước nữa (đỡ tốn và không lộ viền).
            const next = shots[i + 1]
            if (next && f >= sec(next.at) + ("film" in next ? next.fade ?? 0 : next.cut ? 0 : 14)) return null
            if ("film" in s) {
              // fade: số khung hòa từ ảnh trước sang khung đầu (dùng khi đoạn cuộn bắt đầu sau một thao tác làm trang đổi bố cục).
              const fade = s.fade ?? 0
              const k = Math.min(s.frames - 1, Math.max(0, f - start - fade))
              const o = fade ? interpolate(f, [start, start + fade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: inOut }) : 1
              return <Img key={s.film + i} src={staticFile(`${base}/${s.film}-${String(k).padStart(2, "0")}.jpg`)} style={{ position: "absolute", inset: 0, width: SW, height: SH, opacity: o }} />
            }
            const o = i === 0 || s.cut ? 1 : interpolate(f, [start, start + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: inOut })
            return <Img key={s.name + i} src={staticFile(`${base}/${s.name}.${s.ext ?? "png"}`)} style={{ position: "absolute", inset: 0, width: SW, height: SH, opacity: o }} />
          })}
          {marks.map((m, i) => <Highlight key={i} m={m} zoom={v.z} />)}
          {cursor.length > 0 && <Cursor keys={cursor} zoom={v.z} />}
        </div>
      </div>
    </div>
    {children}
  </div>
}

/** Khung tô sáng ôm đúng ô: cùng tâm bo góc với phần tử (bo góc ô + lề), viền mảnh, sáng dần và thở nhẹ. */
function Highlight({ m, zoom }: { m: Mark; zoom: number }) {
  const f = useCurrentFrame()
  const p = prog(f, m.at, 0.45, inOut)
  const q = m.until === undefined ? 0 : prog(f, m.until, 0.4, inOut)
  if (p <= 0 || q >= 1) return null
  const pad = m.pad ?? 5
  const color = m.tone === "clay" ? C.clay : C.accent
  const breathe = 0.5 + 0.5 * Math.sin((f - sec(m.at)) / 14)
  const bw = 2.5 / zoom
  return <div style={{ position: "absolute", left: m.rect.x - pad, top: m.rect.y - pad, width: m.rect.w + pad * 2, height: m.rect.h + pad * 2,
    borderRadius: (m.rect.r ?? 6) + pad, border: `${bw}px solid ${color}`, opacity: p * (1 - q), boxSizing: "border-box",
    transform: `scale(${1.012 - 0.012 * p})`, boxShadow: `0 0 0 ${(3 + 3 * breathe) / zoom}px ${color}1f, 0 ${6 / zoom}px ${22 / zoom}px ${color}33` }} />
}

function Cursor({ keys, zoom }: { keys: CursorKey[]; zoom: number }) {
  const f = useCurrentFrame()
  let x = keys[0].x, y = keys[0].y
  const appear = prog(f, keys[0].at, 0.3)
  for (let i = 1; i < keys.length; i++) {
    const prev = keys[i - 1], k = keys[i]
    const start = Math.max(prev.at, k.at - 0.7)
    const p = prog(f, start, k.at - start, inOut)
    if (p <= 0) break
    x = prev.x + (k.x - prev.x) * p
    y = prev.y + (k.y - prev.y) * p
  }
  const clicks = keys.filter(k => k.click)
  const s = 1 / zoom
  const pressed = clicks.some(c => f >= sec(c.at) && f < sec(c.at) + 5)
  if (appear <= 0) return null
  return <>
    {clicks.map((c, i) => {
      const p = interpolate(f, [sec(c.at), sec(c.at) + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: out })
      if (f < sec(c.at) || p >= 1) return null
      const r = (10 + 46 * p) * s
      return <div key={i} style={{ position: "absolute", left: c.x - r, top: c.y - r, width: r * 2, height: r * 2, borderRadius: "50%",
        border: `${3 * s}px solid ${C.accent}`, opacity: 1 - p, background: `${C.accent}22` }} />
    })}
    <svg width={34 * s} height={44 * s} viewBox="0 0 34 44" style={{ position: "absolute", left: x - 3 * s, top: y - 2 * s, opacity: appear,
      transform: `scale(${pressed ? 0.88 : 1})`, transformOrigin: "0 0", filter: `drop-shadow(0 ${5 * s}px ${8 * s}px rgba(12,53,75,0.35))` }}>
      <path d="M3 2 L3 36 L12 28 L18 41 L24 38 L18 26 L30 26 Z" fill={C.ink} stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  </>
}

/** Một vùng cắt từ ảnh chụp, nổi lên như tấm thẻ (kiểu thẻ nổi trong video tham khảo). */
export function FloatCrop({ lang, shot, rect, scale, x, y, at, tilt = 0, z = 0 }: {
  lang: Lang; shot: string; rect: Rect; scale: number; x: number; y: number; at: number; tilt?: number; z?: number
}) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - sec(at), fps, config: { damping: 16, stiffness: 110, mass: 0.9 } })
  const w = rect.w * scale, h = rect.h * scale
  const drift = Math.sin((f - sec(at)) / 40) * 6
  return <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2 + drift, width: w, height: h, perspective: 1800, zIndex: z,
    opacity: Math.min(1, s * 1.5) }}>
    <div style={{ width: w, height: h, borderRadius: 16, overflow: "hidden", position: "relative", background: C.card,
      transform: `translateY(${(1 - s) * 70}px) rotateX(${(1 - s) * 20 + tilt * 0.4}deg) rotateY(${tilt}deg) scale(${0.9 + 0.1 * s})`,
      boxShadow: "0 40px 80px rgba(12,53,75,0.20), 0 0 0 1px rgba(12,53,75,0.10)" }}>
      <Img src={staticFile(`shots/${lang}/${shot}.png`)} style={{ position: "absolute", width: SW * scale, height: SH * scale, left: -rect.x * scale, top: -rect.y * scale }} />
    </div>
  </div>
}

export function Caption({ text, at, top = 52 }: { text: string; at: number; top?: number }) {
  return <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <Words text={text} at={at} size={46} />
  </div>
}

export function Counter({ to, at, dur = 1.4 }: { to: number; at: number; dur?: number }) {
  const f = useCurrentFrame()
  return <>{Math.round(to * prog(f, at, dur))}</>
}
