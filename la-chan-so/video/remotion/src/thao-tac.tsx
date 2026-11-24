import React from "react"
type Lenh = unknown; type VaoRa = unknown
import { AbsoluteFill, Freeze, Html5Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion"
import { Background, C, FONT, frameRect, inOut, out, prog, sec, SH, SW, type Rect } from "./ui"

/* Video thao tác thật: mỗi bước là một đoạn quay web (ghi.mjs), thời gian đã nắn theo lời đọc (dung.py).
   Mọi mốc trong bước tính bằng giây kể từ đầu bước. Toạ độ là px CSS của trang quay 1440×810. */

export type Line = { text: string; at: number; until: number }
export type Aim = { t0: number; t1: number; rect: Rect; act: string; zoom?: number | null }
export type FlowStep = { flow: string; beats: number[] }
export type Step = {
  id: string; kind: "intro" | "outro" | "chapter" | "app" | "flow" | "code" | "io"; start: number; dur: number
  chapter: number; title: string; audio?: string | null; audioAt?: number; lines?: Line[]
  clip?: string; clipFrames?: number; warp?: { v: number; c: number; len: number; rate?: number }[]
  cursor?: [number, number, number][]; clicks?: [number, number, number][]
  aims?: Aim[]; scrolls?: [number, number][]; selects?: { t: number; rect: Rect; text: string }[]
  urls?: [number, string][]; titles?: [number, string][]; notes?: { t0: number; t1: number; text: string; sub?: string }[]; sfx?: { src: string; at: number; dur: number }[]; flow?: string; beats?: number[]; code?: Lenh; io?: VaoRa
}
export type Guide = {
  id: string; title: string; subtitle: string; badge: string; seconds: number; legend?: boolean
  chapters: { title: string; learn: string[]; image?: string | null }[]; steps: Step[]
}

const APP_W = 1520, K = APP_W / SW, APP_H = SH * K, BAR = 42
const APP_X = (1920 - APP_W) / 2, APP_Y = 82
const t2f = (t: number) => Math.round(t * 30)

/** Giờ đoạn quay ứng với giờ bước (giữ khung khi lời dài hơn thao tác). */
function clipTime(step: Step, t: number) {
  const warp = step.warp ?? []
  let c = 0
  for (const p of warp) {
    if (t < p.v) break
    c = p.c + Math.min(p.len, (t - p.v) * (p.rate ?? 1))
  }
  return c
}

function cursorAt(pts: [number, number, number][], t: number): [number, number] | null {
  if (!pts.length || t < pts[0][0] - 0.25) return null
  let i = 0
  while (i + 1 < pts.length && pts[i + 1][0] <= t) i++
  const a = pts[i], b = pts[i + 1]
  if (!b || t <= a[0]) return [a[1], a[2]]
  const p = (t - a[0]) / Math.max(0.001, b[0] - a[0])
  return [a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]
}

type View = { z: number; tx: number; ty: number }
const ZCAP = 1.3
const FULL: View = { z: 1, tx: 0, ty: 0 }
const lerpV = (a: View, b: View, p: number): View => ({ z: a.z + (b.z - a.z) * p, tx: a.tx + (b.tx - a.tx) * p, ty: a.ty + (b.ty - a.ty) * p })

/** Camera bám thao tác: tiến tới vùng đang thao tác, lùi ra toàn trang khi xong hoặc khi cuộn. */
function cameraAt(step: Step, t: number): View {
  const aims = step.aims ?? []
  const keys: { at: number; to: View; dur: number }[] = []
  aims.forEach((a, i) => {
    const pad = a.act === "look" ? 36 : a.act === "type" || a.act === "select" ? 150 : 210
    // Phóng vừa phải: vật được nhắm thường nhỏ (nút, nhãn), phóng mạnh làm khung chứa nó bị cắt (Hoàng 23/11: "canvas bị che khuất").
    const z = Math.min(ZCAP, a.zoom ?? (a.act === "look" ? 1.3 : a.act === "type" || a.act === "select" ? 1.3 : a.act === "move" ? 1.12 : 1.22))
    const view = frameRect(a.rect, pad, z)
    keys.push({ at: Math.max(0, a.t0 - 0.35), to: view, dur: 0.75 })
    // Hai thao tác sát nhau thì lia camera sang chỗ mới, không lùi ra toàn trang rồi lại phóng vào (đỡ giật).
    const next = aims[i + 1]
    if (!next || next.t0 - a.t1 > 1.8) keys.push({ at: Math.max(a.t1, a.t0 + 1.2), to: FULL, dur: 0.8 })
  })
  for (const [s0] of step.scrolls ?? []) keys.push({ at: s0 - 0.15, to: FULL, dur: 0.45 })
  keys.sort((a, b) => a.at - b.at)
  let v = FULL
  for (const k of keys) {
    if (t <= k.at) break
    const p = inOut(Math.min(1, (t - k.at) / k.dur))
    v = lerpV(v, k.to, p)
  }
  return v
}

function Spot({ step, t, zoom }: { step: Step; t: number; zoom: number }) {
  const active = (step.aims ?? []).filter(a => a.act !== "move" && t >= a.t0 - 0.3 && t <= a.t1 + 0.45).slice(-1)   // chỉ một vùng sáng một lúc, tránh tối chồng hai lớp
  return <>{active.map((a, i) => {
    const o = inOut(Math.min(1, (t - (a.t0 - 0.3)) / 0.4)) * inOut(Math.min(1, ((a.t1 + 0.45) - t) / 0.45))
    const pad = 7, r = a.rect
    const breathe = 0.5 + 0.5 * Math.sin(t * 5)
    // Mục tiêu nhỏ (một nút, một chữ) chỉ viền sáng; vùng lớn mới làm tối phần còn lại của trang.
    const dim = r.w * r.h >= 220 * 90 || a.act !== "look" ? 0.26 : 0
    return <div key={i} style={{ position: "absolute", left: r.x - pad, top: r.y - pad, width: r.w + pad * 2, height: r.h + pad * 2,
      borderRadius: (r.r ?? 6) + pad, opacity: o, boxSizing: "border-box",
      border: `${2.6 / zoom}px solid ${C.accent}`,
      boxShadow: `0 0 0 9999px rgba(12,53,75,${dim}), 0 0 0 ${(4 + 4 * breathe) / zoom}px ${C.accent}33, 0 ${8 / zoom}px ${26 / zoom}px ${C.accent}44` }} />
  })}</>
}

function Pointer({ step, t, zoom }: { step: Step; t: number; zoom: number }) {
  const pos = cursorAt(step.cursor ?? [], t)
  if (!pos) return null
  const s = 1 / zoom
  const clicks = step.clicks ?? []
  const pressed = clicks.some(([ct]) => t >= ct - 0.02 && t < ct + 0.14)
  return <>
    {clicks.map(([ct, x, y], i) => {
      const p = (t - ct) / 0.5
      if (p < 0 || p > 1) return null
      const e = out(p), r = (8 + 40 * e) * s
      return <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%",
        border: `${3 * s}px solid ${C.accent}`, opacity: 1 - p, background: `${C.accent}1f` }} />
    })}
    <svg width={30 * s} height={38 * s} viewBox="0 0 34 44" style={{ position: "absolute", left: pos[0] - 3 * s, top: pos[1] - 2 * s,
      transform: `scale(${pressed ? 0.86 : 1})`, transformOrigin: "3px 2px", filter: `drop-shadow(0 ${5 * s}px ${7 * s}px rgba(12,53,75,0.35))` }}>
      <path d="M3 2 L3 36 L12 28 L18 41 L24 38 L18 26 L30 26 Z" fill={C.ink} stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  </>
}

