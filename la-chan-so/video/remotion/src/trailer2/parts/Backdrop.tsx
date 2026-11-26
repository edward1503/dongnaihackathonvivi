import React from "react"
import { AbsoluteFill, useCurrentFrame } from "remotion"
import { alpha, ds } from "../../trailer/bo/mau"

/**
 * Nền sáng kiểu giới thiệu sản phẩm: trắng ngả xanh (ds.brandC → ds.bg → trắng), hai quầng xanh thương hiệu mềm
 * trôi rất chậm, lưới mảnh mờ dần ra rìa. Mã màu lấy từ ds.css.
 */
export function Backdrop() {
  const f = useCurrentFrame()
  const drift = (p: number, a: number) => Math.sin(f / p) * a
  return <AbsoluteFill style={{ overflow: "hidden", background: `linear-gradient(150deg, ${ds.brandC} 0%, ${ds.bg} 48%, #FFFFFF 100%)` }}>
    <div style={{ position: "absolute", width: 1500, height: 1500, borderRadius: "50%", left: 900 + drift(170, 60), top: -700 + drift(200, 40),
      background: `radial-gradient(circle, ${alpha(ds.brand, 0.2)} 0%, ${alpha(ds.brand, 0)} 62%)` }} />
    <div style={{ position: "absolute", width: 1300, height: 1300, borderRadius: "50%", left: -520 + drift(210, 50), top: 380 + drift(180, 40),
      background: `radial-gradient(circle, ${alpha(ds.brandLine, 0.4)} 0%, ${alpha(ds.brandLine, 0)} 64%)` }} />
    <AbsoluteFill style={{
      backgroundImage: `linear-gradient(${alpha(ds.brand, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(ds.brand, 0.06)} 1px, transparent 1px)`,
      backgroundSize: "72px 72px", backgroundPosition: `${(f * 0.25) % 72}px 0px`,
      maskImage: "radial-gradient(ellipse 70% 65% at 60% 45%, #000 25%, transparent 85%)",
      WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 60% 45%, #000 25%, transparent 85%)" }} />
  </AbsoluteFill>
}
