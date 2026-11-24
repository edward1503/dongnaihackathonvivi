// Dữ liệu giả lập bám sát 100% số liệu gốc của Đề 2 (Phường Trấn Biên, Tháng 11/2026)
// Tổng 64 phản ánh: Rác thải 21, Đèn đường 18, Ngập nước 15, Mặt đường 10; Đã xử lý 47; Thời gian xử lý trung bình 3,2 ngày.
// Tuyệt đối không dùng % độ tin cậy AI tự báo, không bịa số liệu chưa đo lường, không dùng Emoji.

window.WARD_STATS = {
  wardName: "Phường Trấn Biên, TP. Đồng Nai",
  month: "Tháng 11/2026",
  total: 64,
  resolved: 47,
  avgDays: 3.2,
  byCategory: {
    rac_thai: { label: "Rác thải tự phát", iconName: "trash", count: 21 },
    den_duong: { label: "Đèn đường hỏng", iconName: "lamp", count: 18 },
    ngap_nuoc: { label: "Ngập nước sau mưa", iconName: "droplet", count: 15 },
    mat_duong: { label: "Hư hỏng mặt đường", iconName: "road", count: 10 }
  }
};

window.PHOTO_SAMPLES = [
  {
    id: "pothole_clear",
    name: "Ảnh mẫu 1: Ổ gà đọng nước đường Hưng Đạo Vương",
    category: "mat_duong",
    aiState: "clear", // clear | needs_verify | invalid_image
    evidence: ["Mặt nhựa nứt vỡ sâu", "Đọng nước sau mưa", "Sát làn xe máy"],
    suggestedDesc: "Ổ gà sâu đọng nước sau mưa trước số 142 Hưng Đạo Vương, gây nguy hiểm cho người đi xe máy.",
    lat: 165, lng: 196,
    address: "142 Đường Hưng Đạo Vương, Khu phố 2, P. Trấn Biên"
  },
  {
    id: "flood_night",
    name: "Ảnh mẫu 2: Ngập cống hẻm ban đêm (Chuyển Đoàn viên xác minh)",
    category: "ngap_nuoc",
    aiState: "needs_verify",
    evidence: ["Nước dâng trên mặt hẻm", "Ánh sáng yếu ban đêm", "Nghi rác che miệng cống"],
    suggestedDesc: "Nước mưa rút chậm gây ngập cục bộ trước hẻm 88 Hà Huy Tập, cần kiểm tra miệng thoát nước.",
    lat: 228, lng: 118,
    address: "Hẻm 88 Hà Huy Tập, Khu phố 3, P. Trấn Biên"
  },
  {
    id: "blurry_error",
    name: "Ảnh mẫu 3: Ảnh chụp rung nhòe / quá tối (Trạng thái lỗi)",
    category: null,
    aiState: "invalid_image",
    evidence: ["Ảnh bị nhòe chuyển động", "Thiếu sáng, không rõ vật thể"],
    suggestedDesc: "",
    lat: 180, lng: 160,
    address: "Đường Nguyễn Ái Quốc, Khu phố 4, P. Trấn Biên"
  },
  {
    id: "trash_new",
    name: "Ảnh mẫu 4: Điểm rác tự phát vỉa hè Võ Thị Sáu",
    category: "rac_thai",
    aiState: "clear",
    evidence: ["Bao tải rác sinh hoạt", "Chiếm lối đi bộ vỉa hè"],
    suggestedDesc: "Điểm tập kết rác tự phát tràn ra vỉa hè gần ngã tư Võ Thị Sáu, ảnh hưởng vệ sinh khu phố.",
    lat: 245, lng: 285,
    address: "85 Đường Võ Thị Sáu, Khu phố 5, P. Trấn Biên"
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
    aiState: "clear",
    aiEvidence: ["Mặt đường nứt vỡ", "Đọng nước mưa"],
    supporters: 3,
    volunteerVerified: true,
    volunteerNote: "Đoàn viên KP.2 xác nhận ổ gà rộng khoảng 60cm ngay khúc cua đông học sinh đi qua.",
    status: "new", // new | verify | progress | done
    department: "",
    sla: "Chờ giao bộ phận xử lý",
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
    aiState: "needs_verify",
    aiEvidence: ["Ảnh tối ban đêm", "Mặt đường đọng nước"],
    supporters: 1,
    volunteerVerified: false,
    volunteerNote: "",
    status: "verify",
    department: "Đội TNTN Khu phố 3",
    sla: "Chờ xác minh tại chỗ",
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
    aiState: "clear",
    aiEvidence: ["Trụ đèn chiếu sáng tắt", "Hẻm dân sinh thiếu sáng"],
    supporters: 2,
    volunteerVerified: true,
    volunteerNote: "Bí thư Chi đoàn KP.4 xác nhận cháy bóng trụ Đ45-02, khu vực công nhân tan ca đêm.",
    status: "progress",
    department: "Đội Quản lý Điện chiếu sáng Đô thị",
    sla: "Hạn xử lý: 17:00 24/11/2026",
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
    aiState: "clear",
    aiEvidence: ["Rác tồn đọng vỉa hè", "Cản trở lối đi bộ"],
    supporters: 4,
    volunteerVerified: true,
    volunteerNote: "Đội TNTN đã phối hợp xác minh hiện trạng tại ngã ba.",
    status: "done",
    department: "Công ty CP Môi trường Đô thị Sonadezi",
    sla: "Đã xử lý hoàn tất (23/11/2026)",
    createdAt: "07:10 21/11/2026",
    completedAt: "06:45 23/11/2026",
    mine: true,
    rating: 5,
    ratingTags: ["Xử lý đúng hạn", "Thu dọn sạch sẽ"],
    afterNote: "Tổ Môi trường số 2 đã thu gom sạch rác tồn đọng, xịt rửa vỉa hè và đặt biển nhắc nhở giữ vệ sinh khu phố."
  },
  {
    id: "TB-1141",
    category: "den_duong",
    title: "Bóng đèn nhấp nháy trước cổng Tiểu học Trấn Biên",
    address: "Đường 30 Tháng 4, KP.2, P. Trấn Biên",
    x: 295, y: 245,
    distance: "410m",
    aiState: "clear",
    aiEvidence: ["Đèn chiếu sáng chập chờn"],
    supporters: 2,
    volunteerVerified: true,
    volunteerNote: "Đã kiểm tra thực tế.",
    status: "done",
    department: "Đội Quản lý Điện chiếu sáng Đô thị",
    sla: "Đã xử lý hoàn tất (22/11/2026)",
    createdAt: "18:30 19/11/2026",
    completedAt: "09:15 22/11/2026",
    mine: false,
    rating: 4,
    ratingTags: ["Cán bộ nhiệt tình"],
    afterNote: "Đã thay mới bộ nguồn đèn LED 150W và kiểm tra an toàn điện trên tuyến."
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
