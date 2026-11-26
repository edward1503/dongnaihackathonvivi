import React from "react"
import { AbsoluteFill, Html5Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion"
import { alpha, ds, FONT } from "../trailer/bo/mau"
import { easeInOut, ramp } from "../trailer/bo/time"
import type { Trailer2Data, Section } from "./types"
import { Backdrop } from "./parts/Backdrop"
import { Feature } from "./sections/Feature"
import { Intro, MARK, Outro } from "./sections/Brand"
import { Presenter } from "./parts/Presenter"

// Trailer giới thiệu sản phẩm (LCSTrailer2), theo T/KICH-BAN-2.md: nền sáng, thẻ màn app nổi 3D, mỗi tính năng một khoảnh khắc chính.
// Dữ liệu: src/data/trailer2.json (T/cong-cu/dung-trailer2.py).

function Overlays({ sections, logo }: { sections: Section[]; logo: string | null }) {
  const f = useCurrentFrame()
  const s = sections.find(x => f >= x.from && f < x.from + x.duration) ?? sections[sections.length - 1]
  const lf = f - s.from
  const tagO = s.tag ? Math.min(ramp(lf, 6, 12, easeInOut), 1 - ramp(lf, s.duration - 8, 8, easeInOut)) : 0
  const sub = s.subtitles.find(x => lf >= x.from && lf < x.to)
  const so = sub ? Math.min(ramp(lf, sub.from, 4), 1 - ramp(lf, sub.to - 4, 4)) : 0
  // Biểu tượng nhỏ góc trên trái: từ cuối khung mở tới đầu khung kết.
  const intro = sections[0], outro = sections[sections.length - 1]
  const markO = Math.min(ramp(f, intro.from + intro.duration - 2, 6, easeInOut), 1 - ramp(f, outro.from - 6, 14, easeInOut))
  return <>
    {markO > 0 && <div style={{ position: "absolute", left: MARK.x, top: MARK.y, display: "flex", alignItems: "center", gap: 16, opacity: markO }}>
      <div style={{ position: "relative", width: MARK.tile, height: MARK.tile, borderRadius: MARK.tile * 0.26, background: "#FFFFFF", overflow: "hidden",
        boxShadow: `0 8px 24px ${alpha(ds.brandInk, 0.2)}, 0 0 0 1px ${alpha(ds.brandInk, 0.06)}` }}>
        {logo && <Img src={staticFile(logo)} style={{ position: "absolute", left: -MARK.tile * 0.21, top: -MARK.tile * 0.2, width: MARK.tile * 1.42, height: MARK.tile * 1.42 }} />}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 800, color: ds.ink, letterSpacing: "-0.02em" }}>Lá chắn số</div>
    </div>}
    {tagO > 0 && <div style={{ position: "absolute", right: 96, bottom: 46, opacity: tagO, padding: "6px 16px", borderRadius: 10, fontFamily: FONT, fontSize: 24,
      fontWeight: 500, color: ds.ink2, background: alpha("#FFFFFF", 0.8), border: `1px solid ${ds.outline2}` }}>{s.tag}</div>}
    {sub && <div style={{ position: "absolute", left: 440, right: 440, bottom: 40, display: "flex", justifyContent: "center", zIndex: 60 }}>
      <div style={{ fontFamily: FONT, fontSize: 34, lineHeight: 1.3, fontWeight: 500, color: "#FFFFFF", textAlign: "center", padding: "6px 22px", borderRadius: 14,
        background: alpha(ds.navy, 0.78), opacity: so }}>{sub.text}</div>
    </div>}
  </>
}

export function Trailer2({ data }: { data: Trailer2Data }) {
  const f = useCurrentFrame()
  const end = data.durationInFrames
  const over = data.over ?? 18
  // Nhạc: hạ dưới lời và tiếng trong app (khóa theo mốc), trả lại trong 0,4 s; tắt dần 2 s cuối.
  const voiced = data.sections.flatMap(s => s.sounds.filter(x => x.duck && x.frames).map(x => [s.from + x.from, s.from + x.from + (x.frames ?? 0)] as const))
  const musicFrom = data.music.from ?? 0
  const musicVolume = (local: number) => {
    const fr = local + musicFrom
    let d = 0
    for (const [a, b] of voiced) {
      if (fr < a - 10 || fr > b + 12) continue
      d = Math.max(d, Math.min(interpolate(fr, [a - 10, a - 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        interpolate(fr, [b - 4, b + 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })))
    }
    const base = data.music.volume ?? 0.17, duck = data.music.duck ?? 0.35
    const fade = interpolate(fr, [end - 75, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    return base * (1 - (1 - duck) * d) * fade * interpolate(local, [0, 12], [0, 1], { extrapolateRight: "clamp" })
  }
  return <AbsoluteFill style={{ background: ds.bg }}>
    <Backdrop />
    {data.sections.map((s, i) => {
      const tail = i < data.sections.length - 1 ? over : 0
      return <Sequence key={s.id} from={s.from} durationInFrames={s.duration + tail} name={s.id}>
        {s.kind === "feature" ? <Feature s={s} over={over} logo={data.logo} /> : s.kind === "intro" ? <Intro s={s} logo={data.logo} /> : <Outro s={s} logo={data.logo} />}
        {s.sounds.map((snd, k) => <Sequence key={k} from={snd.from} durationInFrames={snd.frames ?? undefined} layout="none">
          <Html5Audio src={staticFile(snd.src)} volume={snd.volume ?? 1} trimBefore={snd.trimBefore} />
        </Sequence>)}
      </Sequence>
    })}
    {data.presenter && <Presenter data={data.presenter} />}
    <Overlays sections={data.sections} logo={data.logo} />
    {data.music.src && <Sequence from={musicFrom} layout="none"><Html5Audio src={staticFile(data.music.src)} volume={musicVolume} /></Sequence>}
    {f < 8 && <AbsoluteFill style={{ background: "#FFFFFF", opacity: 1 - ramp(f, 0, 8, easeInOut) }} />}
  </AbsoluteFill>
}
