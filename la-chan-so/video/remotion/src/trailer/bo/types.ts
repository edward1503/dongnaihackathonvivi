// Dạng dữ liệu của src/data/trailer.json (do T/cong-cu/dung-trailer.py ghi). Khung tính ở 30 khung/giây.
import type { Theme } from "./mau"

export type Rect = { x: number; y: number; w: number; h: number; fill?: string }

/** Một câu lời dẫn. from/to: khung trong cảnh. audio: tệp giọng tách theo câu (khi đã thu). */
export type Line = { id: string; text: string; from: number; to: number; audio?: string | null; subtitle?: boolean }

export type Subtitle = { text: string; from: number; to: number }

/** Ảnh tĩnh giữ chỗ hiện từ khung `at` của cảnh (hòa vào ảnh trước 8 khung). */
export type Still = { at: number; image: string; masks?: Rect[] }

/**
 * Một đoạn quay trong máy (hoặc ảnh giữ chỗ khi chưa quay).
 * - src: "trailer/quay/a2-cuoc-goi.mp4" (đã có) hoặc null.
 * - from: khung của cảnh ứng với khung `trimBefore` của đoạn quay.
 * - holds: các lần đứng hình (khung của cảnh, số khung đứng).
 * - marks: mốc của đoạn quay quy ra khung của cảnh. focus: vùng (px của video) để phóng to.
 * - masks: vùng che số (px của video), làm mờ.
 */
export type Clip = {
  id: string; src: string | null; w: number; h: number
  from: number; trimBefore: number; frames: number
  holds?: { at: number; len: number }[]
  stills?: Still[]
  marks?: Record<string, number>
  focus?: Record<string, Rect>
  masks?: Rect[]
  placeholder?: boolean
  /** Ánh xạ thời gian từng đoạn: [khung của cảnh, khung của đoạn quay], nội suy tuyến tính (đi nhanh, đứng, nhảy cảnh). */
  map?: [number, number][]
}

export type Sound = { src: string; from: number; volume?: number; trimBefore?: number; frames?: number; duck?: boolean }

export type Chip = { ring: 1 | 2 | 3; text: string; strong?: boolean }

/** Cách nền đổi khi vào cảnh: cắt thẳng, lau hình khiên, màu lan (vòng tròn), hòa. */
export type Backdrop = { theme: Theme; reveal: "cut" | "shield" | "spread" | "fade"; at: number; dur: number; cx?: number; cy?: number }

export type Scene = {
  id: string; title: string; theme: Theme
  from: number; duration: number
  enter: "fade" | "none" | "depth"; exit: "none" | "depth" | "hold"
  backdrop: Backdrop
  chip: Chip | null; tag: string | null; simTag?: { from: number; to: number } | null
  lines: Line[]; subtitles: Subtitle[]
  marks: Record<string, number>
  clips: Record<string, Clip>
  text: Record<string, string>
  images?: Record<string, string>
  waves?: Record<string, number[]>
  sounds: Sound[]
}

export type TrailerData = {
  version: number; fps: number; width: number; height: number
  durationInFrames: number; seconds: number
  timing: "estimate" | "voice"; beats: string | null; draft: boolean
  music: { src: string | null; credit: string | null; volume?: number; from?: number; duck?: number; bungAt?: number }
  scenes: Scene[]
}

export type SceneProps = { scene: Scene }
