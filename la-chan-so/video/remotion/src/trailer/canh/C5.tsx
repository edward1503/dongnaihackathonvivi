import React from "react"
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import type { SceneProps } from "../bo/types"
import { alpha, ds, layout } from "../bo/mau"
import { mark, ramp, window } from "../bo/time"
import { Phone, ScreenCrop } from "../bo/Phone"
import { Pill, Title } from "../bo/Chu"

// C5 · Trụ 3 · Học tập (khung nháp): truyện có lối rẽ · gọi video nhập vai (đoạn quay thật) · thi đua, lớp lên hạng.
const RANK = { x: 24, y: 650, w: 738, h: 700 }

export function C5({ scene }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const m = scene.marks, t = scene.text, c = scene.clips
  const end = scene.duration
  const call = mark(m, "call", 120), rank = mark(m, "rank", 260), rankUp = mark(m, "rankUp", 300)
  const a = window(f, -1, call + 4, 1, 10), b = window(f, call, rank + 4, 10, 10), cc = window(f, rank, end + 20, 10, 1)
  const comics = ["comic-1", "comic-2", "comic-3"].map(k => scene.images?.[k]).filter(Boolean) as string[]
  return <AbsoluteFill>
    {a > 0 && <AbsoluteFill style={{ opacity: a }}>
      <Title text={t.t1} at={4} theme="light" y={150} />
      {comics.map((src, i) => {
        const s = spring({ frame: f - 8 - i * 6, fps, config: { damping: 16, stiffness: 110, mass: 0.8 } })
        const size = 330
        return <div key={i} style={{ position: "absolute", left: 96 + i * 230, top: 420 + (i % 2) * 40, width: size, height: size, borderRadius: 24, overflow: "hidden",
          transform: `translateY(${(1 - s) * 60}px) rotate(${(i - 1) * 5}deg)`, opacity: Math.min(1, s * 1.4),
          boxShadow: `0 24px 60px ${alpha(ds.ink, 0.22)}, 0 0 0 6px #FFFFFF` }}>
          <Img src={staticFile(src)} style={{ width: size, height: size }} />
        </div>
      })}
      {c.w5 && <Phone clip={c.w5} f={f} x={layout.phoneX} y={layout.phoneY} h={layout.phoneH} enterAt={0} />}
    </AbsoluteFill>}
    {b > 0 && <AbsoluteFill style={{ opacity: b }}>
      <Title text={t.t2} at={call + 4} theme="light" y={330} />
      <Pill x={layout.textLeft} y={520} size={34} tone="ai" opacity={ramp(f, call + 12, 10)}>{t.aiTag}</Pill>
      {c.w6 && <Phone clip={c.w6} f={f} x={layout.phoneX} y={layout.phoneY} h={layout.phoneH} enterAt={call} />}
    </AbsoluteFill>}
    {cc > 0 && <AbsoluteFill style={{ opacity: cc }}>
      <Title text={t.t3} at={rank + 4} theme="light" y={150} />
      {c.w11 && <Phone clip={c.w11} f={f} x={layout.phoneX} y={layout.phoneY} h={layout.phoneH} enterAt={rank} />}
      {c.w11 && <ScreenCrop clip={c.w11} f={f} rect={c.w11.focus?.["the-xep-hang"] ?? RANK} x={480} y={640} width={600} at={rank + 34} glow={ds.brand} />}
    </AbsoluteFill>}
  </AbsoluteFill>
}
