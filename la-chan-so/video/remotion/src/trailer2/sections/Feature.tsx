import React from "react"
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { alpha, ds, FONT } from "../../trailer/bo/mau"
import { clamp01, easeInOut, easeOut, ramp } from "../../trailer/bo/time"
import { Waveform } from "../../trailer/bo/SongAm"
import { Thread } from "../../trailer/bo/SoiNoi"
import { ScreenContent } from "../../trailer/bo/Phone"
import type { Card, Section } from "../types"
import { ScreenCard } from "../parts/ScreenCard"
import { Heading } from "../parts/Heading"
import { Callout } from "../parts/Callout"

// Một nhịp tính năng: tiêu đề bên trái; thẻ màn app nổi bên phải, thẻ mới trượt vào và đẩy thẻ cũ lùi theo bậc thang;
// một khoảnh khắc chính ở ô dưới tiêu đề (mảnh phóng to, thẻ giọng nói, thông báo). Thẻ rời đi khi sang nhịp sau.
const FRONT = { x: 1350, y: 545, h: 860, bw: 1040 }

export function Feature({ s, over, logo }: { s: Section; over: number; logo: string | null }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const D = s.duration
  const away = ramp(f, D - 4, over, easeInOut)
  const t = clamp01(f / D)
  const drift = -22 * t
  const rotY = -13 + 4 * t
  const main = s.cards.filter(c => !c.side)
  const twoUp = !!s.thread && main.length === 2
  const depthOf = (i: number) => main.slice(i + 1).reduce((acc, c) => acc + ramp(f, c.enter, 22, easeInOut), 0)
  const bump = (s.bumps ?? []).reduce((acc, b) => {
    const d = f - b
    return d < 0 || d > 20 ? acc : acc + 0.045 * Math.sin(Math.PI * d / 20) * (1 - d / 40)
  }, 0)
  const zoom = (s.zoom ? interpolate(f, [s.zoom.from, s.zoom.to], [1, s.zoom.scale], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut }) : 1) * (1 + bump)
  const posOf = (c: Card, i: number) => {
    if (twoUp) return { x: i === 0 ? 1180 : 1620, y: FRONT.y, depth: 0 }
    return { x: c.kind === "browser" ? 1425 : FRONT.x, y: FRONT.y, depth: depthOf(i) }
  }

  const cards = main.map((c, i) => {
    const p = posOf(c, i)
    const front = i === main.length - 1 || p.depth < 0.5
    return <ScreenCard key={i} card={c} f={f} x={p.x} y={p.y} size={c.kind === "browser" ? 930 : twoUp && i === 0 ? FRONT.h * 0.92 : FRONT.h}
      rotY={twoUp && i === 0 ? rotY + 8 : rotY} depth={twoUp ? 0 : p.depth} away={away} scale={front ? zoom : 1} z={10 + i} />
  })
  const side = s.cards.filter(c => c.side).map((c, i) =>
    <ScreenCard key={`s${i}`} card={c} f={f} x={1690} y={640} size={640} rotY={-22} depth={0} away={away} z={30} />)

  const cardFor = (idx: number): Card | undefined => idx < 0 ? s.source : s.cards[idx]
  const callouts = s.callouts.map((co, i) => {
    const c = cardFor(co.card)
    if (!c) return null
    const p = co.card >= 0 && main.indexOf(c) >= 0 ? posOf(c, main.indexOf(c)) : { x: FRONT.x, y: FRONT.y }
    return <Callout key={i} card={c} spec={co} f={f} fromX={p.x + drift} fromY={p.y} away={away} />
  })

  const wc = s.waveCard
  const waveIn = wc ? spring({ frame: f - wc.at, fps, config: { damping: 18, stiffness: 100 } }) : 0
  const waveOut = wc ? ramp(f, wc.until, 10, easeInOut) : 0
  const nt = s.notify
  const notifyIn = nt ? spring({ frame: f - nt.at, fps, config: { damping: 16, stiffness: 110 } }) : 0
  const ring = s.ring

  return <div style={{ position: "absolute", inset: 0 }}>
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${drift}px)` }}>
      {ring && f >= ring.from && Array.from({ length: 8 }, (_, k) => {
        const start = ring.from + k * 20
        const p = (f - start) / 44
        if (start > ring.to || p < 0 || p > 1) return null
        const R = 150 + easeOut(p) * 260
        const cy = FRONT.y + (ring.cy ?? 0) * FRONT.h
        return <div key={k} style={{ position: "absolute", left: FRONT.x - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: "50%",
          border: `3px solid ${alpha(ds.brand, 0.45 * (1 - p) * (1 - away))}` }} />
      })}
      {twoUp && s.thread && <Thread from={[1330, 520]} to={[1460, 520]} bend={-90} draw={ramp(f, s.thread.at, 16)}
        pulse={f >= s.thread.at + 8 && f < s.thread.at + 38 ? (f - s.thread.at - 8) / 30 : null} color={ds.brand} width={4} opacity={1 - away} />}
      {cards}
      {side}
    </div>
    <Heading f={f} chip={s.chip} titles={s.titles} accent={s.accent} away={away} />
    {callouts}
    {wc && waveIn > 0.001 && waveOut < 1 && <div style={{ position: "absolute", left: wc.x - 280, top: wc.y - 110, width: 560, padding: "22px 26px", borderRadius: 26,
      background: "#FFFFFF", boxShadow: `0 30px 80px ${alpha(ds.brandInk, 0.25)}, 0 0 0 1px ${alpha(ds.brandInk, 0.06)}`, zIndex: 40,
      opacity: clamp01(waveIn * 1.5) * (1 - waveOut) * (1 - away), transform: `translateY(${(1 - waveIn) * 40}px)`, fontFamily: FONT }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: ds.brand }}>{wc.label ?? "Bé Nai đang hỏi"}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: ds.ink, lineHeight: 1.2, marginTop: 6 }}>{wc.text}</div>
      <div style={{ marginTop: 14 }}><Waveform amps={wc.amps} frame={f - wc.at - 4} color={ds.brand} width={508} height={60} bars={44} /></div>
    </div>}
    {nt && notifyIn > 0.001 && <div style={{ position: "absolute", left: nt.x - 280, top: nt.y - 60, width: "max-content", minWidth: 600, padding: "20px 36px 20px 22px", borderRadius: 28, zIndex: 40,
      background: "#FFFFFF", display: "flex", gap: 20, alignItems: "center", fontFamily: FONT,
      boxShadow: `0 30px 80px ${alpha(ds.brandInk, 0.28)}, 0 0 0 1px ${alpha(ds.brandInk, 0.06)}`, opacity: clamp01(notifyIn * 1.5) * (1 - away),
      transform: `translateY(${(1 - notifyIn) * -60}px)` }}>
      <div style={{ position: "relative", width: 78, height: 78, borderRadius: 20, background: ds.brandC, overflow: "hidden", flex: "none" }}>
        {logo && <Img src={staticFile(logo)} style={{ position: "absolute", left: -16, top: -15, width: 110, height: 110 }} />}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 600, color: ds.ink2 }}>{nt.app} · bây giờ</div>
        <div style={{ fontSize: 31, fontWeight: 800, color: ds.ink, whiteSpace: "nowrap" }}>{nt.text}</div>
      </div>
    </div>}
    {s.pill && <div style={{ position: "absolute", left: s.pill.x, top: s.pill.y, padding: "12px 24px", borderRadius: 999, background: ds.aiC, color: ds.aiInk,
      border: `1.5px solid ${ds.aiLine}`, fontFamily: FONT, fontSize: 34, fontWeight: 700, whiteSpace: "nowrap", zIndex: 40,
      opacity: ramp(f, s.pill.at, 12, easeOut) * (1 - away), boxShadow: `0 20px 50px ${alpha(ds.brandInk, 0.18)}` }}>{s.pill.text}</div>}
    {s.minis && s.source && <Minis card={s.source} f={f} at={s.minis.at} n={s.minis.n} away={away} />}
  </div>
}

/** Thẻ đỏ nhân lên trên nhiều máy nhỏ: mọi máy dùng chung một danh sách. */
function Minis({ card, f, at, n, away }: { card: Card; f: number; at: number; n: number; away: number }) {
  const { fps } = useVideoConfig()
  const H = 230, W = H * card.w / card.h
  return <>{Array.from({ length: Math.min(n, 5) }, (_, i) => {
    const s = spring({ frame: f - at - i * 4, fps, config: { damping: 16, stiffness: 120 } })
    if (s <= 0.001) return null
    const k = (H - 8) / card.h
    return <div key={i} style={{ position: "absolute", left: 470 + i * 112, top: 690 + (i % 2) * 24, width: W, height: H, borderRadius: 18, background: "#0B0F1A",
      overflow: "hidden", zIndex: 45, opacity: clamp01(s * 1.5) * (1 - away), transform: `translateY(${(1 - s) * 60}px) rotate(${(i - (n - 1) / 2) * 2}deg)`,
      boxShadow: `0 16px 36px ${alpha(ds.brandInk, 0.3)}` }}>
      <div style={{ position: "absolute", left: 4, top: 4, width: card.w, height: card.h, transform: `scale(${k})`, transformOrigin: "0 0", borderRadius: 14 / k, overflow: "hidden" }}>
        <ScreenContent clip={card} f={f} />
      </div>
    </div>
  })}</>
}