/** Bảng chọn gốc của trình duyệt không lên hình khi quay: vẽ lại một ô thả xuống nhỏ với giá trị vừa chọn. */
function SelectPop({ step, t, zoom }: { step: Step; t: number; zoom: number }) {
  return <>{(step.selects ?? []).map((s, i) => {
    const p = (t - (s.t - 0.25)) / 0.25, q = (t - (s.t + 1.1)) / 0.3
    if (p < 0 || q > 1) return null
    const o = Math.min(1, p) * (1 - Math.max(0, Math.min(1, q)))
    const k = 1 / zoom
    return <div key={i} style={{ position: "absolute", left: s.rect.x, top: s.rect.y + s.rect.h + 4, minWidth: Math.max(160, s.rect.w), opacity: o,
      transform: `translateY(${(1 - Math.min(1, p)) * -6}px)`, background: "#fff", borderRadius: 8, border: `1px solid ${C.border}`,
      boxShadow: "0 12px 30px rgba(12,53,75,0.18)", fontFamily: FONT, fontSize: 14, color: C.ink, overflow: "hidden" }}>
      <div style={{ padding: "7px 12px", background: `${C.accent}18`, fontWeight: 600, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: C.accent }}>✓</span>{s.text}</div>
      <div style={{ height: 2 * k }} />
    </div>
  })}</>
}

