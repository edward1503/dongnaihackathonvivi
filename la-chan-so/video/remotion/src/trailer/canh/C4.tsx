import React from "react"
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import type { SceneProps } from "../bo/types"
import { alpha, ds, FONT, layout } from "../bo/mau"
import { easeInOut, mark, ramp } from "../bo/time"
import { Phone } from "../bo/Phone"
import { Illustration, Title } from "../bo/Chu"

// C4 · Vòng 2 · Người thân (khung nháp): tranh nguoi-than, thông báo "Mẹ vừa gặp cuộc gọi đáng ngờ" rơi xuống;
// rồi máy bà mở app ngân hàng, màn DỪNG LẠI (đỏ lan một nhịp).
export function C4({ scene }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const m = scene.marks, t = scene.text, c = scene.clips
  const notify = mark(m, "notify", 60), stop = mark(m, "stop", 170), stopRed = mark(m, "stopRed", 250)
  const art = scene.images?.["nguoi-than"]
  const s = spring({ frame: f - notify, fps, config: { damping: 16, stiffness: 120, mass: 0.8 } })
  const dim = ramp(f, stop - 4, 14, easeInOut)
  const red = ramp(f, stopRed, 20, easeInOut)
  return <AbsoluteFill>
    {art && <Illustration src={art} from={0} dur={scene.duration} zoom={[1.0, 1.06]} origin="30% 55%" dim={0.82 * dim} />}
    {/* Thông báo trên máy Minh */}
    {s > 0.001 && <div style={{ position: "absolute", left: 980, top: 96, width: 844, opacity: Math.min(1, s * 1.4) * (1 - dim),
      transform: `translateY(${(1 - s) * -80}px)`, borderRadius: 30, background: alpha("#FFFFFF", 0.96), padding: "26px 30px",
      boxShadow: `0 30px 70px ${alpha(ds.navy, 0.35)}`, display: "flex", gap: 22, alignItems: "center", fontFamily: FONT }}>
      <div style={{ position: "relative", width: 84, height: 84, borderRadius: 22, background: ds.brandC, overflow: "hidden", flex: "none" }}>
        <Img src={staticFile(scene.images?.logo ?? "trailer/anh/logo.png")} style={{ position: "absolute", left: -18, top: -17, width: 120, height: 120 }} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 600, color: ds.ink2 }}>{t.notifyApp} · bây giờ</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: ds.ink, lineHeight: 1.15, marginTop: 4, whiteSpace: "nowrap" }}>{t.notify}</div>
      </div>
    </div>}
    {/* Màn DỪNG LẠI */}
    {f >= stop - 2 && <>
      {red > 0 && red < 1 && <div style={{ position: "absolute", left: layout.phoneX - 1400 * red, top: layout.phoneY - 1400 * red, width: 2800 * red, height: 2800 * red,
        borderRadius: "50%", background: alpha(ds.danger, 0.3 * (1 - red)) }} />}
      {c.a5 && <Phone clip={c.a5} f={f} x={layout.phoneX} y={layout.phoneY} h={layout.phoneH} enterAt={stop} drift={ramp(f, stop, scene.duration - stop, (x: number) => x)} />}
      <Title text={t.t2a ?? "Mở app ngân hàng?"} at={stop + 6} theme="night" y={300} />
      <Title text={t.t2b ?? "*DỪNG LẠI*"} at={stopRed - 12} theme="night" y={400} size={132} accent={ds.dangerLine} />
    </>}
  </AbsoluteFill>
}
