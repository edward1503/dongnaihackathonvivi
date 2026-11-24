from dsl import Video, tap, sim, persona, phone, look, hs, typ, inframe, wait, click, top, arrive
V = Video("thu", "Thử")
V.step("thu-1", "Thử", [
    ("Trang chủ.", [phone(hold=2)]),
    ("Cuộc gọi lạ.", [sim("Có cuộc gọi lạ", "A03a-do-chuong-nguy-hiem")]),
    ("Nghe.", [tap("Nghe", "A04a-hoi-nhanh")]),
    ("Có.", [tap("Có", "A04b-phan-tich-ghi-am"), look(hs("Gọi Minh ngay"), hold=2)]),
])
V.step("thu-2", "Vy", [
    ("Vy.", [persona("Vy", "A01b-trang-chu-day-du")]),
    ("Kiểm tra.", [tap("Kiểm tra trước khi chuyển tiền", "A06a-kiem-tra-so")]),
    ("Gõ.", [typ(inframe(".lcs-in, .lcs-ta"), "0912 345 678")]),
    ("Bấm.", [tap("Kiểm tra", "A07a-ket-qua-nguy-hiem")]),
])
V.step("thu-3", "Khoa", [
    ("Khoa.", [persona("Khoa", "W01-thong-ke")]),
    ("KD.", [tap("Kiểm duyệt", "W02-kiem-duyet")]),
])
V.write()
