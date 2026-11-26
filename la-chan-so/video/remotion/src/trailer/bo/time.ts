import { Easing, interpolate } from "remotion"

// Mọi chuyển động tính theo số khung (30 khung/giây), không dùng CSS animation.
export const FPS = 30
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1)
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1)
export const easeIn = Easing.bezier(0.55, 0, 0.75, 0.2)

/** Tiến độ 0..1 từ khung `start` trong `dur` khung. */
export function ramp(frame: number, start: number, dur: number, ease: (t: number) => number = easeOut) {
  if (dur <= 0) return frame >= start ? 1 : 0
  return interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })
}

/** Vào rồi ra: 0 → 1 trong `fadeIn` khung từ `start`, giữ, rồi 1 → 0 trong `fadeOut` khung trước `end`. */
export function window(frame: number, start: number, end: number, fadeIn = 8, fadeOut = 8) {
  if (frame < start || frame > end) return 0
  const a = ramp(frame, start, fadeIn, easeInOut)
  const b = 1 - ramp(frame, end - fadeOut, fadeOut, easeInOut)
  return Math.min(a, b)
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t))

/** Số ngẫu nhiên có hạt giống (mulberry32): cùng hạt giống cho cùng dãy số ở mọi khung. */
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Mốc của cảnh (khung tính từ đầu cảnh); thiếu mốc thì dùng giá trị dự phòng. */
export function mark(marks: Record<string, number> | undefined, key: string, fallback: number) {
  const v = marks?.[key]
  return typeof v === "number" ? v : fallback
}
