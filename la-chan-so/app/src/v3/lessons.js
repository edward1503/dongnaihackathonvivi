// Bài học 1 phút (B5, B6) và bài kiểm tra 5 câu (B7). Nội dung do đội viết, dữ liệu giả lập.
// Truyện tranh, gọi video với nhân vật AI là phần của Mảng 4 (prototype/hoc.html, video-call.html): có thì mở phần đó.

export const LESSONS = [
  {
    id: 'cong-an', scamType: 'gia_danh_cong_an', lesson: 'gia-danh-co-quan', icon: 'shieldok', title: 'Giả danh công an',
    sms: 'Tôi là cán bộ điều tra. Bà liên quan vụ án rửa tiền, phải chuyển tiền vào tài khoản tạm giữ trong 30 phút.',
    signs: [['users', 'Xưng công an, viện kiểm sát qua điện thoại'], ['cardi', 'Bắt chuyển vào "tài khoản tạm giữ"'], ['lock', 'Dặn giữ bí mật, cấm nói với con cháu']],
    todo: ['Cúp máy, không chuyển tiền', 'Gọi con cháu hoặc công an phường bằng số mình lưu', 'Báo số này cho Lá chắn'],
  },
  {
    id: 'viec-nhe', scamType: 'viec_nhe_luong_cao', lesson: 'viec-nhe-luong-cao', icon: 'cardi', title: 'Việc nhẹ lương cao',
    sms: 'Tuyển cộng tác viên chốt đơn. Bấm thích video, nhận 300.000đ/ngày! Nạp trước 200.000đ để kích hoạt.',
    signs: [['clock', 'Việc dễ, tiền cao bất thường'], ['cardi', 'Bắt nộp tiền trước'], ['tri', 'Giục đăng ký ngay hôm nay']],
    todo: ['Không nạp tiền để "kích hoạt"', 'Hỏi người lớn trước khi nhận việc online', 'Báo tài khoản đó cho Lá chắn'],
  },
  {
    id: 'nhan-qua', scamType: 'duong_dan_gia', lesson: null, icon: 'link', title: 'Đường dẫn nhận quà',
    sms: 'Chúc mừng! Bạn trúng quà tri ân khách hàng. Nhận ngay tại qua-tri-an-khach-hang.top trước 24h.',
    signs: [['link', 'Đường dẫn lạ, đuôi .top, .xyz'], ['sparkle', 'Trúng thưởng dù không tham gia'], ['clock', 'Giục bấm trong 24 giờ']],
    todo: ['Không bấm đường dẫn lạ', 'Dán đường dẫn vào Lá chắn để kiểm tra', 'Không nhập mật khẩu, mã OTP'],
  },
  {
    id: 'nguoi-than', scamType: 'nguoi_than_tai_nan', lesson: 'nguoi-than-gap-nan', icon: 'users', title: 'Người thân gặp nạn',
    sms: 'Cháu bà bị tai nạn đang cấp cứu, cần chuyển 20 triệu tiền viện phí gấp. Đừng gọi cho bố mẹ cháu kẻo hoảng.',
    signs: [['tri', 'Báo tin dữ để làm mình hoảng'], ['clock', 'Đòi chuyển tiền gấp'], ['phoneoff', 'Cản không cho gọi người nhà']],
    todo: ['Bình tĩnh, cúp máy', 'Gọi lại người thân bằng số đã lưu', 'Hỏi nhà trường, bệnh viện trước khi chuyển'],
  },
]

export const QUIZ = [
  { sms: 'Nộp 500.000đ, nhận ngay 650.000đ sau 5 phút.', options: ['Chuyển thử 500.000đ', 'Dừng lại và báo cáo', 'Mượn tiền nạp thêm'], right: 1,
    why: 'Lời hứa lãi nhanh là mồi nhử. Chuyển rồi sẽ mất tiền.' },
  { sms: 'Công an phường đây. Bà đọc mã OTP vừa nhận để xác minh tài khoản.', options: ['Đọc mã cho nhanh', 'Cúp máy, gọi con cháu', 'Gửi mã qua tin nhắn'], right: 1,
    why: 'Công an không bao giờ hỏi mã OTP qua điện thoại.' },
  { sms: 'Tài khoản của bạn sẽ bị khóa. Xác minh tại ngan-hang-xacminh.top', options: ['Bấm vào đường dẫn', 'Kiểm tra đường dẫn bằng Lá chắn', 'Nhập mật khẩu thử'], right: 1,
    why: 'Ngân hàng không gửi đường dẫn lạ. Đuôi .top là dấu hiệu trang giả.' },
  { sms: 'Mẹ ơi con đổi số, đang cần 5 triệu gấp, chuyển giúp con nhé.', options: ['Chuyển ngay cho con', 'Gọi số cũ của con để hỏi', 'Hỏi tên ngân hàng rồi chuyển'], right: 1,
    why: 'Kẻ gian hay giả người nhà đổi số. Gọi lại số cũ đã lưu để chắc chắn.' },
  { sms: 'Bạn trúng iPhone! Đóng 300.000đ phí vận chuyển để nhận quà.', options: ['Đóng phí để nhận quà', 'Bỏ qua và báo cáo', 'Chia sẻ cho bạn bè'], right: 1,
    why: 'Quà thật không bắt đóng phí trước.' },
]

export const COMICS = {
  elder: [
    ['gia-danh-co-quan', 'Bài 1', 'Cuộc gọi tự xưng cơ quan chức năng'],
    ['nguoi-than-gap-nan', 'Bài 3', 'Người thân gặp nạn, cần tiền gấp'],
  ],
  student: [
    ['viec-nhe-luong-cao', 'Bài 2', 'Việc nhẹ lương cao'],
    ['dau-tu-lai-cao', 'Bài 4', 'Đầu tư lãi cao, nhóm kín'],
  ],
}

export const PRACTICE_CALLS = {
  elder: [
    ['minh-1', 'Gọi anh Minh', 'Có người tự xưng là cán bộ'],
    ['minh-3', 'Gọi anh Minh', 'Hỏi lại chuyện bé Vy gặp nạn'],
  ],
  student: [
    ['lan-2', 'Gọi chị Lan', 'Khuyên chị trước khi nạp tiền nhận việc'],
    ['tu-9', 'Gọi chú Tư', 'Cùng chú xem lời mời đầu tư'],
  ],
}

export function openComic(slug) {
  if (window.LCSNative?.openStory) return window.LCSNative.openStory(slug)
  window.location.assign('/prototype/hoc.html' + (slug ? '?kieu=' + encodeURIComponent(slug) : ''))
}

export function openPracticeCall(scene) {
  if (window.LCSNative?.openCall) return window.LCSNative.openCall(scene)
  window.location.assign('/prototype/video-call.html?canh=' + encodeURIComponent(scene))
}

export async function openLesson(nav, scamType, lesson) {
  if (window.LCSNative?.openStory) return window.LCSNative.openStory(lesson || scamType || '')
  if (lesson) {
    try {
      if ((await fetch('/prototype/hoc.html', { method: 'HEAD' })).ok) return openComic(lesson)
    } catch { /* The short lessons are also available offline. */ }
  }
  const found = LESSONS.find((item) => item.scamType === scamType)
  nav(found ? `/bai-hoc/${found.id}` : '/bai-hoc')
}
