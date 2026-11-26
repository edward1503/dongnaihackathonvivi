import React from "react"
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion"
import type { SceneProps } from "../bo/types"
import { ds, FONT, layout } from "../bo/mau"
import { easeInOut, mark, ramp, window } from "../bo/time"
import { Phone, ScreenCrop } from "../bo/Phone"
import { Title } from "../bo/Chu"
import { Waveform } from "../bo/SongAm"

// C3 · Trụ 2 · Giọng nói (khung nháp): Bé Nai hỏi (sóng xanh theo tiếng thật benai-10), bà đáp "Có." (sóng cam), thẻ kết quả.
const RESULT = { x: 20, y: 540, w: 1040, h: 1000 }

export function C3({ scene }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const m = scene.marks, t = scene.text, c = scene.clips
  const ask = mark(m, "ask", 90), askEnd = mark(m, "askEnd", 186), yes = mark(m, "yes", 230), result = mark(m, "result", 260)
  const clip = c["a2-hoi"]
  const yesS = spring({ frame: f - yes, fps, config: { damping: 11, stiffness: 170, mass: 0.6 } })
  // Màn trong máy đổi sang kết quả (Nguy hiểm · Đã báo cho Minh) đúng lúc chữ "Có." bật lên.
  const q = window(f, ask, scene.duration + 30, 8, 1)
  return <AbsoluteFill>
    {clip && <Phone clip={clip} f={f} x={layout.phoneX} y={layout.phoneY} h={layout.phoneH} enterAt={0} drift={ramp(f, 0, scene.duration, (x: number) => x)} />}
    <Title text={t.t1} at={4} out={ask - 6} theme="light" y={300} />
    {q > 0 && <div style={{ position: "absolute", left: layout.textLeft, top: 230, width: 820, opacity: q }}>
      <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 700, color: ds.brand, marginBottom: 14 }}>Bé Nai</div>
      <div style={{ fontFamily: FONT, fontSize: 60, fontWeight: 700, color: ds.ink, lineHeight: 1.18, textWrap: "balance" as never }}>{t.question}</div>
      <div style={{ marginTop: 30 }}>
        <Waveform amps={scene.waves?.benai ?? []} frame={f - ask} color={ds.brand} width={560} height={96} />
      </div>
      {f >= yes - 2 && <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 34 }}>
        <div style={{ fontFamily: FONT, fontSize: 132, fontWeight: 800, color: ds.warn, transform: `scale(${0.6 + 0.4 * yesS})`, transformOrigin: "0 50%", opacity: Math.min(1, yesS * 1.5) }}>{t.answer}</div>
      </div>}
    </div>}
    {clip && <ScreenCrop clip={clip} f={f} rect={{ x: 10, y: 1250, w: 1040, h: 300 }} x={740} y={670} width={700} at={result + 6} glow={ds.safe} />}
  </AbsoluteFill>
}
