import React from "react"
import { AbsoluteFill, useCurrentFrame } from "remotion"
import type { SceneProps } from "../bo/types"
import { alpha, ds, layout } from "../bo/mau"
import { easeInOut, mark, ramp, window } from "../bo/time"
import { Phone, ScreenCrop } from "../bo/Phone"
import { Pill, Title } from "../bo/Chu"

// C2 · Trụ 1 · Cảnh báo (khung nháp). Ba nhịp: thẻ đỏ khi chuông đổ · hai máy so sánh (im lặng / thẻ đỏ) · tin nhắn, đường dẫn.
// Vùng thẻ đỏ (px của ảnh 1080×2400): khi có đoạn quay thật thì lấy focus["the-do"] trong tệp mốc.
const RED_CARD = { x: 30, y: 815, w: 1020, h: 935 }
const MESSAGE = { x: 40, y: 390, w: 1000, h: 650 }

export function C2({ scene }: SceneProps) {
  const f = useCurrentFrame()
  const m = scene.marks, t = scene.text, c = scene.clips
  const end = scene.duration
  const red = mark(m, "redCard", 24), compare = mark(m, "compare", 200), msg = mark(m, "message", 280)
  const a = window(f, -1, compare + 4, 1, 10), b = window(f, compare, msg + 4, 10, 10), cc = window(f, msg, end + 20, 10, 1)
  const spread = ramp(f, red, 20, easeInOut)
  const card = c.a2?.focus?.["the-do"] ?? RED_CARD
  return <AbsoluteFill>
    {/* Nhịp 1: thẻ đỏ hiện ngay khi chuông đổ */}
    {a > 0 && <AbsoluteFill style={{ opacity: a }}>
      {spread > 0 && spread < 1 && <div style={{ position: "absolute", left: layout.phoneX - 1400 * spread, top: layout.phoneY - 1400 * spread, width: 2800 * spread, height: 2800 * spread,
        borderRadius: "50%", background: alpha(ds.danger, 0.22 * (1 - spread)) }} />}
      {c.a2 && <Phone clip={f < red ? (c.a1 ?? c.a2) : c.a2} f={f} x={layout.phoneX} y={layout.phoneY} h={layout.phoneH} enterAt={0} ring={{ from: 0, to: red }} shake drift={ramp(f, 0, compare, (x: number) => x)} />}
      {/* Nhịp dừng: nền tối đi khi thẻ đỏ bay ra */}
      <AbsoluteFill style={{ background: alpha(ds.navy, 0.18 * window(f, red, red + 40, 6, 14)) }} />
      <Title text={t.t1} at={4} theme="light" y={170} />
      {c.a2 && <ScreenCrop clip={c.a2} f={f} rect={card} x={470} y={660} width={600} at={red + 4} glow={ds.danger} />}
    </AbsoluteFill>}
    {/* Nhịp 2: số lạ chưa ai báo thì im lặng */}
    {b > 0 && <AbsoluteFill style={{ opacity: b }}>
      <Title text={t.t2} at={compare + 4} theme="light" y={380} />
      {c.a1 && <Phone clip={c.a1} f={f} x={1080} y={540} h={760} enterAt={compare} enterFrom="none" />}
      {c.a2 && <Phone clip={c.a2} f={f} x={1560} y={540} h={760} enterAt={compare} enterFrom="none" />}
      <Pill x={926} y={88} size={34} tone="brand" opacity={ramp(f, compare + 8, 10)}>{t.silent}</Pill>
      <Pill x={1440} y={88} size={34} tone="danger" opacity={ramp(f, compare + 14, 10)}>{t.red}</Pill>
    </AbsoluteFill>}
    {/* Nhịp 3: tin nhắn và đường dẫn lạ */}
    {cc > 0 && <AbsoluteFill style={{ opacity: cc }}>
      <Title text={t.t3} at={msg + 4} theme="light" y={170} />
      {c.w2 && <Phone clip={c.w2} f={f} x={layout.phoneX} y={layout.phoneY} h={layout.phoneH} enterAt={msg} drift={ramp(f, msg, end - msg, (x: number) => x)} />}
      {c.w2 && <ScreenCrop clip={c.w2} f={f} rect={c.w2.focus?.["to-do"] ?? MESSAGE} x={480} y={620} width={640} at={msg + 14} glow={ds.danger} />}
    </AbsoluteFill>}
  </AbsoluteFill>
}
