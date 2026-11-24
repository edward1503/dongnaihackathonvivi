// Dữ liệu giả lập chuẩn Phường Trấn Biên, TP. Đồng Nai (Tháng 11/2026)
// Tổng 64 phản ánh: Rác thải 21, Đèn đường 18, Ngập nước 15, Mặt đường 10; Đã xử lý 47; TB 3,2 ngày.

window.WARD_STATS = {
  wardName: "Phường Trấn Biên, TP. Đồng Nai",
  month: "Tháng 11/2026",
  total: 64,
  resolved: 47,
  avgDays: 3.2,
  byCategory: {
    rac_thai: { label: "Rác thải tự phát", icon: "🗑️", count: 21 },
    den_duong: { label: "Đèn đường hỏng", icon: "💡", count: 18 },
    ngap_nuoc: { label: "Ngập nước sau mưa", icon: "🌊", count: 15 },
    mat_duong: { label: "Hư hỏng mặt đường", icon: "🚧", count: 10 }
  }
};

window.PHOTO_SAMPLES = [
  {
    id: "pothole_clear",
    name: "📷 Ảnh mẫu 1: Ổ gà đọng nước đường Hưng Đạo Vương (Rõ nét)",
    category: "mat_duong",
    confidence: 92,
    evidence: ["Mặt nhựa nứt vỡ sâu", "Đọng nước sau mưa", "Sát làn xe máy"],
    suggestedDesc: "Ổ gà sâu khoảng 15cm đọng nước sau mưa trước số 142 Hưng Đạo Vương, nguy hiểm cho người đi xe máy ban đêm.",
    lat: 148, lng: 195,
    address: "142 Đường Hưng Đạo Vương, Khu phố 2, P. Trấn Biên",
    duplicateId: "TB-1162"
  },
  {
    id: "flood_night",
    name: "🌙 Ảnh mẫu 2: Ngập cống hẻm tối (Độ tin cậy TB 68% -> Chuyển Đoàn viên)",
    category: "ngap_nuoc",
    confidence: 68,
    altCategory: "rac_thai",
    evidence: ["Mặt nước dâng trên hẻm", "Ánh sáng yếu ban đêm", "Có rác trôi miệng cống"],
    suggestedDesc: "Nước mưa rút chậm gây ngập cục bộ trước hẻm 88 Hà Huy Tập, nghi do rác che miệng thoát nước.",
    lat: 230, lng: 120,
    address: "Hẻm 88 Hà Huy Tập, Khu phố 3, P. Trấn Biên",
    duplicateId: null
  },
  {
    id: "blurry_error",
    name: "❌ Ảnh mẫu 3: Ảnh chụp rung tay / quá tối (Độ tin cậy 38% -> Báo lỗi)",
    category: null,
    confidence: 38,
    evidence: ["Ảnh bị nhòe chuyển động", "Độ sáng < 15%, không rõ vật thể"],
    suggestedDesc: "",
    lat: 180, lng: 160,
    address: "Đường Nguyễn Ái Quốc, Khu phố 4, P. Trấn Biên",
    duplicateId: null
  },
  {
    id: "trash_new",
    name: "🗑️ Ảnh mẫu 4: Điểm rác tự phát vỉa hè Võ Thị Sáu (Sự cố mới 95%)",
    category: "rac_thai",
    confidence: 95,
    evidence: ["Bao tải rác sinh hoạt", "Chiếm lối đi bộ vỉa hè"],
    suggestedDesc: "Điểm tập kết rác tự phát tràn xuống lòng đường gần ngã tư Võ Thị Sáu, bốc mùi ảnh hưởng khu dân cư.",
    lat: 285, lng: 245,
    address: "85 Đường Võ Thị Sáu, Khu phố 5, P. Trấn Biên",
    duplicateId: null
  }
];

