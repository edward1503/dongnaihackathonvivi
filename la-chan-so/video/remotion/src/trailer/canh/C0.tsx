import React from "react"
import { AbsoluteFill, useCurrentFrame } from "remotion"
import type { SceneProps } from "../bo/types"
import { alpha, ds } from "../bo/mau"
import { easeInOut, easeOut, mark, ramp } from "../bo/time"
import { Illustration, Title } from "../bo/Chu"
import { Ground, Tree } from "../bo/Cay"
import { SimTag } from "../bo/Nhan"
import { Waveform } from "../bo/SongAm"
import { FONT } from "../bo/mau"
import { window } from "../bo/time"

// C0 · Mở, "một cây": bà Hoa một mình trong đêm, điện thoại đổ chuông. Cuối cảnh chỉ còn một cây non và nửa câu tục ngữ.
export const TREE = { x: 960, base: 760, h: 430, seed: 3 }

/** Toạ độ điện thoại trong tranh mo-dau (1536×864) quy ra khung 1920×1080 sau khi đẩy vào (zoom quanh `origin`). */
function phoneInArt(z: number) {
  const ox = 1440, oy = 378
  const x = 1282, y = 586
  return { x: ox + (x - ox) * z, y: oy + (y - oy) * z }
}

export function C0({ scene }: SceneProps) {
  const f = useCurrentFrame()
  const m = scene.marks, t = scene.text
  const dur = scene.duration
  const title1 = mark(m, "title1", 18), title2 = mark(m, "title2", 120), proverb = mark(m, "proverb", 200)
  const ringFrom = mark(m, "ring", 12), ringTo = mark(m, "ringEnd", 150)
  const scam = mark(m, "scam", -1), scamEnd = mark(m, "scamEnd", -1)
  const q = scam >= 0 ? window(f, scam, title2 - 14, 8, 8) : 0
  const art = scene.images?.["mo-dau"]
  const zoom = 1 + 0.07 * ramp(f, 0, dur, (x: number) => x)
  // Nhịp cuối: tranh tối hẳn, chỉ còn cây và câu tục ngữ.
  const night = ramp(f, proverb - 6, 18, easeInOut)
  const grow = ramp(f, proverb, 34, easeOut)
  const ph = phoneInArt(zoom)
  return <AbsoluteFill>
    {art && <Illustration src={art} from={0} dur={dur} zoom={[1, 1.07]} origin="75% 35%" dim={0.15 + 0.8 * night} opacity={1 - 0.2 * night} />}
    {/* Bóng tối bên trái để chữ nổi */}
    <AbsoluteFill style={{ background: `linear-gradient(90deg, ${alpha("#05080F", 0.85)} 0%, ${alpha("#05080F", 0.35)} 45%, ${alpha("#05080F", 0)} 65%)`, opacity: 1 - night }} />
    {/* Sóng chuông quanh điện thoại trong tranh */}
    {Array.from({ length: 12 }, (_, i) => {
      const start = ringFrom + i * 21
      if (start > ringTo) return null
      const p = (f - start) / 45
      if (p < 0 || p > 1) return null
      const r = 40 + easeOut(p) * 190
      return <div key={i} style={{ position: "absolute", left: ph.x - r, top: ph.y - r, width: r * 2, height: r * 2, borderRadius: "50%",
        border: `3px solid ${alpha(ds.brandLine, 0.7 * (1 - p) * (1 - night))}` }} />
    })}
    <Title text={t.title1} at={title1} out={scam >= 0 ? scam - 4 : title2 - 8} theme="night" y={390} size={92} />
    {/* Giọng kẻ gian (mô phỏng, giọng AI đóng vai): câu nói, sóng âm theo biên độ thật của tệp tiếng */}
    {q > 0 && <div style={{ position: "absolute", left: 96, top: 300, width: 820, opacity: q }}>
      <SimTag text={t.simTag} />
      <div style={{ marginTop: 30, fontFamily: FONT, fontSize: 56, fontWeight: 700, lineHeight: 1.2, color: ds.dangerC, textWrap: "balance" as never }}>{t.scam}</div>
      <div style={{ marginTop: 34, opacity: 1 - ramp(f, scamEnd + 4, 10) }}><Waveform amps={scene.waves?.scam ?? []} frame={f - scam} color={ds.dangerLine} width={520} height={90} /></div>
    </div>}
    <Title text={t.title2} at={title2 - 8} out={proverb + 10} theme="night" y={390} size={92} accent={ds.brandLine} />
    {/* Một cây non giữa đêm */}
    {grow > 0 && <>
      <Ground x={TREE.x} y={TREE.base} w={760} progress={grow} />
      <Tree x={TREE.x} base={TREE.base} h={TREE.h} seed={TREE.seed} grow={grow} frame={f} wind={0.35} />
    </>}
    <Title text={t.proverb} at={proverb + 10} out={dur - 8} theme="night" x={960} align="center" width={1500} y={820} size={68} weight={600} color={ds.brandC} />
  </AbsoluteFill>
}