function BrowserBar({ step, t }: { step: Step; t: number }) {
  // Tên màn theo giờ bước (đã nắn): đổi đúng lúc màn đổi, không theo tên bước.
  const titles = step.titles ?? []
  let title = titles[0]?.[1] ?? step.title
  for (const [ut, u] of titles) if (t >= ut) title = u
  return <div style={{ height: BAR, display: "flex", alignItems: "center", gap: 14, padding: "0 16px", background: "#efece4",
    borderBottom: `1px solid ${C.border}`, fontFamily: FONT }}>
    <div style={{ display: "flex", gap: 7 }}>{["#e8a598", "#ecd08f", "#a9cfa4"].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />)}</div>
    <div style={{ flex: 1, maxWidth: 760, height: 26, borderRadius: 13, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
      padding: "0 14px", fontSize: 14, color: C.muted, gap: 6, overflow: "hidden", whiteSpace: "nowrap" }}>
      <span style={{ color: C.accent }}>🔒</span><span style={{ color: C.ink }}>la-chan-so.demo</span><span>/prototype</span></div>
    <div style={{ marginLeft: "auto", fontSize: 15, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{title}</div>
  </div>
}

function AppStep({ step }: { step: Step }) {
  const f = useCurrentFrame()
  const t = f / 30
  const c = clipTime(step, t)
  const v = cameraAt(step, t)
  const enter = prog(f, 0, 0.35, out)
  return <div style={{ position: "absolute", left: APP_X, top: APP_Y, width: APP_W, height: APP_H + BAR, borderRadius: 16, overflow: "hidden",
    background: C.card, boxShadow: "0 40px 90px rgba(12,53,75,0.20), 0 0 0 1px rgba(12,53,75,0.10)", opacity: 0.4 + 0.6 * enter }}>
    <BrowserBar step={step} t={t} />
    <div style={{ position: "relative", width: APP_W, height: APP_H, overflow: "hidden" }}>
      <div style={{ width: SW, height: SH, transform: `scale(${K})`, transformOrigin: "0 0" }}>
        <div style={{ position: "relative", width: SW, height: SH, transformOrigin: "0 0", transform: `translate(${v.tx}px, ${v.ty}px) scale(${v.z})` }}>
          <Freeze frame={Math.min((step.clipFrames ?? 1) - 1, t2f(c))}>
            <OffthreadVideo src={staticFile(step.clip!)} muted style={{ position: "absolute", inset: 0, width: SW, height: SH }} />
          </Freeze>
          <Spot step={step} t={t} zoom={v.z} />
          <SelectPop step={step} t={t} zoom={v.z} />
          <Pointer step={step} t={t} zoom={v.z} />
        </div>
      </div>
    </div>
  </div>
}

function Subtitle({ step }: { step: Step }) {
  const f = useCurrentFrame()
  const t = f / 30
  const lines = step.lines ?? []
  const line = lines.find(l => t >= l.at - 0.05 && t < l.until + 0.25)
  if (!line) return null
  const p = Math.min(1, (t - (line.at - 0.05)) / 0.2)
  return <div style={{ position: "absolute", left: 160, right: 160, top: APP_Y + APP_H + BAR + 16, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: FONT, fontSize: 29, lineHeight: 1.32, fontWeight: 500, color: C.ink, textAlign: "center", opacity: p,
      transform: `translateY(${(1 - p) * 6}px)`, textWrap: "balance" as never }}>{line.text}</div>
  </div>
}

function Note({ step }: { step: Step }) {
  const t = useCurrentFrame() / 30
  const n = (step.notes ?? []).find(x => t >= x.t0 && t < x.t1)
  if (!n) return null
  const p = Math.max(0, Math.min(1, (t - n.t0) / 0.3, (n.t1 - t) / 0.3))
  return <div style={{ position: "absolute", left: APP_X + 26, top: APP_Y + BAR + 300, width: 318, padding: "16px 18px", borderRadius: 16, background: "#0068FF", color: "#fff",
    fontFamily: FONT, boxShadow: "0 10px 30px rgba(0,40,120,0.35)", opacity: p, transform: `translateY(${(1 - p) * 8}px)` }}>
    <div style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.25 }}>{n.text}</div>
    {n.sub && <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.38, marginTop: 8, opacity: 0.94 }}>{n.sub}</div>}
  </div>
}

