import React from "react"
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion"
import type { Scene, TrailerData } from "./bo/types"
import { alpha, ds, night, v3, type Theme } from "./bo/mau"
import { easeInOut, easeOut, ramp } from "./bo/time"
import { shieldPoints } from "./bo/Nui"
import { DataTag, PillarChip } from "./bo/Nhan"
import { Subtitles } from "./bo/PhuDe"
import { C0 } from "./canh/C0"
import { C1 } from "./canh/C1"
import { C2 } from "./canh/C2"
import { C3 } from "./canh/C3"
import { C4 } from "./canh/C4"
import { C5 } from "./canh/C5"
import { C6 } from "./canh/C6"
import { C7 } from "./canh/C7"

// Trailer ghép cảnh theo dữ liệu src/data/trailer.json. Mỗi cảnh một tệp trong canh/ (sửa song song không đụng nhau).
const SCENES: Record<string, React.FC<{ scene: Scene; credit?: string | null }>> = { C0, C1, C2, C3, C4, C5, C6, C7 }
const TAIL = 10   // số khung cảnh cũ còn vẽ chồng lên đầu cảnh mới khi chuyển kiểu "đẩy theo chiều sâu"
const HOLD = 24   // exit "hold": cảnh cũ đứng yên dưới cảnh mới trong lúc cảnh mới lan ra (màu lan)

/** Nền theo chủ đề. */
export function ThemeBg({ theme }: { theme: Theme }) {
  const bg = {
    night: `radial-gradient(ellipse 80% 70% at 50% 45%, ${ds.navy2} 0%, ${night} 70%)`,
    brand: `radial-gradient(ellipse 75% 75% at 50% 42%, ${ds.brand} 0%, ${ds.brandInk} 55%, ${ds.navy} 100%)`,
    light: `radial-gradient(ellipse 70% 80% at 18% 20%, ${ds.brandC} 0%, ${alpha(ds.brandC, 0)} 60%), ${ds.bg}`,
    warm: `radial-gradient(ellipse 70% 70% at 50% 40%, #FFFFFF 0%, ${v3.cream} 70%)`,
  }[theme]
  return <AbsoluteFill style={{ background: bg }} />
}

/** Nền cả bài: nền cảnh trước, nền cảnh này lộ ra theo kiểu (cắt, hòa, lau hình khiên, màu lan). */
function Backdrop({ scenes }: { scenes: Scene[] }) {
  const f = useCurrentFrame()
  let i = scenes.findIndex(s => f >= s.from && f < s.from + s.duration)
  if (i < 0) i = f < 0 ? 0 : scenes.length - 1
  const s = scenes[i]
  const prev = scenes[i - 1]
  const b = s.backdrop
  const lf = f - s.from
  const p = b.reveal === "cut" || !prev ? 1 : ramp(lf, b.at, b.dur, b.reveal === "spread" ? easeInOut : easeOut)
  if (p >= 1 || !prev) return <ThemeBg theme={b.theme} />
  if (p <= 0) return <ThemeBg theme={prev.backdrop.theme} />
  let clip: string | undefined
  let opacity = 1
  if (b.reveal === "shield") {
    // Màu đổ vào trong nét khiên vẽ quanh cây (C1), rồi khiên lớn dần tới khi phủ kín khung.
    const pts = shieldPoints(b.cx ?? 960, b.cy ?? 440, 1150 * (1 + 5 * Math.max(0, p - 0.25) / 0.75))
    clip = `polygon(${pts.map(q => `${q[0].toFixed(0)}px ${q[1].toFixed(0)}px`).join(",")})`
    opacity = Math.min(1, p / 0.25)
  } else if (b.reveal === "spread") {
    clip = `circle(${(p * 1250).toFixed(0)}px at ${b.cx ?? 960}px ${b.cy ?? 540}px)`
  } else opacity = p
  return <>
    <ThemeBg theme={prev.backdrop.theme} />
    <AbsoluteFill style={{ clipPath: clip, opacity }}><ThemeBg theme={b.theme} /></AbsoluteFill>
  </>
}

