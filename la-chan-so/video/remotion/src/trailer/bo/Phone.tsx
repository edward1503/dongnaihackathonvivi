import React from "react"
import { Freeze, Img, interpolate, OffthreadVideo, spring, staticFile, useVideoConfig } from "remotion"
import { alpha, ds, v3 } from "./mau"
import type { Clip, Rect } from "./types"
import { clamp01, easeInOut, easeOut, ramp } from "./time"
import { DraftTag } from "./Nhan"

const BORDER = 10
const RADIUS = 44

/** Khung của đoạn quay ứng với khung `f` của cảnh (trừ các lần đứng hình), kẹp trong độ dài đoạn quay. */
export function clipFrameAt(clip: Clip, f: number) {
  const m = clip.map
  if (m && m.length) {
    let v = m[0][1]
    if (f >= m[m.length - 1][0]) v = m[m.length - 1][1]
    else for (let i = 0; i + 1 < m.length; i++) {
      const [a, va] = m[i], [b, vb] = m[i + 1]
      if (f >= a && f < b) { v = b === a ? vb : va + (vb - va) * (f - a) / (b - a); break }
    }
    return Math.max(0, Math.min(clip.frames - 1, Math.round(v)))
  }
  let held = 0
  for (const h of clip.holds ?? []) {
    if (f >= h.at + h.len) held += h.len
    else if (f > h.at) held += f - h.at
  }
  return Math.max(0, Math.min(clip.frames - 1, clip.trimBefore + (f - clip.from) - held))
}

/** Nội dung màn hình: đoạn quay (đứng ở khung tính được) hoặc dãy ảnh giữ chỗ hòa nhau. Vẽ đúng cỡ w×h của video rồi co giãn bên ngoài. */
export function ScreenContent({ clip, f }: { clip: Clip; f: number }) {
  if (clip.src) {
    return <>
      <Freeze frame={clipFrameAt(clip, f)}>
        <OffthreadVideo src={staticFile(clip.src)} muted style={{ position: "absolute", left: 0, top: 0, width: clip.w, height: clip.h }} />
      </Freeze>
      <Masks masks={clip.masks} />
    </>
  }
  const stills = clip.stills ?? []
  return <>{stills.map((s, i) => {
    const next = stills[i + 1]
    if (i > 0 && f < s.at) return null
    if (next && f >= next.at + 8) return null
    const o = i === 0 ? 1 : interpolate(f, [s.at, s.at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut })
    return <div key={i} style={{ position: "absolute", left: 0, top: 0, width: clip.w, height: clip.h, opacity: o }}>
      <Img src={staticFile(s.image)} style={{ position: "absolute", left: 0, top: 0, width: clip.w, height: clip.h }} />
      <Masks masks={s.masks} />
    </div>
  })}</>
}

function Masks({ masks }: { masks?: Rect[] }) {
  // Che đục hẳn: ô xám bo góc cho số điện thoại; có `fill` thì phủ trùng màu nền màn (giấu dòng chữ, không vẽ chữ giả).
  return <>{(masks ?? []).map((m, i) => <div key={i} style={{ position: "absolute", left: m.x, top: m.y, width: m.w, height: m.h,
    borderRadius: m.fill ? 0 : 18, background: m.fill ?? ds.ink3 }} />)}</>
}

export type PhoneProps = {
  clip: Clip; f: number
  /** Tâm và chiều cao khung máy (px màn hình). */
  x: number; y: number; h: number
  /** Khung bắt đầu trôi vào (nghiêng 3D chỉ lúc vào hình). */
  enterAt?: number; enterFrom?: "right" | "left" | "below" | "none"
  /** Vòng sóng chuông quanh máy trong [from, to). */
  ring?: { from: number; to: number } | null
  shake?: boolean
  opacity?: number; scale?: number; rotate?: number; dim?: number
  showDraftTag?: boolean
  /** 0..1: máy quay đẩy chậm vào máy (ảnh tĩnh khỏi đứng im). */
  drift?: number
}

