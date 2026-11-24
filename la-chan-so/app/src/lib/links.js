// Chỗ nối sang phần của mảng khác. Mỗi hàm thử đường thật trước, chưa có thì báo ngắn.

// Mảng 4 (Hoàng): thư viện truyện, mở đúng truyện theo kiểu lừa đảo vừa gặp.
// Android gán window.LCS_LEARN_URL hoặc window.LCSNative.openStory(scamType).
export function openLearn(scamType, toast) {
  if (window.LCSNative?.openStory) return window.LCSNative.openStory(scamType || '')
  if (window.LCS_LEARN_URL) {
    window.location.href = window.LCS_LEARN_URL + (scamType ? `?kieu=${encodeURIComponent(scamType)}` : '')
    return
  }
  toast?.(scamType ? 'Truyện 1 phút về chiêu này nằm ở phần Học (Mảng 4)' : 'Phần Học do Mảng 4 làm')
}

// Mảng 1 (Hoàng): thiết lập và quyền (A02).
export function openProfile(toast) {
  if (window.LCSNative?.openSettings) return window.LCSNative.openSettings()
  toast?.('Thiết lập và cấp quyền nằm ở phần Android (Mảng 1)')
}
