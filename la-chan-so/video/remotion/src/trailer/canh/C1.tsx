import React from "react"
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import type { SceneProps } from "../bo/types"
import { alpha, ds, FONT } from "../bo/mau"
import { easeInOut, mark, ramp } from "../bo/time"
import { Tree, Ground } from "../bo/Cay"
import { shieldPoints } from "../bo/Nui"
import { TREE } from "./C0"

// C1 · Tên: khiên vẽ quanh cây non, lau hình khiên từ đêm sang xanh thương hiệu, cây thu vào biểu tượng, tên bật từng chữ.
export const SHIELD = { cx: 960, cy: 440, size: 1150 }

export function C1({ scene }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const m = scene.marks, t = scene.text
  const wipe = mark(m, "wipe", 14), teamAt = mark(m, "team", 80)
  const nameAt = Math.max(mark(m, "name", 40), wipe + 22)
  const draw = ramp(f, 0, 14, easeInOut)
  // Cây và khiên thu nhỏ về chỗ biểu tượng.
  const settle = ramp(f, wipe + 10, 16, easeInOut)
  const tile = spring({ frame: f - (wipe + 14), fps, config: { damping: 15, stiffness: 120, mass: 0.8 } })
  const TILE = 220, tileY = 330
  const k = 1 - settle * (1 - TILE / 560)
  const dy = settle * (tileY - SHIELD.cy)
  const pts = shieldPoints(SHIELD.cx, SHIELD.cy, SHIELD.size)
  const d = "M" + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L") + " Z"
  const letters = Array.from(t.name ?? "LÁ CHẮN SỐ")
  return <AbsoluteFill>
    <AbsoluteFill style={{ transform: `translateY(${dy}px) scale(${k})`, transformOrigin: `${SHIELD.cx}px ${SHIELD.cy}px`, opacity: 1 - ramp(f, wipe + 18, 8) }}>
      <Ground x={TREE.x} y={TREE.base} w={760} opacity={1 - ramp(f, wipe, 10)} />
      <Tree x={TREE.x} base={TREE.base} h={TREE.h} seed={TREE.seed} grow={1} frame={f + 200} wind={0.2} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible",
        filter: `drop-shadow(0 0 8px ${alpha(ds.brandLine, 0.9)}) drop-shadow(0 0 26px ${alpha(ds.brand, 0.7)})` }}>
        <path d={d} fill="none" stroke={ds.brandC} strokeWidth={5} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      </svg>
    </AbsoluteFill>
    {/* Biểu tượng: khiên gạc nai trên ô trắng bo góc như biểu tượng ứng dụng */}
    {tile > 0.001 && <div style={{ position: "absolute", left: 960 - TILE / 2, top: tileY - TILE / 2, width: TILE, height: TILE, borderRadius: TILE * 0.26,
      background: "#FFFFFF", transform: `scale(${0.6 + 0.4 * tile})`, opacity: Math.min(1, tile * 1.4),
      boxShadow: `0 30px 70px ${alpha(ds.navy, 0.45)}, 0 0 0 6px ${alpha("#FFFFFF", 0.18)}` }}>
      <Img src={staticFile(scene.images?.logo ?? "trailer/anh/logo.png")} style={{ position: "absolute", left: -TILE * 0.21, top: -TILE * 0.2, width: TILE * 1.42, height: TILE * 1.42 }} />
    </div>}
    <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 136,
      letterSpacing: "0.04em", color: "#FFFFFF", lineHeight: 1.2 }}>
      {letters.map((ch, i) => {
        const s = spring({ frame: f - nameAt - i * 2, fps, config: { damping: 14, stiffness: 160, mass: 0.6 } })
        return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 40}px)` }}>{ch}</span>
      })}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 712, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 40, color: ds.brandC,
      opacity: ramp(f, teamAt, 12, easeInOut), transform: `translateY(${(1 - ramp(f, teamAt, 12)) * 14}px)` }}>{t.team}</div>
  </AbsoluteFill>
}