/** Khung điện thoại dọc (bo góc 44, viền 10), bên trong là đoạn quay 1080×2400 hoặc 1176×2616 kèm thanh trạng thái thật. */
export function Phone({ clip, f, x, y, h, enterAt = 0, enterFrom = "right", ring = null, shake = false, opacity = 1, scale = 1, rotate = 0, dim = 0, showDraftTag = true, drift = 0 }: PhoneProps) {
  const { fps } = useVideoConfig()
  const innerH = h - BORDER * 2
  const k = innerH / clip.h
  const innerW = clip.w * k
  const w = innerW + BORDER * 2
  const s = enterFrom === "none" ? 1 : spring({ frame: f - enterAt, fps, config: { damping: 18, stiffness: 90, mass: 0.9 } })
  const dir = enterFrom === "left" ? -1 : 1
  const tx = enterFrom === "below" ? 0 : (1 - s) * 260 * dir
  const ty = enterFrom === "below" ? (1 - s) * 220 : (1 - s) * 30
  const ry = enterFrom === "below" || enterFrom === "none" ? 0 : (1 - s) * -16 * dir
  const rx = enterFrom === "below" ? (1 - s) * 14 : (1 - s) * 4
  // Rung theo nhịp chuông: 0,5 s rung, 0,2 s nghỉ.
  let jx = 0
  if (shake && ring && f >= ring.from && f < ring.to) {
    const ph = (f - ring.from) % 21
    if (ph < 15) jx = Math.sin(f * 2.6) * 2
  }
  // Vệt sáng quét qua mặt kính lúc máy vào hình.
  const sweep = ramp(f, enterAt + 6, 22, easeInOut)
  return <div style={{ position: "absolute", left: x - w / 2 + tx + jx, top: y - h / 2 + ty, width: w, height: h, perspective: 2000,
    opacity: opacity * clamp01(s * 1.6) }}>
    {ring && <RingWaves f={f} ring={ring} w={w} h={h} />}
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${-14 * drift}px) rotateY(${ry - 2.5 * drift}deg) rotateX(${rx}deg) rotateZ(${rotate}deg) scale(${scale * (1 + 0.035 * drift)})`,
      borderRadius: RADIUS, background: v3.frame, boxShadow: `0 40px 90px ${alpha(ds.ink, 0.35)}, 0 0 0 1.5px ${alpha(ds.ink3, 0.35)}, inset 0 0 0 1.5px ${alpha("#FFFFFF", 0.1)}` }}>
      <div style={{ position: "absolute", left: BORDER, top: BORDER, width: innerW, height: innerH, borderRadius: RADIUS - BORDER, overflow: "hidden", background: ds.navy }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: clip.w, height: clip.h, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          <ScreenContent clip={clip} f={f} />
          <Masks masks={clip.masks} />
        </div>
        {dim > 0 && <div style={{ position: "absolute", inset: 0, background: alpha(ds.navy, dim) }} />}
        {sweep > 0 && sweep < 1 && <div style={{ position: "absolute", top: -innerH * 0.2, height: innerH * 1.4, width: innerW * 0.5,
          left: interpolate(sweep, [0, 1], [-innerW * 0.7, innerW * 1.2]), transform: "rotate(18deg)",
          background: `linear-gradient(90deg, ${alpha("#FFFFFF", 0)}, ${alpha("#FFFFFF", 0.22)}, ${alpha("#FFFFFF", 0)})` }} />}
      </div>
    </div>
    {showDraftTag && clip.placeholder && <DraftTag id={clip.id} x={w / 2} y={h + 8} />}
  </div>
}

/** Vòng sóng chuông tỏa ra quanh máy, mỗi 0,7 s một vòng. */
function RingWaves({ f, ring, w, h }: { f: number; ring: { from: number; to: number }; w: number; h: number }) {
  if (f < ring.from) return null
  const waves: React.ReactNode[] = []
  for (let start = ring.from; start <= Math.min(f, ring.to); start += 21) {
    const p = (f - start) / 48
    if (p < 0 || p > 1) continue
    const e = easeOut(p)
    const R = h * 0.42 + e * h * 0.38
    waves.push(<div key={start} style={{ position: "absolute", left: w / 2 - R, top: h / 2 - R, width: R * 2, height: R * 2, borderRadius: "50%",
      border: `3px solid ${alpha(ds.brandLine, 0.55 * (1 - p))}` }} />)
  }
  return <>{waves}</>
}

/**
 * Mảnh phóng to tách khỏi máy: cắt vùng `rect` (px của video) của chính đoạn quay, nổi lên như tấm thẻ có quầng sáng.
 * `at`: khung bắt đầu bay ra; `out`: khung bắt đầu thu lại (tuỳ chọn).
 */
export function ScreenCrop({ clip, f, rect, x, y, width, at, out, glow = ds.brand, radius = 28 }: {
  clip: Clip; f: number; rect: Rect; x: number; y: number; width: number; at: number; out?: number; glow?: string; radius?: number
}) {
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 120, mass: 0.8 } })
  const q = out === undefined ? 0 : ramp(f, out, 10, easeInOut)
  if (s <= 0.001 || q >= 1) return null
  const k = width / rect.w
  const hgt = rect.h * k
  return <div style={{ position: "absolute", left: x - width / 2, top: y - hgt / 2, width, height: hgt, opacity: clamp01(s * 1.5) * (1 - q),
    transform: `translateY(${(1 - s) * 50}px) scale(${0.86 + 0.14 * s - 0.06 * q})`, borderRadius: radius, overflow: "hidden",
    boxShadow: `0 0 0 3px ${alpha("#FFFFFF", 0.9)}, 0 0 60px ${alpha(glow, 0.55)}, 0 40px 80px ${alpha(ds.ink, 0.35)}` }}>
    <div style={{ position: "absolute", left: -rect.x * k, top: -rect.y * k, width: clip.w, height: clip.h, transform: `scale(${k})`, transformOrigin: "0 0" }}>
      <ScreenContent clip={clip} f={f} />
      <Masks masks={clip.masks} />
    </div>
  </div>
}

/** Bề rộng khung máy với chiều cao h (để xếp bố cục). */
export function phoneWidth(clip: Clip, h: number) {
  return ((h - BORDER * 2) / clip.h) * clip.w + BORDER * 2
}
