import React from "react"
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { alpha, ds } from "../../trailer/bo/mau"
import { clamp01, easeInOut, ramp } from "../../trailer/bo/time"

export type PresenterData = { poses: { at: number; pose: string }[]; amps: number[]; introEnd: number; outroFrom: number }

// Bé Nai dẫn chuyện: đứng cạnh logo ở khung mở và khung kết, ở góc dưới trái suốt các nhịp tính năng.
// Đổi tư thế bằng chéo mờ và nảy nhẹ; lúc nói thì nhún, phồng nhẹ theo biên độ giọng (RMS từng khung).
const SPOT = {
  intro: { x: 1610, y: 820, size: 460 },     // x: tâm, y: chân (bên phải tên, không che chữ)
  feature: { x: 250, y: 1012, size: 420 },
  outro: { x: 1620, y: 800, size: 450 },
}
const mix = (a: typeof SPOT.intro, b: typeof SPOT.intro, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, size: a.size + (b.size - a.size) * t })

export function Presenter({ data, dir = "trailer2/anh" }: { data: PresenterData; dir?: string }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const toFeature = ramp(f, data.introEnd - 22, 22, easeInOut)
  const toOutro = ramp(f, data.outroFrom - 4, 22, easeInOut)
  const spot = toOutro > 0 ? mix(SPOT.feature, SPOT.outro, toOutro) : mix(SPOT.intro, SPOT.feature, toFeature)
  const appear = spring({ frame: f - 6, fps, config: { damping: 13, stiffness: 120, mass: 0.8 } })
  let cur = 0
  data.poses.forEach((p, i) => { if (f >= p.at) cur = i })
  const p = data.poses[cur]
  const prev = cur > 0 ? data.poses[cur - 1] : null
  const fade = prev ? ramp(f, p.at, 8, easeInOut) : 1
  const pop = spring({ frame: f - p.at, fps, config: { damping: 10, stiffness: 170, mass: 0.6 } })
  const amp = ((data.amps[f - 1] ?? 0) + (data.amps[f] ?? 0) * 2 + (data.amps[f + 1] ?? 0)) / 4
  const idle = Math.sin(f / 17) * 0.008
  const sx = (1 + idle - 0.012 * amp) * (0.94 + 0.06 * pop)
  const sy = (1 + idle + 0.04 * amp) * (0.94 + 0.06 * pop)
  const S = spot.size * (0.4 + 0.6 * appear)
  const left = spot.x - S / 2, top = spot.y - S
  const img = (pose: string, o: number) => <Img src={staticFile(`${dir}/${pose}.png`)} style={{ position: "absolute", left: 0, top: 0, width: S, height: S, opacity: o }} />
  return <>
    <div style={{ position: "absolute", left: spot.x - S * 0.28, top: spot.y - 20, width: S * 0.56, height: 34, borderRadius: "50%", opacity: clamp01(appear) * (0.8 - 0.3 * amp),
      background: `radial-gradient(ellipse at center, ${alpha(ds.brandInk, 0.28)} 0%, ${alpha(ds.brandInk, 0)} 70%)`, zIndex: 48 }} />
    <div style={{ position: "absolute", left, top, width: S, height: S, zIndex: 49, opacity: clamp01(appear * 1.5),
      transformOrigin: "50% 94%", transform: `translateY(${-10 * amp}px) scale(${sx}, ${sy}) rotate(${interpolate(pop, [0, 1], [-4, 0])}deg)` }}>
      {prev && fade < 1 && img(prev.pose, 1 - fade)}
      {img(p.pose, fade)}
    </div>
  </>
}