/** Vỏ chuyển cảnh: đẩy theo chiều sâu (cảnh cũ lùi và mờ, cảnh mới tiến tới). */
function Shell({ scene, children }: { scene: Scene; children: React.ReactNode }) {
  const f = useCurrentFrame()
  let scale = 1, opacity = 1
  if (scene.enter === "depth") {
    const p = ramp(f, 0, 12, easeOut)
    scale *= 1.05 - 0.05 * p; opacity *= p
  } else if (scene.enter === "fade") {
    opacity *= ramp(f, 0, 10, easeInOut)
  }
  if (scene.exit === "depth") {
    const q = ramp(f, scene.duration - 2, TAIL, easeInOut)
    // Cảnh nền tranh phủ kín (nền đêm) thì tiến tới và mờ, không co lại (co sẽ lộ mép tranh).
    scale *= scene.theme === "night" ? 1 + 0.04 * q : 1 - 0.06 * q; opacity *= 1 - q
  } else if (scene.exit !== "hold" && f >= scene.duration) opacity = 0
  return <AbsoluteFill style={{ transform: `scale(${scale})`, opacity }}>{children}</AbsoluteFill>
}

/** Chip trụ, nhãn dữ liệu, phụ đề: vẽ trên cùng, không chạy theo chuyển động của cảnh. */
function Overlays({ scenes }: { scenes: Scene[] }) {
  const f = useCurrentFrame()
  const s = scenes.find(x => f >= x.from && f < x.from + x.duration) ?? scenes[scenes.length - 1]
  const lf = f - s.from
  const fadeIn = ramp(lf, 4, 10, easeInOut)
  const fadeOut = 1 - ramp(lf, s.duration - 8, 8, easeInOut)
  return <>
    {s.chip && <PillarChip ring={s.chip.ring} text={s.chip.text} strong={s.chip.strong} theme={s.theme} opacity={Math.min(fadeIn, fadeOut)} />}
    {s.tag && <DataTag text={s.tag} theme={s.theme} opacity={Math.min(fadeIn, fadeOut)} />}
    <Subtitles items={s.subtitles} frame={lf} theme={s.theme} />
  </>
}

export function Trailer({ data }: { data: TrailerData }) {
  const f = useCurrentFrame()
  const scenes = data.scenes
  const end = data.durationInFrames
  // Dòng ghi công nhạc ở khung cuối; bản nháp hiện chỗ trống để soát bố cục.
  const credit = data.music.credit ?? (data.draft ? "Nhạc: (chờ chốt tên bài, tác giả, giấy phép)" : null)
  // Nhạc: hạ khoảng 13 dB dưới lời và tiếng trong app (khóa theo mốc), trả lại trong 0,4 s; tắt dần cùng hình ở cuối.
  const voiced = scenes.flatMap(s => [
    ...s.lines.map(l => [s.from + l.from, s.from + l.to] as const),
    ...s.sounds.filter(x => x.duck && x.frames).map(x => [s.from + x.from, s.from + x.from + (x.frames ?? 0)] as const),
  ])
  const musicFrom = data.music.from ?? 0
  const musicVolume = (local: number) => {
    const fr = local + musicFrom
    const base = data.music.volume ?? 0.8
    const duck = data.music.duck ?? 0.22
    let d = 0
    for (const [a, b] of voiced) {
      if (fr < a - 8 || fr > b + 12) continue
      d = Math.max(d, Math.min(interpolate(fr, [a - 8, a - 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        interpolate(fr, [b, b + 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })))
    }
    const fadeOut = interpolate(fr, [end - 40, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    const fadeIn = interpolate(local, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    return base * (1 - (1 - duck) * d) * fadeOut * fadeIn
  }
  return <AbsoluteFill style={{ background: night }}>
    <Backdrop scenes={scenes} />
    {scenes.map((s, i) => {
      const Comp = SCENES[s.id]
      if (!Comp) return null
      const tail = i >= scenes.length - 1 ? 0 : s.exit === "depth" ? TAIL : s.exit === "hold" ? HOLD : 0
      return <Sequence key={s.id} from={s.from} durationInFrames={s.duration + tail} name={`${s.id} ${s.title}`}>
        <Shell scene={s}><Comp scene={s} credit={credit} /></Shell>
        {s.sounds.map((snd, k) => <Sequence key={k} from={snd.from} durationInFrames={snd.frames ?? undefined} layout="none">
          <Html5Audio src={staticFile(snd.src)} volume={snd.volume ?? 1} trimBefore={snd.trimBefore} />
        </Sequence>)}
      </Sequence>
    })}
    <Overlays scenes={scenes} />
    {data.music.src && <Sequence from={musicFrom} layout="none"><Html5Audio src={staticFile(data.music.src)} volume={musicVolume} /></Sequence>}
    {/* 10 khung đầu mờ dần từ đen */}
    {f < 10 && <AbsoluteFill style={{ background: "#000", opacity: 1 - ramp(f, 0, 10, easeInOut) }} />}
    {/* Khung cuối là biểu tượng và dòng đội (sau đó chuyển sang slide), không tối đen. */}
  </AbsoluteFill>
}
