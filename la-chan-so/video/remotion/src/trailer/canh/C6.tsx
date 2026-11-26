import React from "react"
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion"
import type { SceneProps } from "../bo/types"
import { alpha, ds, FONT, layout, v3 } from "../bo/mau"
import { easeInOut, easeOut, mark, ramp, window } from "../bo/time"
import { Phone, ScreenContent, ScreenCrop } from "../bo/Phone"
import { Illustration, Pill, Title } from "../bo/Chu"
import { Thread } from "../bo/SoiNoi"
import { Rings } from "../bo/Vong"

// C6 · Trụ 4 · Cộng đồng, cao trào (khung nháp). Nhịp: tiêu đề trên tranh cong-dong · mười máy đã báo nối vào danh sách chung
// · máy nhận thật mới báo được · đội tình nguyện kiểm duyệt (đoạn quay web thật, đứng hình, phóng to) · báo nhầm được xem lại
// · mọi máy dùng chung danh sách (tranh, vòng thứ ba).
const RED_CARD = { x: 30, y: 815, w: 1020, h: 935 }
// Hai nút "Chặn số này" và "Báo cuộc vừa nhận" trên thẻ đỏ (px của ảnh 1080×2400): báo cáo gắn với chính cuộc gọi máy vừa nhận.
const REPORT_BTN = { x: 40, y: 1350, w: 1000, h: 380 }
const SCRIM = `linear-gradient(0deg, ${alpha(ds.navy, 0.78)} 0%, ${alpha(ds.navy, 0.35)} 38%, ${alpha(ds.navy, 0)} 60%)`

function MiniPhone({ x, y, on }: { x: number; y: number; on: number }) {
  return <div style={{ position: "absolute", left: x - 34, top: y - 64, width: 68, height: 128, borderRadius: 14, background: v3.frame,
    boxShadow: `0 10px 24px ${alpha(ds.ink, 0.25)}` }}>
    <div style={{ position: "absolute", left: 5, top: 5, right: 5, bottom: 5, borderRadius: 10, background: ds.surface2, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 5, right: 5, top: 30, height: 40, borderRadius: 7, background: ds.danger, opacity: on }} />
    </div>
  </div>
}

export function C6({ scene }: SceneProps) {
  const f = useCurrentFrame()
  const m = scene.marks, t = scene.text, c = scene.clips
  const end = scene.duration
  const red = mark(m, "red", 90), report = mark(m, "report", 260), review = mark(m, "review", 380), freeze = mark(m, "freeze", 420)
  const appeal = mark(m, "appeal", 500), list = mark(m, "list", 600)
  const art = scene.images?.["cong-dong"]
  const A = window(f, -1, red + 4, 1, 10), B = window(f, red, report + 4, 10, 10), Cc = window(f, report, review + 4, 10, 10)
  const D = window(f, review, appeal + 4, 10, 10), E = window(f, appeal, list + 4, 10, 10), F = window(f, list, end + 40, 12, 1)
  const center = { x: 960, y: 600 }
  const phones = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    return { x: center.x + Math.cos(a) * 660, y: center.y + Math.sin(a) * 270 }
  })
  // Đứng hình và phóng to bằng chứng trên màn đội duyệt (khoảng 2 s).
  const zoom = ramp(f, freeze, 16, easeInOut)
  return <AbsoluteFill>
    {A > 0 && <AbsoluteFill style={{ opacity: A }}>
      {art && <Illustration src={art} from={0} dur={red + 20} zoom={[1.04, 1.0]} origin="50% 30%" />}
      <AbsoluteFill style={{ background: SCRIM }} />
      <Title text={t.t1} at={mark(m, "title", 10)} theme="night" y={700} size={88} width={1300} accent={v3.gold} />
    </AbsoluteFill>}
    {B > 0 && <AbsoluteFill style={{ opacity: B }}>
      <Title text={t.t2} at={red + 4} theme="warm" x={960} align="center" width={1500} y={150} size={64} />
      {phones.map((p, i) => {
        const at = red + 10 + i * 5
        const draw = ramp(f, at, 14, easeOut)
        return <React.Fragment key={i}>
          <Thread from={[p.x, p.y]} to={[center.x, center.y]} bend={30} draw={draw} pulse={f >= at + 6 && f < at + 30 ? (f - at - 6) / 24 : null} color={ds.danger} width={3} opacity={0.8} />
          <MiniPhone x={p.x} y={p.y} on={ramp(f, at, 6)} />
        </React.Fragment>
      })}
      {c.a2 && <ScreenCrop clip={c.a2} f={f} rect={c.a2.focus?.["the-do"] ?? RED_CARD} x={center.x} y={center.y} width={420} at={red + 60} glow={ds.danger} />}
      <div style={{ position: "absolute", left: center.x - 190, top: center.y - 38, width: 380, textAlign: "center", fontFamily: FONT, fontSize: 40, fontWeight: 700,
        color: ds.brandInk, background: "#FFFFFF", padding: "12px 0", borderRadius: 999, boxShadow: `0 10px 30px ${alpha(ds.ink, 0.15)}`,
        opacity: ramp(f, red + 20, 10) * (1 - ramp(f, red + 56, 8)) }}>{t.list}</div>
    </AbsoluteFill>}
    {Cc > 0 && <AbsoluteFill style={{ opacity: Cc }}>
      <Pill x={layout.textLeft} y={176} tone="brand" size={30} opacity={ramp(f, report + 4, 10)}>Bước 1/3 · Báo</Pill>
      <Title text={t.t3} at={report + 4} theme="warm" y={250} />
      {c.a2 && <Phone clip={c.a2} f={f} x={layout.phoneX} y={layout.phoneY} h={layout.phoneH} enterAt={report} drift={ramp(f, report, review - report, (x: number) => x)} />}
      {c.a2 && <ScreenCrop clip={c.a2} f={f} rect={REPORT_BTN} x={500} y={620} width={720} at={report + 18} glow={ds.danger} radius={24} />}
    </AbsoluteFill>}
    {D > 0 && <AbsoluteFill style={{ opacity: D }}>
      <Pill x={layout.textLeft} y={176} tone="brand" size={30} opacity={ramp(f, review + 4, 10)}>Bước 2/3 · Duyệt</Pill>
      <Title text={t.t4} at={review + 4} theme="warm" y={250} width={560} size={72} />
      {c.w9 && <Browser clip={{ ...c.w9, trimBefore: c.w9.trimBefore + 10 }} f={f} zoom={zoom} />}
    </AbsoluteFill>}
    {E > 0 && <AbsoluteFill style={{ opacity: E }}>
      <Title text={t.t5} at={appeal + 4} theme="warm" x={960} align="center" width={1400} y={230} size={84} />
      <Level f={f} at={appeal + 30} />
    </AbsoluteFill>}
    {F > 0 && <AbsoluteFill style={{ opacity: F }}>
      {art && <Illustration src={art} from={list} dur={end - list} zoom={[1.0, 1.05]} origin="50% 25%" />}
      <AbsoluteFill style={{ background: SCRIM }} />
      <Rings cx={985} cy={235} radii={[150, 205, 260]} progress={[ramp(f, list + 6, 14), ramp(f, list + 14, 14), ramp(f, list + 22, 16)]} width={4} color="#FFFFFF" />
      <Pill x={layout.textLeft} y={646} tone="brand" size={30} opacity={ramp(f, list + 6, 10) * (1 - ramp(f, end - 4, 6))}>Bước 3/3 · Cảnh báo mọi máy</Pill>
      <Title text={t.t6} at={list + 6} out={end - 4} theme="night" y={720} size={84} width={1400} accent={v3.gold} />
    </AbsoluteFill>}
  </AbsoluteFill>
}

