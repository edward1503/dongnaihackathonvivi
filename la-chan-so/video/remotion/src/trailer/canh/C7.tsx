import React from "react"
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import type { SceneProps } from "../bo/types"
import { alpha, ds, FONT } from "../bo/mau"
import { easeInOut, easeOut, mark, ramp } from "../bo/time"
import { Illustration } from "../bo/Chu"
import { Rings } from "../bo/Vong"

// C7 · Kết: ba vòng vẽ theo ba nhịp (chính mình, người thân, cộng đồng) quanh ba cây; ba vòng chụm lại; câu tục ngữ trọn;
// biểu tượng, LÁ CHẮN SỐ, dòng đội, chỗ ghi công nhạc. Tranh nền: anh-ai/nui-khien.png (ba cây thành khiên).
const SHADOW = `0 2px 18px ${alpha(ds.navy, 0.55)}, 0 1px 3px ${alpha(ds.navy, 0.5)}`

export function C7({ scene, credit }: SceneProps & { credit?: string | null }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const m = scene.marks, t = scene.text
  const w = [mark(m, "w1", 10), mark(m, "w2", 30), mark(m, "w3", 50)]
  const converge = mark(m, "converge", 90), nameAt = mark(m, "name", 150)
  const art = scene.images?.["nui-khien"]
  const reveal = ramp(f, 0, 22, easeInOut)
  // Ba vòng quanh khiên trong tranh, mỗi vòng vẽ đúng nhịp một từ; tới câu "ba cây chụm lại" thì khép vào và tan.
  const chum = ramp(f, converge, 30, easeInOut)
  const ringP = w.map(a => ramp(f, a - 2, 16, easeOut))
  const radii = [250, 330, 410].map(r => r - chum * (r - 170))
  const wordsOut = ramp(f, converge - 4, 10, easeInOut)
  const sky = ramp(f, nameAt - 10, 20, easeInOut)
  // Cả cảnh (tranh, vòng, chữ) lộ ra theo vòng màu lan từ giữa, đè lên khung cuối của C6.
  return <AbsoluteFill style={{ clipPath: reveal < 1 ? `circle(${(reveal * 1250).toFixed(0)}px at 960px 600px)` : undefined }}>
    {art && <AbsoluteFill>
      <Illustration src={art} from={0} dur={scene.duration} zoom={[1.0, 1.05]} origin="50% 85%" />
      {/* Bầu trời tối nhẹ phía trên để chữ trắng rõ trên màn chiếu */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${alpha(ds.navy, 0.42 + 0.18 * sky)} 0%, ${alpha(ds.navy, 0.12)} 52%, ${alpha(ds.navy, 0)} 70%)` }} />
    </AbsoluteFill>}
    <Rings cx={952} cy={790} radii={radii} progress={ringP} opacity={(1 - chum) * reveal} width={4} />
    {/* Ba từ rơi theo ba nhịp */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 64, opacity: (1 - wordsOut) * Math.min(1, reveal * 1.5) }}>
      {[t.w1, t.w2, t.w3].map((word, i) => {
        const s = spring({ frame: f - w[i], fps, config: { damping: 13, stiffness: 150, mass: 0.7 } })
        return <div key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 84, color: "#FFFFFF", textShadow: SHADOW, whiteSpace: "nowrap",
          opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * -70}px)` }}>{word}</div>
      })}
    </div>
    {/* Câu tục ngữ trọn */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 96, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 64, lineHeight: 1.28,
      color: "#FFFFFF", textShadow: SHADOW }}>
      <div style={{ opacity: ramp(f, converge, 12, easeInOut) * (0.92), transform: `translateY(${(1 - ramp(f, converge, 14)) * 18}px)` }}>{t.proverb1}</div>
      <div style={{ opacity: ramp(f, converge + 10, 12, easeInOut), transform: `translateY(${(1 - ramp(f, converge + 10, 14)) * 18}px)`, color: v3gold() }}>{t.proverb2}</div>
    </div>
    <Brand f={f} at={nameAt} fps={fps} name={t.name} team={t.team} logo={scene.images?.logo ?? "trailer/anh/logo.png"} />
    {credit && <div style={{ position: "absolute", right: 96, bottom: 40, fontFamily: FONT, fontSize: 22, fontWeight: 500, color: alpha("#FFFFFF", 0.85),
      textShadow: SHADOW, opacity: ramp(f, nameAt + 20, 12) }}>{credit}</div>}
  </AbsoluteFill>
}

const v3gold = () => "#FFCE02"

function Brand({ f, at, fps, name, team, logo }: { f: number; at: number; fps: number; name: string; team: string; logo: string }) {
  const s = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 120, mass: 0.8 } })
  if (s <= 0.001) return null
  const TILE = 132
  return <div style={{ position: "absolute", left: 0, right: 0, top: 318, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 34, opacity: Math.min(1, s * 1.4), transform: `scale(${0.85 + 0.15 * s})` }}>
      <div style={{ position: "relative", width: TILE, height: TILE, borderRadius: TILE * 0.26, background: "#FFFFFF", overflow: "hidden",
        boxShadow: `0 20px 50px ${alpha(ds.navy, 0.45)}` }}>
        <Img src={staticFile(logo)} style={{ position: "absolute", left: -TILE * 0.21, top: -TILE * 0.2, width: TILE * 1.42, height: TILE * 1.42 }} />
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 124, letterSpacing: "0.03em", color: "#FFFFFF", lineHeight: 1.1, textShadow: SHADOW }}>{name}</div>
    </div>
    <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 40, color: "#FFFFFF", textShadow: SHADOW, opacity: ramp(f, at + 12, 12, easeInOut) }}>{team}</div>
  </div>
}