window.INITIAL_REPORTS = [
  {
    id: "TB-1162",
    category: "mat_duong",
    title: "Ổ gà lớn đọng nước trước 140–142 Hưng Đạo Vương",
    address: "140 Hưng Đạo Vương, KP.2, P. Trấn Biên",
    x: 190, y: 152,
    distance: "18m",
    aiConfidence: 92,
    aiEvidence: ["Mặt đường nứt vỡ", "Đọng nước mưa"],
    supporters: 3,
    volunteerVerified: true,
    volunteerNote: "Đoàn viên KP.2 xác nhận ổ gà rộng ~60cm ngay khúc cua đông học sinh THPT Trấn Biên đi qua.",
    status: "new", // new | verify | progress | done
    department: "",
    sla: "Chưa gán (Gợi ý: 48 giờ)",
    createdAt: "07:45 24/11/2026",
    mine: false,
    rating: 0,
    ratingTags: [],
    afterNote: ""
  },
  {
    id: "TB-1164",
    category: "ngap_nuoc",
    title: "Ngập nước miệng cống hẻm 88 Hà Huy Tập",
    address: "Hẻm 88 Hà Huy Tập, KP.3, P. Trấn Biên",
    x: 118, y: 228,
    distance: "150m",
    aiConfidence: 68,
    aiEvidence: ["Ảnh tối ban đêm", "Mặt đường ngập nước"],
    supporters: 1,
    volunteerVerified: false,
    volunteerNote: "",
    status: "verify",
    department: "Chờ Đoàn viên KP.3 xác minh",
    sla: "Chờ xác minh thực địa",
    createdAt: "08:20 24/11/2026",
    mine: false,
    rating: 0,
    ratingTags: [],
    afterNote: ""
  },
  {
    id: "TB-1158",
    category: "den_duong",
    title: "Đèn đường cao áp tắt tối đầu hẻm 45 Nguyễn Ái Quốc",
    address: "Hẻm 45 Nguyễn Ái Quốc, KP.4, P. Trấn Biên",
    x: 265, y: 112,
    distance: "240m",
    aiConfidence: 96,
    aiEvidence: ["Trụ đèn chiếu sáng tắt", "Hẻm dân sinh thiếu sáng"],
    supporters: 2,
    volunteerVerified: true,
    volunteerNote: "Bí thư Chi đoàn KP.4 xác nhận cháy bóng trụ Đ45-02, khu vực công nhân tan ca đêm.",
    status: "progress",
    department: "Đội Quản lý Điện chiếu sáng Đô thị",
    sla: "17:00 24/11/2026 (Còn 7 giờ)",
    createdAt: "08:15 23/11/2026",
    mine: true,
    rating: 0,
    ratingTags: [],
    afterNote: ""
  },
  {
    id: "TB-1149",
    category: "rac_thai",
    title: "Rác thải tự phát tràn vỉa hè Cách Mạng Tháng 8",
    address: "Ngã ba Cách Mạng Tháng 8, KP.1, P. Trấn Biên",
    x: 92, y: 110,
    distance: "310m",
    aiConfidence: 94,
    aiEvidence: ["Rác tồn đọng vỉa hè", "Gây cản trở người đi bộ"],
    supporters: 4,
    volunteerVerified: true,
    volunteerNote: "Đội TNTN đã phối hợp xác minh khối lượng khoảng 400kg.",
    status: "done",
    department: "Công ty CP Môi trường Đô thị Sonadezi",
    sla: "Hoàn thành trong 1,8 ngày",
    createdAt: "07:10 21/11/2026",
    completedAt: "06:45 23/11/2026",
    mine: true,
    rating: 5,
    ratingTags: ["⚡ Xử lý nhanh", "✨ Dọn rất sạch"],
    afterNote: "Tổ Môi trường số 2 đã thu gom sạch 450kg rác tồn đọng, xịt rửa vỉa hè và lắp bảng nhắc nhở giữ vệ sinh khu phố."
  },
  {
    id: "TB-1141",
    category: "den_duong",
    title: "Bóng đèn nhấp nháy trước cổng Tiểu học Trấn Biên",
    address: "Đường 30 Tháng 4, KP.2, P. Trấn Biên",
    x: 295, y: 245,
    distance: "410m",
    aiConfidence: 91,
    aiEvidence: ["Đèn chiếu sáng chập chờn"],
    supporters: 2,
    volunteerVerified: true,
    volunteerNote: "Đã kiểm tra thực tế.",
    status: "done",
    department: "Đội Quản lý Điện chiếu sáng Đô thị",
    sla: "Hoàn thành trong 2,4 ngày",
    createdAt: "18:30 19/11/2026",
    completedAt: "09:15 22/11/2026",
    mine: false,
    rating: 5,
    ratingTags: ["👍 Cán bộ nhiệt tình"],
    afterNote: "Đã thay mới bộ nguồn LED 150W và kiểm tra an toàn điện toàn tuyến."
  }
];

window.STREETS_TRAN_BIEN = [
  "Đường Hưng Đạo Vương (Khu phố 2)",
  "Đường Nguyễn Ái Quốc (Khu phố 4)",
  "Đường Cách Mạng Tháng 8 (Khu phố 1)",
  "Đường Hà Huy Tập (Khu phố 3)",
  "Đường Võ Thị Sáu (Khu phố 5)",
  "Đường 30 Tháng 4 (Khu phố 2)"
];