/** Cửa sổ trình duyệt chứa đoạn quay web (2880×1620, tỉ lệ 2 của 1440×810). */
function Browser({ clip, f, zoom }: { clip: NonNullable<SceneProps["scene"]["clips"][string]>; f: number; zoom: number }) {
  const W = 1120, H = W * clip.h / clip.w, BAR = 40
  const k = W / clip.w
  const z = 1 + 1.2 * zoom
  return <div style={{ position: "absolute", left: 720, top: 200, width: W, height: H + BAR, borderRadius: 18, overflow: "hidden", background: "#FFFFFF",
    boxShadow: `0 40px 90px ${alpha(ds.ink, 0.25)}, 0 0 0 1px ${alpha(ds.ink, 0.1)}` }}>
    <div style={{ height: BAR, background: ds.surface2, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderBottom: `1px solid ${ds.outline2}` }}>
      {[ds.dangerLine, ds.warnLine, ds.safeLine].map(cc => <div key={cc} style={{ width: 12, height: 12, borderRadius: 6, background: cc }} />)}
      <div style={{ marginLeft: 16, fontFamily: FONT, fontSize: 17, color: ds.ink2 }}>Trang đội tình nguyện</div>
    </div>
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `scale(${z})`, transformOrigin: `${W}px ${H}px` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: clip.w, height: clip.h, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          <ScreenContent clip={clip} f={f} />
        </div>
      </div>
    </div>
  </div>
}

/** Thanh mức: đỏ hạ xuống vàng "Đang xét báo nhầm". */
function Level({ f, at }: { f: number; at: number }) {
  const p = ramp(f, at, 24, easeInOut)
  const x = interpolate(p, [0, 1], [500, 300])
  const W = 1100, kx = W / 600
  return <div style={{ position: "absolute", left: 960 - W / 2, top: 520, width: W }}>
    <div style={{ position: "relative", height: 34, borderRadius: 17, background: `linear-gradient(90deg, ${ds.outline} 0%, ${ds.warn} 50%, ${ds.danger} 100%)` }}>
      <div style={{ position: "absolute", left: x * kx - 30, top: -13, width: 60, height: 60, borderRadius: 30, background: "#FFFFFF", border: `8px solid ${p < 0.5 ? ds.danger : ds.warn}`,
        boxShadow: `0 8px 22px ${alpha(ds.ink, 0.25)}` }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontFamily: FONT, fontSize: 28, fontWeight: 600, color: ds.ink2 }}>
      <span>An toàn</span><span>Nghi ngờ</span><span>Nguy hiểm</span>
    </div>
    <div style={{ marginTop: 40, position: "relative", height: 60, display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 480 }}>
        <Pill x={120} y={0} tone="danger" size={34} opacity={1 - p}>Nguy hiểm</Pill>
        <Pill x={20} y={0} tone="brand" size={34} opacity={p}>Đang xét báo nhầm</Pill>
      </div>
    </div>
  </div>
}
