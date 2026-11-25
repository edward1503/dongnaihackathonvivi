// Icon nét lấy thẳng từ icons.js của bản thiết kế, để app và thiết kế luôn dùng chung một bộ.
import iconsSource from '../../../icons.js?raw'

const block = iconsSource.slice(iconsSource.indexOf('const ICONS'), iconsSource.indexOf('};') + 1)
const ICONS = {}
for (const m of block.matchAll(/'([\w-]+)':\s*'([^']*)'/g)) ICONS[m[1]] = m[2]

export default function Icon({ name, size, className = '', fill = false, weight = 2, style }) {
  const d = ICONS[name] || '<rect x="4" y="4" width="16" height="16"/>'
  const cls = ['ic', size ? `s${size}` : '', className].filter(Boolean).join(' ')
  const svg = `<svg viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
  return <i className={cls} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}

export const hasIcon = (name) => Boolean(ICONS[name])
