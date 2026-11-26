export const levels = {
  unknown: 'Chưa rõ', suspicious: 'Nghi ngờ', danger: 'Nguy hiểm', safe: 'An toàn',
}

export const reportStatuses = {
  pending_validation: 'Chờ xác nhận nội dung', validated: 'Đã xác nhận nội dung',
  unvalidated: 'Chờ đội xem bản ghi', conflict: 'Có ý kiến trái nhau',
  pending: 'Chờ xét', needs_review: 'Chờ đội xét', pending_review: 'Chờ đội xét',
  confirmed: 'Đội đã xác nhận', rejected: 'Đội đã bác', spam: 'Đã đánh dấu spam',
  closed: 'Đã đóng', withdrawn: 'Đã rút', removed: 'Đã gỡ',
}

export function voteCounts(votes) {
  if (typeof votes === 'number') return { confirm: votes, against: 0 }
  if (Array.isArray(votes)) {
    return {
      confirm: votes.filter((v) => v.decision === 'confirm').length,
      against: votes.filter((v) => ['reject', 'spam'].includes(v.decision)).length,
    }
  }
  return { confirm: votes?.confirm ?? 0, against: (votes?.reject ?? 0) + (votes?.spam ?? 0) }
}

export function voteProgress(votes) {
  const { confirm, against } = voteCounts(votes)
  return [`${confirm}/2 phiếu xác nhận`, against > 0 && `${against}/2 phiếu bác hoặc spam`].filter(Boolean).join(' · ')
}