function TopBar({ g, step }: { g: Guide; step?: Step }) {
  const cur = step?.chapter ?? 0
  return <div style={{ position: "absolute", left: APP_X, right: APP_X, top: 20, height: 46, display: "flex", alignItems: "center", gap: 16, fontFamily: FONT }}>
    <Img src={staticFile("lcs-mark.png")} style={{ width: 40, height: 40, objectFit: "contain" }} />
    <div style={{ fontSize: 21, fontWeight: 800, color: C.ink, whiteSpace: "nowrap" }}>Lá chắn số</div>
    <div style={{ fontSize: 19, fontWeight: 600, color: C.muted, whiteSpace: "nowrap" }}>· {g.badge}</div>
    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
      {g.chapters.map((ch, i) => {
        const on = i + 1 === cur, done = i + 1 < cur
        return <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: on ? "6px 14px 6px 8px" : "6px 8px", borderRadius: 999,
          background: on ? C.ink : done ? `${C.accent}22` : "rgba(255,255,255,0.55)", border: `1px solid ${on ? C.ink : C.border}`,
          color: on ? "#fff" : done ? C.accent : C.muted, fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>
          <span style={{ width: 22, height: 22, borderRadius: 11, display: "grid", placeItems: "center", fontSize: 13,
            background: on ? C.accent : "transparent" }}>{done ? "✓" : i + 1}</span>{on && ch.title}</div>
      })}
    </div>
  </div>
}

