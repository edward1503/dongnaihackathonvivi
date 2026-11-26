// Token màu của trailer. Mọi mã màu đều chép từ :root của W/ds.css và W/app/src/v3/theme.css,
// riêng nền đêm #0B1220 theo kế hoạch (mục 1.3). Không thêm màu ngoài hai tệp đó.

/** ds.css */
export const ds = {
  brand: "#1D4ED8", brandInk: "#1E3A8A", brandC: "#DBEAFE", brandLine: "#93C5FD",
  danger: "#DC2626", dangerInk: "#7F1D1D", dangerC: "#FEE2E2", dangerLine: "#FCA5A5",
  warn: "#D97706", warnInk: "#78350F", warnC: "#FEF3C7", warnLine: "#FCD34D",
  safe: "#16A34A", safeInk: "#14532D", safeC: "#DCFCE7", safeLine: "#86EFAC",
  ai: "#7C3AED", aiInk: "#4C1D95", aiC: "#EDE9FE", aiLine: "#C4B5FD",
  ink: "#0F172A", ink2: "#475569", ink3: "#94A3B8",
  outline: "#CBD5E1", outline2: "#E2E8F0",
  surface: "#FFFFFF", surface2: "#F1F5F9", bg: "#F4F6FB", navy: "#0F172A", navy2: "#1E293B",
}

/** app/src/v3/theme.css */
export const v3 = {
  pri: "#344D9C", priT: "#E9EDF8", gold: "#FFCE02", cream: "#FDF4E9", night: "#0E1526", frame: "#0B0F1A",
  dang: "#C62828", dangT: "#FDE7E7", ink: "#14213D", ink2: "#56607A",
}

export const night = "#0B1220"

/** "#RRGGBB" + độ đục 0..1 thành "#RRGGBBAA". */
export function alpha(hex: string, a: number) {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
  return hex + v.toString(16).padStart(2, "0")
}

export const FONT = "'Be Vietnam Pro', system-ui, sans-serif"

/** Lưới bố cục 16:9 (mục 1.2): lề an toàn 96 px, máy lệch phải, nửa trái cho chữ. */
export const layout = {
  W: 1920, H: 1080, margin: 96,
  phoneX: 1340, phoneY: 500, phoneH: 880,
  textLeft: 96, textWidth: 900,
  titleSize: 76, subSize: 34,
  subtitleBottom: 72,
}

export type Theme = "night" | "brand" | "light" | "warm"
export const isDark = (t: Theme) => t === "night" || t === "brand"

/** Màu chữ chính và phụ theo nền. */
export function inkFor(t: Theme) {
  return isDark(t)
    ? { text: "#FFFFFF", soft: ds.brandC, dim: ds.ink3, line: ds.brandLine }
    : { text: ds.ink, soft: ds.ink2, dim: ds.ink3, line: ds.brand }
}
