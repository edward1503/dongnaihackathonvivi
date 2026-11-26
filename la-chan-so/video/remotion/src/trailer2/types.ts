// Dạng dữ liệu của src/data/trailer2.json (T/cong-cu/dung-trailer2.py ghi). Khung tính ở 30 khung/giây, trong từng phần.
import type { Clip, Rect, Sound, Subtitle, Line } from "../trailer/bo/types"

/** Thẻ màn app: vào hình ở khung `enter`; `side`: bay vào góc phải, không đẩy thẻ chính lùi. */
export type Card = Clip & { enter: number; kind: "phone" | "browser" | "bare"; side?: boolean }

/** Mảnh phóng to: cắt `rect` của thẻ `card` (-1: ảnh nguồn `source` của phần), bay tới (x, y). */
export type CalloutSpec = { card: number; rect: Rect; at: number; until?: number; x: number; y: number; maxW: number; maxH: number
  glow?: "danger" | "safe" | "brand"; pulse?: boolean }

export type Section = {
  id: string; kind: "intro" | "feature" | "outro"; from: number; duration: number
  chip: string | null; titles: { text: string; at: number }[]; accent: "danger" | "brand"; tag: string | null
  cards: Card[]; callouts: CalloutSpec[]; source?: Card
  ring?: { from: number; to: number; cx?: number; cy?: number }
  waveCard?: { at: number; until: number; x: number; y: number; amps: number[]; text: string; label?: string }
  /** Khung thẻ chính nảy nhẹ (đổi trạng thái màn: lên hạng, màn đỏ hiện). */
  bumps?: number[]
  notify?: { app: string; text: string; at: number; x: number; y: number }
  thread?: { at: number }
  zoom?: { from: number; to: number; scale: number }
  pill?: { text: string; at: number; x: number; y: number }
  minis?: { at: number; n: number }
  name?: string; closing?: string; closingAt?: number; team?: string; credit?: string[]; note?: string
  lines: Line[]; subtitles: Subtitle[]; sounds: Sound[]
}

export type Trailer2Data = {
  version: number; fps: number; width: number; height: number; durationInFrames: number; seconds: number; over: number
  logo: string | null
  music: { src: string | null; volume?: number; from?: number; duck?: number }
  presenter?: { poses: { at: number; pose: string }[]; amps: number[]; introEnd: number; outroFrom: number }
  sections: Section[]
}
