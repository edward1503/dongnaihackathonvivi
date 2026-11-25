// Nhãn, icon, màu dùng chung cho 4 mức và 4 loại đầu vào.

export const KIND = {
  phone: { label: 'Số điện thoại', icon: 'phone', noun: 'số này', tab: 'Số ĐT' },
  link: { label: 'Đường dẫn', icon: 'link', noun: 'đường dẫn này', tab: 'Đường dẫn' },
  account: { label: 'Số tài khoản', icon: 'card', noun: 'tài khoản này', tab: 'Tài khoản' },
  message: { label: 'Tin nhắn', icon: 'message', noun: 'tin này', tab: 'Tin nhắn' },
  call: { label: 'Cuộc gọi', icon: 'phone', noun: 'số này', tab: 'Số ĐT' },
}

export const LEVEL = {
  danger: { label: 'Nguy hiểm', chip: 'danger', icon: 'alert-oct', box: 'danger' },
  suspicious: { label: 'Nghi ngờ', chip: 'warn', icon: 'alert', box: 'warn' },
  safe: { label: 'An toàn', chip: 'safe', icon: 'check-circle', box: 'safe' },
  unknown: { label: 'Chưa có dữ liệu', chip: '', icon: 'help', box: '' },
}

export const SELF_CHECKS = [
  'Tôi biết người nhận ngoài đời thật',
  'Không ai giục tôi chuyển gấp',
  'Không ai bảo tôi giữ bí mật',
]

export function hhmm(d = new Date()) {
  return d.toTimeString().slice(0, 5)
}

export function whenLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const days = Math.round((new Date(today.toDateString()) - new Date(d.toDateString())) / 86400000)
  if (days <= 0) return `Hôm nay ${hhmm(d)}`
  if (days === 1) return 'Hôm qua'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function recentLabel(item) {
  return item.kind === 'account' ? `TK ${item.display}` : item.display
}