function ChapterCard({ g, step }: { g: Guide; step: Step }) {
  const f = useCurrentFrame()
  const total = sec(step.dur)
  const p = prog(f, 0, 0.6, out)
  const q = interpolate(f, [total - 12, total], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const ch = g.chapters[step.chapter - 1]
  const img = prog(f, 0.15, 0.7, out)
  return <AbsoluteFill style={{ fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - q }}>
    {ch.image && <div style={{ position: "absolute", right: 130, top: "50%", width: 560, height: 373, marginTop: -186, borderRadius: 28, overflow: "hidden",
      boxShadow: "0 40px 90px rgba(12,53,75,0.18), 0 0 0 1px rgba(12,53,75,0.08)", opacity: img, transform: `translateX(${(1 - img) * 40}px) scale(${0.96 + 0.04 * img})` }}>
      <Img src={staticFile(ch.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
    <div style={{ ...(ch.image ? { position: "absolute", left: 120, top: "50%", marginTop: -170, height: 340, width: 1060 } : { width: 1240 }), boxSizing: "border-box", display: "flex", gap: ch.image ? 44 : 56, alignItems: "center", transform: `translateY(${(1 - p) * 30}px)`, opacity: p }}>
      <div style={{ fontSize: ch.image ? 180 : 230, fontWeight: 800, color: C.accent, lineHeight: 0.9, letterSpacing: "-0.04em" }}>{String(step.chapter).padStart(2, "0")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Phần {step.chapter}/{g.chapters.length}</div>
        <div style={{ fontSize: ch.image ? 62 : 70, fontWeight: 800, color: C.ink, lineHeight: 1.06, letterSpacing: "-0.01em" }}>{ch.title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
          {ch.learn.map((l, i) => {
            const r = prog(f, 0.35 + i * 0.22, 0.45, out)
            return <div key={i} style={{ display: "flex", gap: 14, alignItems: "baseline", fontSize: 31, color: C.ink, opacity: r, transform: `translateX(${(1 - r) * 20}px)` }}>
              <span style={{ color: C.accent, fontWeight: 800 }}>→</span>{l}</div>
          })}
        </div>
      </div>
    </div>
  </AbsoluteFill>
}

function IntroOutro({ g, step }: { g: Guide; step: Step }) {
  const f = useCurrentFrame()
  const total = sec(step.dur)
  const p = prog(f, 0, 0.7, out)
  const q = interpolate(f, [total - 14, total], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const intro = step.kind === "intro"
  return <AbsoluteFill style={{ fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", opacity: intro ? 1 - q : 1 }}>
    <div style={{ width: 1440, display: "grid", gridTemplateColumns: "1fr 540px", gap: 70, alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 26}px)` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Img src={staticFile("lcs-mark.png")} style={{ width: 84, height: 84, objectFit: "contain" }} />
          <div style={{ fontSize: 30, fontWeight: 700, color: C.muted }}>Đội 18 · Đề 4 · Hackathon thành phố Đồng Nai 2026</div>
        </div>
        <div style={{ fontSize: 70, fontWeight: 800, color: C.ink, lineHeight: 1.08, letterSpacing: "-0.015em", textWrap: "balance" as never }}>{intro ? g.title : "Tóm tắt"}</div>
        <div style={{ fontSize: 31, color: C.muted, lineHeight: 1.4 }}>{intro ? g.subtitle : "Cảnh báo sớm, người thân vào cuộc, cộng đồng cùng giữ. Prototype, dữ liệu giả lập."}</div>
        {intro && g.legend && <Legend step={step} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {g.chapters.map((ch, i) => {
          const r = prog(f, 0.4 + i * 0.16, 0.45, out)
          return <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "13px 18px", borderRadius: 14, background: "rgba(255,254,250,0.85)",
            border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(12,53,75,0.06)", opacity: r, transform: `translateX(${(1 - r) * 30}px)` }}>
            <span style={{ width: 36, height: 36, borderRadius: 18, display: "grid", placeItems: "center", background: intro ? C.ink : C.accent, color: "#fff",
              fontSize: 17, fontWeight: 800 }}>{intro ? i + 1 : "✓"}</span>
            <span style={{ fontSize: 27, fontWeight: 650 as never, color: C.ink }}>{ch.title}</span></div>
        })}
      </div>
    </div>
  </AbsoluteFill>
}

/** Chú giải màu ở thẻ mở đầu bản nội bộ: từng màu hiện đúng lúc lời đọc nhắc tới (câu có chữ "Màu"). */
function Legend({ step }: { step: Step }) {
  const f = useCurrentFrame()
  const t = f / 30
  const line = (step.lines ?? []).find(l => /màu/i.test(l.text)) ?? step.lines?.[step.lines.length - 1]
  const at = line?.at ?? 2, span = Math.max(1.5, (line?.until ?? at + 4) - at)
  const items = [["Code tính", C.accent, "xanh"], ["Mô hình đọc", C.clay, "cam"], ["Người quyết", C.ink, "mực"], ["Kho lưu", "#6b5fa8", "tím"]] as const
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
    {items.map(([label, color, name], i) => {
      const p = out(Math.max(0, Math.min(1, (t - (at + span * Math.min(i, 2) / 3 + (i === 3 ? span * 0.9 : 0))) / 0.45)))
      return <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px 9px 10px", borderRadius: 999,
        background: color + "18", border: `1.5px solid ${color}55`, opacity: p, transform: `translateY(${(1 - p) * 12}px) scale(${0.9 + 0.1 * p})` }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: color }} />
        <span style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>{label}</span>
        <span style={{ fontSize: 18, color: C.muted }}>{name}</span></div>
    })}
  </div>
}

export function ThaoTac({ g, flows }: { g: Guide; flows?: Record<string, React.FC<{ step: Step }>> }) {
  const f = useCurrentFrame()
  const now = f / 30
  const current = g.steps.find(s => now >= s.start && now < s.start + s.dur)
  return <AbsoluteFill>
    <Background />
    {g.steps.map(s => {
      const from = sec(s.start), dur = Math.max(1, sec(s.dur))
      const Flow = s.kind === "flow" && s.flow ? flows?.[s.flow] : undefined
      return <Sequence key={s.id} from={from} durationInFrames={dur} name={s.id}>
        {s.kind === "app" && <><AppStep step={s} /><Subtitle step={s} /><Note step={s} /></>}
        {Flow && <><Flow step={s} /><Subtitle step={s} /></>}
        {s.kind === "chapter" && <ChapterCard g={g} step={s} />}
        {(s.kind === "intro" || s.kind === "outro") && <IntroOutro g={g} step={s} />}
        {s.audio && <Sequence from={sec(s.audioAt ?? 0.3)} name="lời"><Html5Audio src={staticFile(s.audio)} /></Sequence>}
        {(s.sfx ?? []).map((x, i) => { const d = Math.max(2, sec(x.dur)); return <Sequence key={"g" + i} from={sec(x.at)} durationInFrames={d} name={"tiếng gốc " + x.src.split("/").pop()}>
          <Html5Audio src={staticFile(x.src)} volume={(fr: number) => interpolate(fr, [0, 1, d - 2, d], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} /></Sequence> })}
      </Sequence>
    })}
    {current && current.kind !== "intro" && current.kind !== "outro" && current.kind !== "chapter" && <TopBar g={g} step={current} />}
  </AbsoluteFill>
}
