// TrấnBiên Trực Tuyến – Mobile App PWA (Step-by-step 3-Screen Wizard, AI Override, Strict 4-Actor Handoff)
(function () {
  const ic = window.Icon;

  const state = {
    role: "citizen", // citizen | volunteer | officer
    seniorMode: false,
    seniorPage: "home", // home | create | mine
    citizenTab: "map", // map | create | mine
    createStep: 1, // 1: Ảnh | 2: Vị trí & Quét trùng | 3: Chọn loại & Gửi
    mapFilter: "all",
    selectedMapPinId: "TB-1162",

    // Create 3-step state
    selectedSampleId: "pothole_clear",
    customPhotoUrl: null,
    selectedCategory: "mat_duong",
    userOverrodeAi: false,
    customDesc: window.PHOTO_SAMPLES[0].suggestedDesc,
    pinX: 196,
    pinY: 165,
    liveGpsCoords: null,
    gpsErrorMode: false,
    manualStreet: window.STREETS_TRAN_BIEN[0],
    manualHouseNo: "Số 142 (gần cổng trường)",
    showDuplicateSheet: false,
    matchedDuplicate: null,

    // Modals
    detailModalId: null,
    reviewModalId: null,
    showDemoDrawer: false,
    sliderPos: 50,
    tempRating: 5,
    tempTags: ["Xử lý đúng hạn", "Thu dọn sạch sẽ"],

    // Officer & Field Execution state
    officerFilter: "all",
    officerModalId: null,
    assignCategory: "mat_duong",
    assignDept: "Ban Quản lý Duy tu Giao thông Đô thị",
    assignSla: "48 giờ (Hạn: 26/11/2026)",
    tempAfterPhotoUrl: null,
    afterResolutionNote: "Đơn vị thi công đã thảm nhựa nóng mặt đường phẳng đẹp, dọn vệ sinh hiện trường.",

    stats: JSON.parse(JSON.stringify(window.WARD_STATS)),
    reports: JSON.parse(JSON.stringify(window.INITIAL_REPORTS)),
    toastMsg: null
  };

  function showToast(msg) {
    state.toastMsg = msg;
    renderToast();
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      state.toastMsg = null;
      renderToast();
    }, 3300);
  }

  function renderToast() {
    const el = document.getElementById("toast-slot");
    if (el) {
      el.innerHTML = state.toastMsg
        ? `<div class="toast">${ic("check", 15, "margin-right:6px;color:#4ade80;")} ${state.toastMsg}</div>`
        : "";
    }
  }

  function renderScenePhoto(type, isAfter, customUrl) {
    if (customUrl) {
      return `
        <div style="position:relative;width:100%;height:100%;overflow:hidden;background:#0f172a;">
          <img src="${customUrl}" alt="Ảnh tải lên" style="width:100%;height:100%;object-fit:cover;display:block;" />
          <div style="position:absolute;bottom:8px;left:8px;background:${isAfter ? "rgba(21,128,61,0.9)" : "rgba(30,58,138,0.88)"};color:#fff;font-size:10.5px;font-weight:600;padding:4px 8px;border-radius:6px;">
            ${isAfter ? "Ảnh nghiệm thu thực tế tải lên" : "Ảnh hiện trường người dân tải lên"}
          </div>
        </div>
      `;
    }

    let imgSrc = "./assets/pothole_before.jpg";
    let badgeText = "AI gợi ý: Hư hỏng mặt đường";
    let badgeBg = "rgba(30,58,138,0.9)";
    let showBox = !isAfter;
    let boxColor = "#ef4444";

    if (type === "blurry_error" || type === "invalid_image") {
      imgSrc = "./assets/blurry_error.jpg";
      badgeText = "Ảnh mờ / thiếu sáng – Chưa rõ sự cố";
      badgeBg = "rgba(185,28,28,0.92)";
      showBox = false;
    } else if (type === "rac_thai") {
      imgSrc = isAfter ? "./assets/trash_after.jpg" : "./assets/trash_before.jpg";
      badgeText = isAfter ? "Ảnh sau xử lý: Đã thu dọn sạch" : "AI gợi ý: Rác thải tự phát";
      badgeBg = isAfter ? "rgba(21,128,61,0.9)" : "rgba(30,58,138,0.88)";
    } else if (type === "den_duong") {
      imgSrc = isAfter ? "./assets/streetlight_after.jpg" : "./assets/streetlight_before.jpg";
      badgeText = isAfter ? "Ảnh sau xử lý: Đèn chiếu sáng hoạt động" : "AI gợi ý: Đèn đường hỏng";
      badgeBg = isAfter ? "rgba(21,128,61,0.9)" : "rgba(30,58,138,0.88)";
      boxColor = "#facc15";
    } else if (type === "ngap_nuoc" || type === "flood_night") {
      imgSrc = isAfter ? "./assets/flood_after.jpg" : "./assets/flood_before.jpg";
      badgeText = isAfter ? "Ảnh sau xử lý: Mặt đường khô ráo" : "AI gợi ý: Ngập nước (Cần xác minh)";
      badgeBg = isAfter ? "rgba(21,128,61,0.9)" : "rgba(180,83,9,0.92)";
      boxColor = "#facc15";
    } else {
      imgSrc = isAfter ? "./assets/pothole_after.jpg" : "./assets/pothole_before.jpg";
      badgeText = isAfter ? "Ảnh sau xử lý: Đã thảm nhựa phẳng" : "AI gợi ý: Hư hỏng mặt đường";
      badgeBg = isAfter ? "rgba(21,128,61,0.9)" : "rgba(30,58,138,0.88)";
    }

    return `
      <div style="position:relative;width:100%;height:100%;overflow:hidden;background:#0f172a;">
        <img src="${imgSrc}" alt="${badgeText}" style="width:100%;height:100%;object-fit:cover;display:block;" />
        ${showBox ? `<div style="position:absolute;left:22%;top:26%;width:56%;height:54%;border:2px dashed ${boxColor};border-radius:8px;pointer-events:none;"></div>` : ""}
        <div style="position:absolute;bottom:8px;left:8px;background:${badgeBg};color:#fff;font-size:10.5px;font-weight:600;padding:4px 8px;border-radius:6px;">
          ${badgeText}
        </div>
      </div>
    `;
  }

  function statusBadgeHTML(st) {
    if (st === "new") return `<span class="status-tag st-new"><span class="dot dot-red"></span>Mới tiếp nhận</span>`;
    if (st === "verify") return `<span class="status-tag st-verify"><span class="dot dot-amber"></span>Chờ xác minh</span>`;
    if (st === "progress") return `<span class="status-tag st-progress">${ic("clock", 12)} Đang xử lý</span>`;
    if (st === "closed") return `<span class="status-tag st-closed">Đã đóng sau xác minh</span>`;
    return `<span class="status-tag st-done">${ic("check", 12)} Đã xử lý</span>`;
  }

  function catLabel(cat, withIcon) {
    const info = state.stats.byCategory[cat];
    if (!info) return "Chưa xác định";
    return withIcon ? `${ic(info.iconName, 14, "margin-right:4px;")} ${info.label}` : info.label;
  }

  function findNearbyDuplicate(targetCat) {
    if (state.gpsErrorMode) return null;
    const catToMatch = targetCat || state.selectedCategory;
    let best = null;
    state.reports.forEach(r => {
      if (r.status === "done" || r.status === "closed") return;
      if (r.category !== catToMatch) return;
      const distMeters = Math.max(5, Math.round(Math.hypot(r.x - state.pinX, r.y - state.pinY) * 1.15));
      if (distMeters <= 50 && (!best || distMeters < best.distMeters)) {
        best = { report: r, distMeters };
      }
    });
    return best;
  }

  function renderRoleStrip() {
    return `
      <div class="role-strip">
        <button class="role-tab ${state.role === "citizen" ? "active" : ""}" onclick="App.setRole('citizen')">${ic("user", 14, "margin-right:4px;")}Người dân</button>
        <button class="role-tab ${state.role === "volunteer" ? "active" : ""}" onclick="App.setRole('volunteer')">${ic("users", 14, "margin-right:4px;")}Đoàn viên</button>
        <button class="role-tab ${state.role === "officer" ? "active" : ""}" onclick="App.setRole('officer')">${ic("building", 14, "margin-right:4px;")}Phường &amp; ĐV</button>
        <button class="demo-trigger" title="Tình huống kiểm thử" onclick="App.toggleDemoDrawer(true)">${ic("sliders", 15)}</button>
      </div>
    `;
  }

  function renderDemoDrawer() {
    if (!state.showDemoDrawer) return "";
    return `
      <div class="sheet-backdrop" onclick="App.toggleDemoDrawer(false)">
        <div class="sheet-card" onclick="event.stopPropagation()">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <strong style="font-size:14.5px;">Chuyển nhanh tình huống kiểm thử</strong>
            <button style="border:none;background:#f1f5f9;width:30px;height:30px;border-radius:99px;cursor:pointer;" onclick="App.toggleDemoDrawer(false)">${ic("close", 15)}</button>
          </div>
          <div style="display:grid;gap:7px;">
            <button class="btn-outline" style="text-align:left;" onclick="App.runScenario('standard')">1. Gửi 3 bước tuần tự (AI gợi ý + Gộp trùng 50m)</button>
            <button class="btn-outline" style="text-align:left;" onclick="App.runScenario('override_ai')">2. Người dân không đồng ý &amp; chọn khác gợi ý AI</button>
            <button class="btn-outline" style="text-align:left;" onclick="App.runScenario('medium_ai')">3. Ảnh chụp tối &rarr; Chuyển Đoàn viên xác minh</button>
            <button class="btn-outline" style="text-align:left;" onclick="App.runScenario('senior')">4. Chế độ Chữ lớn cho Người cao tuổi</button>
            <button class="btn-outline" style="text-align:left;" onclick="App.runScenario('error_blur')">5. Trạng thái Lỗi: Ảnh bị rung nhòe</button>
            <button class="btn-outline" style="text-align:left;" onclick="App.runScenario('error_gps')">6. Trạng thái Lỗi: Mất định vị GPS</button>
            <button class="btn-outline" style="text-align:left;" onclick="App.runScenario('empty')">7. Trạng thái Trống (Khu phố 6 không có sự cố)</button>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== ROLE 1: CITIZEN (SENIOR MODE WIZARD) ====================
  function renderSeniorHome() {
    const doneMine = state.reports.filter(r => r.mine && r.status === "done").length;
    return `
      <div class="section-pad">
        <div style="background:#fef9c3;border:2px solid #ca8a04;border-radius:14px;padding:12px;margin-bottom:14px;font-size:16.5px;font-weight:700;color:#713f12;line-height:1.4;">
          Xin chào Bác! Đây là giao diện <u>Chữ Lớn dễ đọc</u>. Bác chạm vào 1 trong 3 mục dưới đây:
        </div>
        <button class="senior-btn" style="background:#fef2f2;color:#991b1b;border-color:#dc2626;" onclick="App.seniorGoCreate()">
          1. CHỤP ẢNH BÁO SỰ CỐ
          <small>Hướng dẫn từng bước một, chữ lớn dễ nhìn</small>
        </button>
        <button class="senior-btn" style="background:#eff6ff;color:#1e3a8a;border-color:#1d4ed8;" onclick="App.seniorGoMine()">
          2. XEM VIỆC BÁC ĐÃ BÁO
          <small>Hiện có ${doneMine} phản ánh Phường đã xử lý xong</small>
        </button>
        <button class="senior-btn" style="background:#f0fdf4;color:#14532d;border-color:#16a34a;" onclick="App.callVolunteerSupport()">
          3. NHỜ ĐOÀN VIÊN HỖ TRỢ
          <small>Nhắn Đội Thanh niên Tình nguyện Khu phố 2 đến báo giúp</small>
        </button>
      </div>
    `;
  }

  // Senior Mode Step-by-Step (Mỗi màn hình đúng 1 việc duy nhất, không cuộn dài)
  function renderSeniorCreate() {
    const sample = window.PHOTO_SAMPLES.find(s => s.id === state.selectedSampleId) || window.PHOTO_SAMPLES[0];
    const activeSample = sample.aiState !== "invalid_image" ? sample : window.PHOTO_SAMPLES[0];
    const categories = ["mat_duong", "den_duong", "ngap_nuoc", "rac_thai"];

    if (state.createStep === 1) {
      return `
        <div class="section-pad">
          <div style="font-size:15px;font-weight:700;color:#1d4ed8;margin-bottom:8px;">BƯỚC 1 / 3 • CHỤP ẢNH SỰ CỐ</div>
          <div style="border:2px solid #94a3b8;border-radius:16px;padding:12px;background:#fff;">
            <div style="height:185px;border-radius:12px;overflow:hidden;border:2px solid #cbd5e1;margin-bottom:12px;">
              ${renderScenePhoto(activeSample.category, false, state.customPhotoUrl)}
            </div>
            <label style="display:block;text-align:center;background:#eff6ff;border:2px solid #1d4ed8;color:#1e3a8a;padding:12px;border-radius:12px;font-size:17px;font-weight:700;cursor:pointer;margin-bottom:12px;">
              ${ic("camera", 19, "margin-right:6px;")} Mở Máy Ảnh Chụp Mới
              <input type="file" accept="image/*" capture="environment" style="display:none" onchange="App.handleFileUpload(event)"/>
            </label>
            <button class="btn-primary" style="font-size:19px;padding:15px;border-radius:14px;" onclick="App.setCreateStep(2)">
              Tiếp tục sang Bước 2 &rarr;
            </button>
          </div>
        </div>
      `;
    }

    if (state.createStep === 2) {
      const nearDup = findNearbyDuplicate(activeSample.category);
      return `
        <div class="section-pad">
          <div style="font-size:15px;font-weight:700;color:#1d4ed8;margin-bottom:8px;">BƯỚC 2 / 3 • KIỂM TRA VỊ TRÍ</div>
          <div style="border:2px solid #94a3b8;border-radius:16px;padding:14px;background:#fff;">
            <div style="font-size:18px;font-weight:700;margin-bottom:6px;">Vị trí ghi nhận tự động:</div>
            <div style="font-size:17px;color:#1e3a8a;font-weight:700;background:#eff6ff;padding:10px;border-radius:10px;margin-bottom:12px;">
              ${ic("pin", 18, "margin-right:4px;")} ${state.liveGpsCoords ? `Tọa độ GPS: ${state.liveGpsCoords}` : activeSample.address}
            </div>
            ${
              nearDup
                ? `<div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:12px;padding:12px;margin-bottom:12px;">
                    <div style="font-weight:700;color:#92400e;font-size:17px;">Đã có ${nearDup.report.supporters} hàng xóm báo sự cố này cách ${nearDup.distMeters}m!</div>
                    <button class="btn-primary" style="margin-top:10px;font-size:17px;padding:13px;" onclick="App.mergeIntoExisting('${nearDup.report.id}')">
                      ${ic("thumbsUp", 17, "margin-right:5px;")} Gộp chung vào đơn có sẵn
                    </button>
                  </div>`
                : ""
            }
            <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:8px;">
              <button class="btn-outline" style="font-size:16px;font-weight:700;border-width:2px;" onclick="App.setCreateStep(1)">&larr; Bước 1</button>
              <button class="btn-primary" style="font-size:17px;" onclick="App.setCreateStep(3)">Tiếp tục Bước 3 &rarr;</button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="section-pad">
        <div style="font-size:15px;font-weight:700;color:#1d4ed8;margin-bottom:8px;">BƯỚC 3 / 3 • CHỌN LOẠI &amp; GỬI</div>
        <div style="border:2px solid #94a3b8;border-radius:16px;padding:12px;background:#fff;">
          <div style="font-size:16px;color:#14532d;background:#f0fdf4;border:1px solid #86efac;padding:8px 10px;border-radius:10px;margin-bottom:10px;font-weight:700;">
            ${state.userOverrodeAi ? `Đã chọn theo ý Bác: ${catLabel(state.selectedCategory)}` : `AI gợi ý sẵn: ${catLabel(state.selectedCategory)} (Chạm nếu Bác muốn đổi)`}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
            ${categories.map(cat => {
              const info = state.stats.byCategory[cat];
              const isSelected = state.selectedCategory === cat;
              return `
                <button onclick="App.selectCategory('${cat}')" style="padding:12px 10px;border-radius:12px;text-align:left;cursor:pointer;font-size:16px;font-weight:700;border:${isSelected ? "3px solid #1d4ed8" : "2px solid #cbd5e1"};background:${isSelected ? "#eff6ff" : "#fff"};color:${isSelected ? "#1e3a8a" : "#0f172a"};">
                  <div style="margin-bottom:6px;color:#1d4ed8;">${ic(info.iconName, 22)}</div>
                  <div>${info.label}</div>
                </button>
              `;
            }).join("")}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:8px;">
            <button class="btn-outline" style="font-size:16px;font-weight:700;border-width:2px;" onclick="App.setCreateStep(2)">&larr; Bước 2</button>
            <button class="btn-primary" style="font-size:18px;padding:15px;background:#dc2626;" onclick="App.submitReportStep()">
              ${ic("send", 17, "margin-right:5px;")} GỬI PHƯỜNG
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== ROLE 1: CITIZEN (STANDARD MODE) ====================
  function renderCitizenMap() {
    const s = state.stats;
    const visibleReports = state.reports.filter(r => r.status !== "closed");
    const filtered = state.mapFilter === "empty_kp6"
      ? []
      : visibleReports.filter(r => state.mapFilter === "all" || r.category === state.mapFilter);
    const selected = filtered.find(r => r.id === state.selectedMapPinId) || filtered[0] || null;

    const pinsSVG = filtered.map(r => {
      const fill = r.status === "done" ? "#16a34a" : (r.status === "new" ? "#dc2626" : "#d97706");
      const isSel = selected && selected.id === r.id;
      return `
        <g class="pin-btn" onclick="App.selectPin('${r.id}')" transform="translate(${r.x}, ${r.y})">
          ${isSel ? `<circle cx="0" cy="0" r="20" fill="${fill}" opacity="0.25"/>` : ""}
          <circle cx="0" cy="0" r="${isSel ? 13 : 10}" fill="${fill}" stroke="#ffffff" stroke-width="2.5"/>
          <text x="0" y="4" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">${r.supporters > 1 ? r.supporters : ""}</text>
        </g>
      `;
    }).join("");

    return `
      <div class="kpi-strip">
        <span class="kpi-pill">P. Trấn Biên: <strong>${s.total} phản ánh</strong></span>
        <span class="kpi-pill">Đã xử lý: <strong style="color:#16a34a">${s.resolved}/${s.total}</strong></span>
        <span class="kpi-pill">TB: <strong>${s.avgDays} ngày</strong></span>
      </div>

      <div class="chip-scroll">
        <button class="chip ${state.mapFilter === "all" ? "active" : ""}" onclick="App.setMapFilter('all')">Tất cả (${s.total})</button>
        <button class="chip ${state.mapFilter === "rac_thai" ? "active" : ""}" onclick="App.setMapFilter('rac_thai')">Rác thải (${s.byCategory.rac_thai.count})</button>
        <button class="chip ${state.mapFilter === "den_duong" ? "active" : ""}" onclick="App.setMapFilter('den_duong')">Đèn đường (${s.byCategory.den_duong.count})</button>
        <button class="chip ${state.mapFilter === "ngap_nuoc" ? "active" : ""}" onclick="App.setMapFilter('ngap_nuoc')">Ngập nước (${s.byCategory.ngap_nuoc.count})</button>
        <button class="chip ${state.mapFilter === "mat_duong" ? "active" : ""}" onclick="App.setMapFilter('mat_duong')">Mặt đường (${s.byCategory.mat_duong.count})</button>
        <button class="chip ${state.mapFilter === "empty_kp6" ? "active" : ""}" onclick="App.setMapFilter('empty_kp6')">Khu phố 6</button>
      </div>

      <div class="map-container">
        <svg viewBox="0 0 380 340" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <rect width="380" height="340" fill="#e5eef7"/>
          <rect x="20" y="25" width="110" height="75" rx="8" fill="#dcfce7"/>
          <rect x="255" y="195" width="105" height="85" rx="8" fill="#dcfce7"/>
          <path d="M0 285 Q120 265 220 315 T380 325 L380 340 L0 340 Z" fill="#bae6fd"/>
          <text x="85" y="330" fill="#0369a1" font-size="10" font-weight="bold">Sông Đồng Nai</text>
          <line x1="0" y1="145" x2="380" y2="145" stroke="#ffffff" stroke-width="14"/>
          <line x1="195" y1="0" x2="195" y2="300" stroke="#ffffff" stroke-width="12"/>
          <line x1="35" y1="45" x2="345" y2="260" stroke="#ffffff" stroke-width="10"/>
          <line x1="70" y1="235" x2="350" y2="95" stroke="#f8fafc" stroke-width="8"/>
          <text x="90" y="140" fill="#475569" font-size="9.5" font-weight="bold">Đ. Hưng Đạo Vương</text>
          <text x="202" y="75" fill="#475569" font-size="9.5" font-weight="bold">Đ. Nguyễn Ái Quốc</text>
          <text x="50" y="218" fill="#64748b" font-size="9">Hẻm Hà Huy Tập</text>
          <text x="262" y="222" fill="#166534" font-size="9" font-weight="bold">TH Tiểu học Trấn Biên</text>
          <circle cx="172" cy="164" r="16" fill="#2563eb" opacity="0.2"/>
          <circle cx="172" cy="164" r="6" fill="#2563eb" stroke="#fff" stroke-width="2"/>
          ${pinsSVG}
        </svg>
        <div class="map-legend">
          <span><i class="dot dot-red"></i>Mới</span>
          <span><i class="dot dot-amber"></i>Đang xử lý</span>
          <span><i class="dot dot-green"></i>Đã xong</span>
        </div>
      </div>

      <div class="section-pad">
        ${
          filtered.length === 0
            ? `<div class="card" style="text-align:center;padding:20px 14px;border:1.5px dashed #86efac;background:#f0fdf4;">
                <div style="color:#16a34a;margin-bottom:6px;">${ic("shieldCheck", 28)}</div>
                <div style="font-weight:700;color:#166534;font-size:14px;">Khu phố 6 hiện không có phản ánh tồn đọng</div>
                <p style="font-size:12px;color:#15803d;margin:6px 0 12px;">Bán kính 500m quanh khu vực đang chọn chưa ghi nhận sự cố mới.</p>
                <button class="btn-outline" onclick="App.setMapFilter('all')">Xem toàn Phường Trấn Biên</button>
              </div>`
            : `<div class="card" style="margin-bottom:0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  ${statusBadgeHTML(selected.status)}
                  <span style="font-size:11px;color:#64748b;font-weight:600;">#${selected.id} • Cách ${selected.distance}</span>
                </div>
                <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${selected.title}</div>
                <div style="font-size:12px;color:#475569;margin-bottom:8px;">${ic("pin", 13, "margin-right:3px;")}${selected.address} • <strong>${selected.supporters} người dân</strong> phản ánh</div>
                ${
                  selected.status === "done"
                    ? `<button class="btn-primary" style="padding:9px;font-size:12.5px;background:#16a34a;" onclick="App.openReview('${selected.id}')">Xem ảnh Trước/Sau &amp; Đánh giá</button>`
                    : `<button class="btn-outline" style="padding:8px;font-size:12px;" onclick="App.supportExisting('${selected.id}')">${ic("thumbsUp", 13, "margin-right:4px;")} +1 Đồng tình (${selected.supporters})</button>`
                }
              </div>`
        }
      </div>
    `;
  }

  // True 3-Step Wizard (Mỗi bước 1 màn hình tập trung, dẫn dắt rõ từng quyết định)
  function renderCitizenCreate() {
    const sample = window.PHOTO_SAMPLES.find(s => s.id === state.selectedSampleId) || window.PHOTO_SAMPLES[0];
    const isInvalid = !state.customPhotoUrl && sample.aiState === "invalid_image";
    const isVerify = !state.customPhotoUrl && sample.aiState === "needs_verify";
    const stateColor = isInvalid ? "#dc2626" : (isVerify ? "#d97706" : "#1d4ed8");
    const aiClass = isInvalid ? "low" : (isVerify ? "medium" : "");
    const categories = ["mat_duong", "den_duong", "ngap_nuoc", "rac_thai"];

    const stepperHTML = `
      <div class="stepper">
        <button class="step-pill ${state.createStep === 1 ? "active" : "done"}" onclick="App.setCreateStep(1)">
          1. Chụp ảnh ${state.createStep > 1 ? "✓" : ""}
        </button>
        <button class="step-pill ${state.createStep === 2 ? "active" : (state.createStep > 2 ? "done" : "")}" ${isInvalid ? "disabled" : ""} onclick="App.setCreateStep(2)">
          2. Vị trí ${state.createStep > 2 ? "✓" : ""}
        </button>
        <button class="step-pill ${state.createStep === 3 ? "active" : ""}" ${isInvalid ? "disabled" : ""} onclick="App.setCreateStep(3)">
          3. Chọn loại
        </button>
      </div>
    `;

    // MÀN HÌNH BƯỚC 1 / 3: CHỤP HOẶC CHỌN ẢNH HIỆN TRƯỜNG
    if (state.createStep === 1) {
      return `
        ${stepperHTML}
        <div class="section-pad">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <div>
                <div style="font-size:11px;font-weight:700;color:#1d4ed8;">BƯỚC 1 / 3</div>
                <div style="font-weight:700;font-size:15px;">Chụp hoặc tải ảnh sự cố</div>
              </div>
              <label style="background:#eff6ff;border:1px solid #bfdbfe;padding:6px 10px;border-radius:8px;font-size:11.5px;color:#1d4ed8;font-weight:700;cursor:pointer;">
                ${ic("camera", 13, "margin-right:4px;")} Chụp / Tải ảnh <input type="file" accept="image/*" capture="environment" style="display:none" onchange="App.handleFileUpload(event)"/>
              </label>
            </div>

            <div style="height:190px;border-radius:12px;overflow:hidden;border:1px solid #cbd5e1;background:#0f172a;margin-bottom:10px;">
              ${renderScenePhoto(isInvalid ? "invalid_image" : sample.category, false, state.customPhotoUrl)}
            </div>

            <label class="form-label">Hoặc chọn nhanh ảnh tình huống giả lập để kiểm thử:</label>
            <select class="form-control" style="font-size:12px;" onchange="App.selectSample(this.value)">
              ${window.PHOTO_SAMPLES.map(p => `<option value="${p.id}" ${p.id === state.selectedSampleId ? "selected" : ""}>${p.name}</option>`).join("")}
            </select>

            <div class="ai-box ${aiClass}">
              <div class="ai-split">
                <div class="ai-score-col" style="min-width:78px;">
                  <div style="color:${stateColor};margin-bottom:2px;">${ic(isInvalid ? "alert" : "sparkles", 20)}</div>
                  <div class="ai-score-lbl" style="color:${stateColor};">${isInvalid ? "Ảnh chưa rõ" : isVerify ? "Thiếu sáng" : "AI gợi ý"}</div>
                </div>
                <div class="ai-evidence-col">
                  <div style="font-size:11.5px;font-weight:700;color:#0f172a;">
                    ${isInvalid ? "Không nhận diện được sự cố:" : `Gợi ý sơ bộ: ${catLabel(sample.category)}`}
                  </div>
                  <div class="ai-ev-chips">
                    ${sample.evidence.map(e => `<span class="ai-ev-chip">${e}</span>`).join("")}
                  </div>
                </div>
              </div>
              ${
                isInvalid
                  ? `<div style="font-size:11.5px;color:#991b1b;font-weight:600;margin-top:8px;padding-top:7px;border-top:1px dashed #fca5a5;">
                      Ảnh bị mờ hoặc quá tối. Vui lòng bật đèn Flash chụp lại rõ hơn trước khi sang bước tiếp theo.
                      <button class="btn-outline" style="margin-top:6px;padding:7px;border-color:#dc2626;color:#dc2626;" onclick="App.selectSample('pothole_clear')">Chụp lại ảnh rõ nét</button>
                    </div>`
                  : isVerify
                    ? `<div style="font-size:11.5px;color:#92400e;font-weight:600;margin-top:8px;padding-top:7px;border-top:1px dashed #fcd34d;">
                        Ảnh chụp đêm thiếu sáng &rarr; Đơn gửi đi sẽ được chuyển <strong>Đoàn viên Khu phố xác minh tại chỗ</strong>.
                      </div>`
                    : `<div style="font-size:11px;color:#1e3a8a;font-weight:600;margin-top:7px;padding-top:6px;border-top:1px solid #e2e8f0;">
                        Bạn sẽ kiểm tra vị trí ở Bước 2 và có thể đổi lại phân loại ở Bước 3 nếu không đồng ý với AI.
                      </div>`
              }
            </div>

            <button class="btn-primary" style="margin-top:12px;" ${isInvalid ? "disabled style='margin-top:12px;opacity:0.45;cursor:not-allowed;'" : ""} onclick="App.setCreateStep(2)">
              Tiếp tục: Xác nhận vị trí &rarr;
            </button>
          </div>
        </div>
      `;
    }

    // MÀN HÌNH BƯỚC 2 / 3: XÁC NHẬN VỊ TRÍ & QUÉT TRÙNG 50M TRỰC TIẾP
    if (state.createStep === 2) {
      const nearDup = findNearbyDuplicate();
      const openPins = state.reports.filter(r => r.status !== "done" && r.status !== "closed").map(r => {
        const isSameCat = r.category === state.selectedCategory;
        return `<circle cx="${r.x}" cy="${r.y}" r="7" fill="${isSameCat ? "#dc2626" : "#94a3b8"}" stroke="#fff" stroke-width="2"/>`;
      }).join("");

      return `
        ${stepperHTML}
        <div class="section-pad">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <div>
                <div style="font-size:11px;font-weight:700;color:#1d4ed8;">BƯỚC 2 / 3</div>
                <div style="font-weight:700;font-size:15px;">Xác nhận vị trí sự cố</div>
              </div>
              <div style="display:flex;gap:5px;">
                <button style="font-size:11px;border:1px solid #bfdbfe;background:#eff6ff;padding:5px 8px;border-radius:7px;cursor:pointer;color:#1d4ed8;font-weight:700;" onclick="App.requestRealGps()">
                  ${ic("crosshair", 12, "margin-right:3px;")} GPS thiết bị
                </button>
                <button style="font-size:11px;border:1px solid #cbd5e1;background:#f8fafc;padding:5px 8px;border-radius:7px;cursor:pointer;color:#475569;font-weight:600;" onclick="App.toggleGpsError()">
                  ${state.gpsErrorMode ? "Dùng bản đồ" : "Nhập tay"}
                </button>
              </div>
            </div>

            ${
              state.gpsErrorMode
                ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px;margin-bottom:10px;">
                    <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;">Không có tín hiệu GPS – Chọn Khu phố &amp; Tuyến đường:</div>
                    <select class="form-control" style="margin-bottom:8px;font-size:12.5px;" onchange="App.setManualStreet(this.value)">
                      ${window.STREETS_TRAN_BIEN.map(st => `<option value="${st}" ${st === state.manualStreet ? "selected" : ""}>${st}</option>`).join("")}
                    </select>
                    <input class="form-control" style="font-size:12.5px;" value="${state.manualHouseNo}" oninput="App.setManualHouse(this.value)" placeholder="Số nhà / mốc nhận biết (VD: đối diện cổng trường)"/>
                  </div>`
                : `
                  <div style="height:175px;border-radius:12px;overflow:hidden;border:1px solid #cbd5e1;margin-bottom:8px;position:relative;cursor:crosshair;" onclick="App.movePinFromClick(event)">
                    <svg viewBox="0 0 380 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                      <rect width="380" height="300" fill="#e5eef7"/>
                      <line x1="0" y1="150" x2="380" y2="150" stroke="#ffffff" stroke-width="16"/>
                      <line x1="195" y1="0" x2="195" y2="300" stroke="#ffffff" stroke-width="14"/>
                      <line x1="40" y1="55" x2="345" y2="255" stroke="#ffffff" stroke-width="11"/>
                      <text x="72" y="143" fill="#475569" font-size="11" font-weight="bold">Đ. Hưng Đạo Vương</text>
                      ${openPins}
                      <circle cx="${state.pinX}" cy="${state.pinY}" r="43" fill="rgba(37,99,235,0.12)" stroke="#2563eb" stroke-width="2" stroke-dasharray="5 4"/>
                      <circle cx="${state.pinX}" cy="${state.pinY}" r="7" fill="#2563eb" stroke="#ffffff" stroke-width="2.5"/>
                    </svg>
                    <span style="position:absolute;top:8px;right:8px;background:rgba(15,23,42,0.75);color:#fff;font-size:10.5px;padding:3px 8px;border-radius:99px;">Chạm bản đồ để chỉnh vị trí ghim</span>
                  </div>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;margin-bottom:10px;">
                    <div style="font-size:12.5px;font-weight:700;color:#0f172a;">${ic("pin", 14, "margin-right:4px;color:#1d4ed8;")}${sample.address}</div>
                    ${state.liveGpsCoords ? `<div style="font-size:11px;color:#15803d;font-weight:600;margin-top:2px;">Đã lấy tọa độ GPS trình duyệt: ${state.liveGpsCoords}</div>` : ""}
                  </div>
                `
            }

            ${
              nearDup
                ? `<div style="background:#fffbeb;border:1.5px solid #f59e0b;border-radius:12px;padding:10px;margin-bottom:12px;">
                    <div style="font-size:12.5px;font-weight:700;color:#92400e;margin-bottom:6px;">
                      ${ic("layers", 14, "margin-right:4px;")} Đã có ${nearDup.report.supporters} người báo "${catLabel(nearDup.report.category)}" cách bạn ${nearDup.distMeters}m
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;background:#fff;padding:7px;border-radius:8px;border:1px solid #fde68a;margin-bottom:8px;">
                      <div style="width:58px;height:48px;border-radius:6px;overflow:hidden;flex-shrink:0;">${renderScenePhoto(nearDup.report.category, false)}</div>
                      <div style="font-size:11.5px;">
                        <strong>#${nearDup.report.id}:</strong> ${nearDup.report.title}
                      </div>
                    </div>
                    <button class="btn-primary" style="padding:10px;font-size:13px;background:#d97706;" onclick="App.mergeIntoExisting('${nearDup.report.id}')">
                      ${ic("thumbsUp", 14, "margin-right:5px;")} +1 Đồng tình &amp; gộp ảnh ngay (Khỏi nhập Bước 3)
                    </button>
                  </div>`
                : `<div style="font-size:11.5px;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;padding:8px 10px;border-radius:8px;margin-bottom:12px;font-weight:600;">
                    ${ic("check", 14, "margin-right:4px;")} Bán kính 50m chưa có phản ánh trùng loại sự cố này.
                  </div>`
            }

            <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:8px;">
              <button class="btn-outline" onclick="App.setCreateStep(1)">&larr; Quay lại</button>
              <button class="btn-primary" onclick="App.setCreateStep(3)">
                ${nearDup ? "Báo sự cố khác &rarr;" : "Tiếp tục: Chọn loại &rarr;"}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // MÀN HÌNH BƯỚC 3 / 3: CHỐT PHÂN LOẠI (CÓ XỬ LÝ KHI KHÔNG ĐỒNG Ý AI) & GỬI
    const aiSuggestedCat = sample.category || "mat_duong";
    const isOverridden = state.selectedCategory !== aiSuggestedCat;

    return `
      ${stepperHTML}
      <div class="section-pad">
        <div class="card">
          <div style="margin-bottom:8px;">
            <div style="font-size:11px;font-weight:700;color:#1d4ed8;">BƯỚC 3 / 3</div>
            <div style="font-weight:700;font-size:15px;">Xác nhận loại sự cố &amp; Gửi phản ánh</div>
            <div style="font-size:11.5px;color:#475569;margin-top:2px;">Nếu gợi ý của AI chưa đúng thực tế, bạn hãy chạm chọn lại loại sự cố bên dưới:</div>
          </div>

          <div class="cat-grid">
            ${categories.map(cat => {
              const info = state.stats.byCategory[cat];
              const isSelected = state.selectedCategory === cat;
              const isAiPick = aiSuggestedCat === cat;
              return `
                <button class="cat-tile ${isSelected ? "selected" : ""}" onclick="App.selectCategory('${cat}')">
                  ${isAiPick ? `<span class="cat-ai-badge" style="background:${isOverridden ? "#64748b" : "#1d4ed8"}">${isOverridden ? "AI gợi ý ban đầu" : "AI gợi ý"}</span>` : ""}
                  <div style="margin-bottom:5px;color:${isSelected ? "#1d4ed8" : "#475569"};">${ic(info.iconName, 20)}</div>
                  <div>${info.label}</div>
                </button>
              `;
            }).join("")}
          </div>

          ${
            isOverridden
              ? `<div class="override-banner">
                  <div>
                    <strong>Đã đổi theo lựa chọn của bạn:</strong> Gửi theo phân loại <u>${catLabel(state.selectedCategory)}</u> thay cho gợi ý của AI.
                  </div>
                  <button style="border:1px solid #14b8a6;background:#fff;color:#0f766e;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;" onclick="App.restoreAiCategory()">
                    ${ic("refresh", 11, "margin-right:3px;")} Dùng lại gợi ý AI
                  </button>
                </div>`
              : ""
          }

          <label class="form-label" style="margin-top:10px;">Mô tả ngắn hiện trạng (có thể sửa hoặc để trống):</label>
          <textarea class="form-control" rows="2" style="font-size:12.5px;margin-bottom:12px;" placeholder="Nhập thêm đặc điểm để đơn vị dễ tìm..." oninput="App.setDesc(this.value)">${state.customDesc}</textarea>

          <div style="display:grid;grid-template-columns:1fr 1.8fr;gap:8px;">
            <button class="btn-outline" onclick="App.setCreateStep(2)">&larr; Vị trí</button>
            <button class="btn-primary" onclick="App.submitReportStep()">
              ${ic("send", 15, "margin-right:6px;")} Gửi phản ánh
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderCitizenMine() {
    const myReports = state.reports.filter(r => r.mine);
    return `
      <div class="section-pad">
        ${state.seniorMode ? `<button class="btn-outline" style="font-size:16px;font-weight:700;border-width:2px;margin-bottom:12px;text-align:left;" onclick="App.seniorGoHome()">${ic("arrowLeft", 17, "margin-right:5px;")} Quay về Trang chính</button>` : ""}
        <div style="font-weight:700;font-size:${state.seniorMode ? "19px" : "14.5px"};margin-bottom:10px;">
          Phản ánh của tôi (${myReports.length})
        </div>
        ${myReports.map(r => `
          <div class="report-list-card">
            <div class="report-list-main">
              <div>${statusBadgeHTML(r.status)}</div>
              <div class="report-list-title">${r.title}</div>
            </div>
            <button class="btn-detail" onclick="App.openDetail('${r.id}')">Chi tiết ${ic("chevronRight", 14)}</button>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderDuplicateSheet() {
    if (!state.showDuplicateSheet || !state.matchedDuplicate) return "";
    const dup = state.matchedDuplicate.report;
    const dist = state.matchedDuplicate.distMeters;
    return `
      <div class="sheet-backdrop" onclick="App.closeDupSheet()">
        <div class="sheet-card" onclick="event.stopPropagation()">
          <div style="width:40px;height:4px;background:#cbd5e1;border-radius:99px;margin:0 auto 10px;"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span class="status-tag st-verify">${ic("layers", 12)} Trùng vị trí (&le;50m) &amp; Cùng loại</span>
            <button style="border:none;background:#f1f5f9;width:28px;height:28px;border-radius:99px;cursor:pointer;" onclick="App.closeDupSheet()">${ic("close", 14)}</button>
          </div>
          <div style="font-size:16px;font-weight:700;margin-bottom:8px;">
            Đã có ${dup.supporters} người báo sự cố này cách bạn ${dist}m
          </div>
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:10px;margin-bottom:10px;display:flex;gap:10px;align-items:center;">
            <div style="width:76px;height:64px;border-radius:8px;overflow:hidden;flex-shrink:0;border:1px solid #cbd5e1;">
              ${renderScenePhoto(dup.category, false)}
            </div>
            <div style="font-size:12px;min-width:0;">
              <div style="font-weight:700;color:#0f172a;">#${dup.id} • ${catLabel(dup.category)}</div>
              <div style="color:#475569;margin:2px 0;">${dup.address}</div>
              ${statusBadgeHTML(dup.status)}
            </div>
          </div>
          <p style="font-size:12px;color:#475569;margin-bottom:12px;line-height:1.4;">
            Bấm <strong>+1 Đồng tình</strong> để gộp chung ảnh của bạn vào hồ sơ hiện có, giúp Phường ưu tiên xử lý sớm hơn.
          </p>
          <button class="btn-primary" style="margin-bottom:8px;" onclick="App.mergeIntoExisting('${dup.id}')">
            ${ic("thumbsUp", 15, "margin-right:5px;")} +1 Đồng tình &amp; thêm ảnh
          </button>
          <button class="btn-outline" onclick="App.forceCreateNew()">Đây là sự cố khác – gửi phản ánh riêng</button>
        </div>
      </div>
    `;
  }

  function renderDetailModal() {
    const r = state.reports.find(x => x.id === state.detailModalId);
    if (!r) return "";
    return `
      <div class="sheet-backdrop" onclick="App.closeDetail()">
        <div class="sheet-card" style="max-height:90%;overflow-y:auto;" onclick="event.stopPropagation()">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            ${statusBadgeHTML(r.status)}
            <button style="border:none;background:#f1f5f9;width:32px;height:32px;border-radius:99px;cursor:pointer;" onclick="App.closeDetail()">${ic("close", 15)}</button>
          </div>
          <div style="font-weight:700;font-size:${state.seniorMode ? "19px" : "15px"};margin-bottom:4px;">${r.title}</div>
          <div style="font-size:${state.seniorMode ? "15.5px" : "12px"};color:#475569;margin-bottom:10px;">
            Mã <strong>#${r.id}</strong> • ${r.address} • ${r.supporters} người đồng tình
          </div>
          <div style="height:145px;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;margin-bottom:10px;">
            ${renderScenePhoto(r.category, r.status === "done", r.status === "done" ? r.customAfterPhotoUrl : r.customBeforePhotoUrl)}
          </div>
          <div class="timeline">
            <div class="tl-item done"><span class="tl-dot"></span><strong>1. Tiếp nhận:</strong> ${r.createdAt}</div>
            <div class="tl-item ${r.volunteerVerified ? "done" : (r.status === "closed" ? "done" : "current")}"><span class="tl-dot"></span><strong>2. Xác minh thực địa:</strong> ${r.volunteerNote || "Đang chờ Đội TNTN kiểm tra"}</div>
            <div class="tl-item ${r.status === "progress" ? "current" : (r.status === "done" ? "done" : "")}"><span class="tl-dot"></span><strong>3. Bàn giao đơn vị thực thi:</strong> ${r.department ? `${r.department} (${r.sla})` : "UBND Phường đang phân công"}</div>
            <div class="tl-item ${r.status === "done" ? "done" : ""}"><span class="tl-dot"></span><strong>4. Đơn vị báo kết quả &amp; Nghiệm thu:</strong> ${r.status === "done" ? "Đã cập nhật ảnh sau xử lý công khai" : "Chờ đơn vị khắc phục"}</div>
          </div>
          ${
            r.status === "done"
              ? `<button class="btn-primary" style="margin-top:8px;background:#16a34a;" onclick="App.openReview('${r.id}')">Đối chiếu Ảnh Trước/Sau &amp; Đánh giá</button>`
              : `<button class="btn-outline" style="margin-top:8px;" onclick="App.closeDetail()">Đóng</button>`
          }
        </div>
      </div>
    `;
  }

  function renderReviewModal() {
    const r = state.reports.find(x => x.id === state.reviewModalId);
    if (!r) return "";
    const tagOptions = ["Xử lý đúng hạn", "Thu dọn sạch sẽ", "Cán bộ nhiệt tình", "Lo ngại tái diễn"];
    return `
      <div class="sheet-backdrop" onclick="App.closeReview()">
        <div class="sheet-card" style="max-height:92%;overflow-y:auto;" onclick="event.stopPropagation()">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span class="status-tag st-done">${ic("check", 12)} Đã xử lý (#${r.id})</span>
            <button style="border:none;background:#f1f5f9;width:30px;height:30px;border-radius:99px;cursor:pointer;" onclick="App.closeReview()">${ic("close", 14)}</button>
          </div>
          <div style="font-weight:700;font-size:14.5px;margin-bottom:8px;">${r.title}</div>
          <div style="font-size:11.5px;font-weight:700;color:#1d4ed8;margin-bottom:4px;">Kéo thanh trượt để đối chiếu Ảnh Trước &amp; Sau xử lý:</div>
          <div class="ba-wrap">
            <div class="ba-layer">${renderScenePhoto(r.category, true, r.customAfterPhotoUrl)}</div>
            <div class="ba-before-clip" style="width:${state.sliderPos}%;">
              <div style="width:100cqw;height:185px;">${renderScenePhoto(r.category, false, r.customBeforePhotoUrl)}</div>
            </div>
            <span class="ba-label left">TRƯỚC</span>
            <span class="ba-label right">SAU XỬ LÝ</span>
          </div>
          <input type="range" min="5" max="95" value="${state.sliderPos}" style="width:100%;margin:8px 0;" oninput="App.setSlider(this.value)"/>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:8px 10px;font-size:12px;margin-bottom:10px;">
            <strong>Đơn vị thực hiện (${r.department}):</strong> ${r.afterNote || "Đã khắc phục hiện trường."}
          </div>
          <div style="text-align:center;margin-bottom:8px;">
            <div style="font-size:12.5px;font-weight:700;">Người dân đánh giá mức độ hài lòng:</div>
            <div style="font-size:28px;letter-spacing:4px;cursor:pointer;">
              ${[1, 2, 3, 4, 5].map(n => `<span onclick="App.setTempRating(${n})" style="color:${n <= state.tempRating ? "#eab308" : "#cbd5e1"}">&#9733;</span>`).join("")}
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;justify-content:center;">
            ${tagOptions.map(t => `<button class="chip ${state.tempTags.includes(t) ? "active" : ""}" onclick="App.toggleRatingTag('${t}')">${t}</button>`).join("")}
          </div>
          <button class="btn-primary" onclick="App.saveReview('${r.id}')">Gửi đánh giá</button>
        </div>
      </div>
    `;
  }

  // ==================== ROLE 2: VOLUNTEER ====================
  function renderVolunteerBody() {
    const needVerify = state.reports.filter(r => !r.volunteerVerified && r.status !== "done" && r.status !== "closed");
    return `
      <div class="section-pad">
        <div class="card" style="background:#f0f9ff;border-color:#7dd3fc;">
          <div style="font-weight:700;font-size:13px;color:#0369a1;">Xác minh thực địa của Đoàn viên Khu phố</div>
          <p style="font-size:11.5px;color:#0c4a6e;margin-top:3px;">Kiểm tra tại chỗ các tin báo ảnh tối/chưa rõ để chuyển Cán bộ Phường giao việc, hoặc đóng lưu vết nếu không có sự cố.</p>
        </div>
        <div style="font-weight:700;font-size:14px;margin:10px 0 8px;">Cần xác minh gần tôi (${needVerify.length})</div>
        ${
          needVerify.length === 0
            ? `<div class="card" style="text-align:center;padding:22px;"><div style="color:#16a34a;margin-bottom:4px;">${ic("shieldCheck", 26)}</div><div style="font-weight:700;color:#166534;">Đã xác minh hết các phản ánh trong khu phố</div></div>`
            : needVerify.map(r => `
                <div class="card">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span class="status-tag st-verify">Ảnh thiếu sáng – Cần kiểm tra</span>
                    <span style="font-size:11px;color:#64748b;font-weight:700;">#${r.id} • Cách 150m</span>
                  </div>
                  <div style="font-weight:700;font-size:13.5px;margin-bottom:4px;">${r.title}</div>
                  <div style="font-size:12px;color:#475569;margin-bottom:8px;">${ic("pin", 13, "margin-right:3px;")}${r.address}</div>
                  <div style="height:130px;border-radius:8px;overflow:hidden;margin-bottom:8px;">${renderScenePhoto(r.category, false, r.customBeforePhotoUrl)}</div>
                  <button class="btn-primary" style="background:#0284c7;padding:10px;font-size:12.5px;margin-bottom:6px;" onclick="App.volunteerVerify('${r.id}', true)">${ic("check", 14, "margin-right:4px;")} Xác nhận đúng sự cố &rarr; Chuyển Phường</button>
                  <button class="btn-outline" style="padding:8px;font-size:12px;" onclick="App.volunteerVerify('${r.id}', false)">Không phát sinh sự cố (Đóng lưu vết)</button>
                </div>
              `).join("")
        }
        <div class="card" style="border:1.5px dashed #0284c7;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;">Hỗ trợ người cao tuổi ít dùng công nghệ</div>
          <button class="btn-outline" style="border-color:#0284c7;color:#0284c7;font-weight:700;margin-top:4px;" onclick="App.switchToAssistedReport()">${ic("camera", 14, "margin-right:5px;")} Mở biểu mẫu gửi hộ người dân</button>
        </div>
      </div>
    `;
  }

  // ==================== ROLE 3: WARD OFFICER & EXECUTION UNIT HANDOFF ====================
  function renderOfficerMobileBody() {
    const s = state.stats;
    const pending = s.total - s.resolved;
    const list = state.reports
      .filter(r => state.officerFilter === "all" || r.status === state.officerFilter)
      .slice()
      .sort((a, b) => b.supporters - a.supporters);

    return `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:10px 10px;background:#fff;border-bottom:1px solid #e2e8f0;text-align:center;">
        <div style="background:#f8fafc;padding:7px 3px;border-radius:9px;border:1px solid #e2e8f0;">
          <div style="font-size:16px;font-weight:700;">${s.total}</div>
          <div style="font-size:9.5px;color:#475569;font-weight:600;">Tổng T11</div>
        </div>
        <div style="background:#f0fdf4;padding:7px 3px;border-radius:9px;border:1px solid #bbf7d0;">
          <div style="font-size:16px;font-weight:700;color:#16a34a;">${s.resolved}</div>
          <div style="font-size:9.5px;color:#15803d;font-weight:600;">Đã xử lý</div>
        </div>
        <div style="background:#fffbeb;padding:7px 3px;border-radius:9px;border:1px solid #fde68a;">
          <div style="font-size:16px;font-weight:700;color:#b45309;">${pending}</div>
          <div style="font-size:9.5px;color:#92400e;font-weight:600;">Chờ / Đang</div>
        </div>
        <div style="background:#eff6ff;padding:7px 3px;border-radius:9px;border:1px solid #bfdbfe;">
          <div style="font-size:16px;font-weight:700;color:#1d4ed8;">${s.avgDays}n</div>
          <div style="font-size:9.5px;color:#1e40af;font-weight:600;">Xử lý TB</div>
        </div>
      </div>

      <div class="chip-scroll">
        ${[["all", "Tất cả"], ["new", "Chờ Phường giao"], ["progress", "Đơn vị đang sửa"], ["done", "Đã xong"], ["closed", "Đã đóng"]].map(([k, lbl]) => `
          <button class="chip ${state.officerFilter === k ? "active" : ""}" onclick="App.setOfficerFilter('${k}')">${lbl}</button>
        `).join("")}
      </div>

      <div class="section-pad">
        ${list.map(r => {
          const actionLabel = r.status === "new" || r.status === "verify"
            ? "Giao việc"
            : (r.status === "progress" ? "Báo kết quả" : "Xem");
          return `
            <div class="report-list-card">
              <div class="report-list-main">
                <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;">
                  ${statusBadgeHTML(r.status)}
                  ${r.supporters > 1 ? `<span style="background:#fee2e2;color:#991b1b;font-size:10.5px;font-weight:700;padding:2px 6px;border-radius:99px;">Gộp ${r.supporters} phản ánh</span>` : ""}
                </div>
                <div class="report-list-title">${r.title}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">
                  #${r.id} • ${r.department ? r.department : (r.volunteerVerified ? "Chờ Cán bộ Phường giao đơn vị" : "Chờ Đoàn viên xác minh")}
                </div>
              </div>
              <button class="btn-detail" onclick="App.openOfficerModal('${r.id}')">${actionLabel}</button>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  // Tách bạch rõ 2 giai đoạn bàn giao: (1) Cán bộ Phường giao việc -> (2) Đơn vị thực thi tải ảnh Sau xử lý & Phường nghiệm thu
  function renderOfficerModal() {
    const sel = state.reports.find(x => x.id === state.officerModalId);
    if (!sel) return "";
    const categories = ["mat_duong", "den_duong", "ngap_nuoc", "rac_thai"];

    return `
      <div class="sheet-backdrop" onclick="App.closeOfficerModal()">
        <div class="sheet-card" style="max-height:92%;overflow-y:auto;" onclick="event.stopPropagation()">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong>Hồ sơ #${sel.id}</strong>
            <button style="border:none;background:#f1f5f9;width:30px;height:30px;border-radius:99px;cursor:pointer;" onclick="App.closeOfficerModal()">${ic("close", 14)}</button>
          </div>
          <div style="height:130px;border-radius:10px;overflow:hidden;margin-bottom:8px;">
            ${renderScenePhoto(sel.category, sel.status === "done", sel.status === "done" ? sel.customAfterPhotoUrl : sel.customBeforePhotoUrl)}
          </div>
          <div style="font-size:13px;font-weight:700;margin-bottom:3px;">${sel.title}</div>
          <div style="font-size:11.5px;color:#475569;margin-bottom:8px;">${sel.address} • Gộp ${sel.supporters} lượt báo</div>

          ${
            sel.status === "new" || sel.status === "verify"
              ? `
                <div class="handoff-box">
                  <div style="font-size:12px;font-weight:700;color:#1e3a8a;margin-bottom:8px;">
                    ${ic("building", 14, "margin-right:4px;")} Bước 1 – Cán bộ UBND Phường phân loại &amp; bàn giao
                  </div>
                  <label class="form-label">Phân loại sự cố:</label>
                  <select class="form-control" style="margin-bottom:8px;font-size:12.5px;" onchange="App.setAssignCat(this.value)">
                    ${categories.map(c => `<option value="${c}" ${c === sel.category ? "selected" : ""}>${catLabel(c)}</option>`).join("")}
                  </select>
                  <label class="form-label">Đơn vị thực thi nhận bàn giao:</label>
                  <select class="form-control" style="margin-bottom:8px;font-size:12.5px;" onchange="App.setAssignDept(this.value)">
                    <option>Ban Quản lý Duy tu Giao thông Đô thị</option>
                    <option>Đội Quản lý Điện chiếu sáng Đô thị</option>
                    <option>Công ty CP Môi trường Đô thị Sonadezi</option>
                    <option>Xí nghiệp Cấp thoát nước Đồng Nai</option>
                  </select>
                  <label class="form-label">Hạn xử lý (SLA):</label>
                  <select class="form-control" style="margin-bottom:10px;font-size:12.5px;" onchange="App.setAssignSla(this.value)">
                    <option>24 giờ (Hạn: 25/11/2026)</option>
                    <option selected>48 giờ (Hạn: 26/11/2026)</option>
                    <option>72 giờ (Hạn: 27/11/2026)</option>
                  </select>
                  <button class="btn-primary" onclick="App.assignTicket('${sel.id}')">
                    ${ic("send", 14, "margin-right:5px;")} Bàn giao cho Đơn vị thực thi
                  </button>
                  <div style="font-size:11px;color:#64748b;margin-top:6px;">
                    * Chức năng cập nhật kết quả chỉ mở sau khi đã bàn giao đơn vị xử lý.
                  </div>
                </div>
              `
              : sel.status === "progress"
                ? `
                  <div class="handoff-box exec">
                    <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:4px;">
                      ${ic("wrench", 14, "margin-right:4px;")} Bước 2 – Đơn vị thực thi báo kết quả &amp; Phường nghiệm thu
                    </div>
                    <div style="font-size:11.5px;color:#14532d;margin-bottom:8px;">
                      Đơn vị nhận việc: <strong>${sel.department}</strong> (${sel.sla})
                    </div>
                    <label style="display:block;text-align:center;background:#fff;border:1.5px dashed #16a34a;color:#15803d;padding:8px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:8px;">
                      ${ic("camera", 14, "margin-right:4px;")} ${state.tempAfterPhotoUrl ? "Đã chọn ảnh thực tế (Chạm để đổi)" : "Tải ảnh thực tế Sau xử lý (hoặc dùng ảnh mẫu)"}
                      <input type="file" accept="image/*" capture="environment" style="display:none" onchange="App.handleAfterPhotoUpload(event)"/>
                    </label>
                    ${state.tempAfterPhotoUrl ? `<div style="height:90px;border-radius:8px;overflow:hidden;margin-bottom:8px;border:1px solid #86efac;"><img src="${state.tempAfterPhotoUrl}" style="width:100%;height:100%;object-fit:cover;"/></div>` : ""}
                    <label class="form-label">Nội dung khắc phục công khai cho người dân:</label>
                    <textarea class="form-control" rows="2" style="font-size:12px;margin-bottom:8px;background:#fff;" oninput="App.setAfterNote(this.value)">${state.afterResolutionNote}</textarea>
                    <button class="btn-primary" style="background:#15803d;" onclick="App.completeTicket('${sel.id}')">
                      ${ic("check", 14, "margin-right:4px;")} Nghiệm thu &amp; Công khai kết quả cho Dân
                    </button>
                  </div>
                `
                : sel.status === "closed"
                  ? `<div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:12px;">
                      <strong>Đã đóng sau xác minh thực địa</strong>
                      <p style="margin-top:4px;color:#475569;">${sel.volunteerNote}</p>
                    </div>`
                  : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px;font-size:12px;">
                      <strong style="color:#166534;">Đã nghiệm thu &amp; công khai (${sel.department})</strong>
                      <p style="margin-top:4px;">${sel.afterNote}</p>
                    </div>`
          }
        </div>
      </div>
    `;
  }

  function render() {
    const root = document.getElementById("app-root");
    if (!root) return;

    const myCount = state.reports.filter(r => r.mine).length;
    let headerHTML = "";
    let bodyHTML = "";
    let navHTML = "";

    if (state.role === "citizen") {
      headerHTML = `
        <div class="app-header">
          <div>
            <div class="app-brand-title">TrấnBiên Trực Tuyến</div>
            <div class="app-brand-loc">${ic("pin", 12, "margin-right:3px;")}Khu phố 2, Phường Trấn Biên</div>
          </div>
          <button class="senior-toggle ${state.seniorMode ? "on" : ""}" onclick="App.toggleSenior()">
            ${ic("type", 14)} ${state.seniorMode ? "Chữ lớn: BẬT" : "Chữ lớn"}
          </button>
        </div>
      `;
      if (state.seniorMode) {
        bodyHTML = state.seniorPage === "create" ? renderSeniorCreate() : (state.seniorPage === "mine" ? renderCitizenMine() : renderSeniorHome());
        navHTML = `
          <div class="bottom-nav">
            <button class="nav-item ${state.seniorPage === "home" ? "active" : ""}" onclick="App.seniorGoHome()">${ic("home", 18)}<span>Trang chính</span></button>
            <button class="nav-item ${state.seniorPage === "create" ? "active" : ""}" onclick="App.seniorGoCreate()">${ic("camera", 18)}<span>Báo sự cố</span></button>
            <button class="nav-item ${state.seniorPage === "mine" ? "active" : ""}" onclick="App.seniorGoMine()">${ic("list", 18)}<span>Đã báo (${myCount})</span></button>
          </div>
        `;
      } else {
        bodyHTML = state.citizenTab === "map" ? renderCitizenMap() : (state.citizenTab === "create" ? renderCitizenCreate() : renderCitizenMine());
        navHTML = `
          <div class="bottom-nav">
            <button class="nav-item ${state.citizenTab === "map" ? "active" : ""}" onclick="App.setCitizenTab('map')">${ic("map", 18)}<span>Quanh tôi</span></button>
            <button class="nav-item ${state.citizenTab === "create" ? "active" : ""}" onclick="App.startCreateFlow()"><span class="nav-cta">${ic("camera", 14, "margin-right:4px;")}Gửi 3 bước</span></button>
            <button class="nav-item ${state.citizenTab === "mine" ? "active" : ""}" onclick="App.setCitizenTab('mine')"><span class="badge-dot">${myCount}</span>${ic("list", 18)}<span>Của tôi</span></button>
          </div>
        `;
      }
    } else if (state.role === "volunteer") {
      headerHTML = `
        <div class="app-header volunteer-header">
          <div>
            <div class="app-brand-title">Đội TNTN Phường Trấn Biên</div>
            <div class="app-brand-loc">Nguyễn Minh Khoa • Bí thư Chi đoàn KP.3</div>
          </div>
        </div>
      `;
      bodyHTML = renderVolunteerBody();
    } else {
      headerHTML = `
        <div class="app-header officer-header">
          <div>
            <div class="app-brand-title">Điều Hành Phường &amp; Đơn Vị Thực Thi</div>
            <div class="app-brand-loc">Tiếp nhận, bàn giao đơn vị &amp; nghiệm thu kết quả</div>
          </div>
        </div>
      `;
      bodyHTML = renderOfficerMobileBody();
    }

    root.className = `app-shell ${state.role === "citizen" && state.seniorMode ? "senior-mode" : ""}`;
    root.innerHTML = `
      ${renderRoleStrip()}
      ${headerHTML}
      <div class="phone-body">
        ${bodyHTML}
        ${renderDuplicateSheet()}
        ${renderDetailModal()}
        ${renderReviewModal()}
        ${renderOfficerModal()}
        ${renderDemoDrawer()}
      </div>
      <div id="toast-slot"></div>
      ${navHTML}
    `;
    renderToast();
  }

  window.App = {
    setRole(r) { state.role = r; render(); },
    toggleDemoDrawer(open) { state.showDemoDrawer = open; render(); },
    toggleSenior() {
      state.seniorMode = !state.seniorMode;
      state.seniorPage = "home";
      state.createStep = 1;
      state.detailModalId = null;
      render();
      showToast(state.seniorMode ? "Đã bật Chế độ Chữ lớn cho Người cao tuổi" : "Đã chuyển về giao diện tiêu chuẩn");
    },
    seniorGoHome() { state.seniorMode = true; state.seniorPage = "home"; render(); },
    seniorGoCreate() {
      state.seniorMode = true;
      state.seniorPage = "create";
      state.createStep = 1;
      if (state.selectedSampleId === "blurry_error") state.selectedSampleId = "pothole_clear";
      render();
    },
    seniorGoMine() { state.seniorMode = true; state.seniorPage = "mine"; render(); },
    callVolunteerSupport() { showToast("Đã gửi yêu cầu nhờ Đoàn viên Khu phố 2 hỗ trợ Bác"); },
    setCitizenTab(t) { state.citizenTab = t; render(); },
    startCreateFlow() { state.citizenTab = "create"; state.createStep = 1; render(); },
    setCreateStep(step) { state.createStep = step; render(); },
    setMapFilter(f) { state.mapFilter = f; render(); },
    selectPin(id) { state.selectedMapPinId = id; render(); },
    supportExisting(id) {
      const r = state.reports.find(x => x.id === id);
      if (r) { r.supporters += 1; r.mine = true; render(); showToast(`Đã +1 đồng tình vào phản ánh #${id}`); }
    },
    selectSample(sampleId) {
      state.selectedSampleId = sampleId;
      state.customPhotoUrl = null;
      state.userOverrodeAi = false;
      const s = window.PHOTO_SAMPLES.find(x => x.id === sampleId);
      if (s) {
        if (s.category) { state.selectedCategory = s.category; state.customDesc = s.suggestedDesc; }
        state.pinX = s.lng || 196;
        state.pinY = s.lat || 165;
      }
      render();
    },
    requestRealGps() {
      if (!navigator.geolocation) {
        state.gpsErrorMode = true;
        render();
        showToast("Trình duyệt không hỗ trợ GPS – Đã chuyển sang chọn đường thủ công");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          state.gpsErrorMode = false;
          state.liveGpsCoords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
          render();
          showToast(`Đã lấy tọa độ GPS thiết bị: ${state.liveGpsCoords}`);
        },
        () => {
          state.gpsErrorMode = true;
          render();
          showToast("Không lấy được quyền GPS – Đã mở chọn Khu phố & Tên đường");
        },
        { timeout: 6000 }
      );
    },
    movePinFromClick(ev) {
      const rect = ev.currentTarget.getBoundingClientRect();
      const rx = ((ev.clientX - rect.left) / rect.width) * 380;
      const ry = ((ev.clientY - rect.top) / rect.height) * 300;
      state.pinX = Math.max(20, Math.min(360, Math.round(rx)));
      state.pinY = Math.max(20, Math.min(280, Math.round(ry)));
      render();
    },
    handleFileUpload(ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        state.customPhotoUrl = e.target.result;
        state.selectedSampleId = "pothole_clear";
        state.userOverrodeAi = false;
        render();
        showToast("Đã tải ảnh thực tế từ thiết bị");
      };
      reader.readAsDataURL(file);
    },
    handleAfterPhotoUpload(ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        state.tempAfterPhotoUrl = e.target.result;
        render();
        showToast("Đã đính kèm ảnh nghiệm thu Sau xử lý");
      };
      reader.readAsDataURL(file);
    },
    toggleGpsError() { state.gpsErrorMode = !state.gpsErrorMode; render(); },
    setManualStreet(v) { state.manualStreet = v; },
    setManualHouse(v) { state.manualHouseNo = v; },
    selectCategory(c) {
      const sample = window.PHOTO_SAMPLES.find(x => x.id === state.selectedSampleId);
      const aiCat = sample && sample.category ? sample.category : "mat_duong";
      state.selectedCategory = c;
      state.userOverrodeAi = (c !== aiCat);
      if (state.userOverrodeAi && sample && state.customDesc === sample.suggestedDesc) {
        state.customDesc = `${catLabel(c)} ghi nhận tại ${sample.address}.`;
      }
      render();
    },
    restoreAiCategory() {
      const sample = window.PHOTO_SAMPLES.find(x => x.id === state.selectedSampleId);
      if (sample && sample.category) {
        state.selectedCategory = sample.category;
        state.customDesc = sample.suggestedDesc;
        state.userOverrodeAi = false;
      }
      render();
    },
    setDesc(v) { state.customDesc = v; },
    submitReportStep() {
      const nearDup = findNearbyDuplicate(state.selectedCategory);
      if (nearDup) {
        state.matchedDuplicate = nearDup;
        state.showDuplicateSheet = true;
        render();
        return;
      }
      window.App.forceCreateNew();
    },
    closeDupSheet() { state.showDuplicateSheet = false; render(); },
    mergeIntoExisting(id) {
      const r = state.reports.find(x => x.id === id);
      if (r) { r.supporters += 1; r.mine = true; }
      state.showDuplicateSheet = false;
      state.createStep = 1;
      state.citizenTab = "mine";
      state.seniorPage = "mine";
      render();
      showToast(`Đã gộp phản ánh vào hồ sơ #${id}`);
    },
    forceCreateNew() {
      const sample = window.PHOTO_SAMPLES.find(x => x.id === state.selectedSampleId);
      const needVerify = !state.customPhotoUrl && sample && sample.aiState === "needs_verify";
      const newId = "TB-" + (1165 + Math.floor(Math.random() * 30));
      const addr = state.gpsErrorMode
        ? `${state.manualHouseNo}, ${state.manualStreet}`
        : (state.liveGpsCoords ? `${sample ? sample.address : "P. Trấn Biên"} (${state.liveGpsCoords})` : (sample ? sample.address : "Phường Trấn Biên"));
      const cleanTitle = (state.customDesc || "").split(",")[0].replace(/[.,;:\s]+$/, "").slice(0, 56) || catLabel(state.selectedCategory);

      state.reports.unshift({
        id: newId,
        category: state.selectedCategory,
        title: cleanTitle,
        address: addr,
        x: state.pinX, y: state.pinY,
        distance: "30m",
        aiState: needVerify ? "needs_verify" : "clear",
        aiEvidence: sample ? sample.evidence : [],
        customBeforePhotoUrl: state.customPhotoUrl || null,
        customAfterPhotoUrl: null,
        supporters: 1,
        volunteerVerified: !needVerify,
        volunteerNote: needVerify ? "" : "Ảnh hiện trường rõ nét, chuyển Cán bộ Phường điều phối.",
        status: needVerify ? "verify" : "new",
        department: "",
        sla: needVerify ? "Chờ Đoàn viên xác minh tại chỗ" : "Chờ Cán bộ Phường giao đơn vị",
        createdAt: "Vừa xong (24/11/2026)",
        mine: true,
        rating: 0,
        ratingTags: [],
        afterNote: ""
      });
      state.stats.total += 1;
      state.stats.byCategory[state.selectedCategory].count += 1;
      state.showDuplicateSheet = false;
      state.createStep = 1;
      state.citizenTab = "mine";
      state.seniorPage = "mine";
      render();
      showToast(`Đã gửi phản ánh #${newId}`);
    },
    openDetail(id) { state.detailModalId = id; render(); },
    closeDetail() { state.detailModalId = null; render(); },
    openReview(id) {
      const r = state.reports.find(x => x.id === id);
      state.detailModalId = null;
      state.reviewModalId = id;
      state.sliderPos = 50;
      state.tempRating = r && r.rating ? r.rating : 5;
      render();
    },
    closeReview() { state.reviewModalId = null; render(); },
    setSlider(val) {
      state.sliderPos = Number(val);
      const clip = document.querySelector(".ba-before-clip");
      if (clip) clip.style.width = state.sliderPos + "%";
    },
    setTempRating(n) { state.tempRating = n; render(); },
    toggleRatingTag(tag) {
      state.tempTags = state.tempTags.includes(tag) ? state.tempTags.filter(t => t !== tag) : [...state.tempTags, tag];
      render();
    },
    saveReview(id) {
      const r = state.reports.find(x => x.id === id);
      if (r) { r.rating = state.tempRating; r.ratingTags = [...state.tempTags]; }
      state.reviewModalId = null;
      render();
      showToast("Đã ghi nhận đánh giá công khai của người dân");
    },
    volunteerVerify(id, isValid) {
      const r = state.reports.find(x => x.id === id);
      if (!r) return;
      if (isValid) {
        r.volunteerVerified = true;
        r.status = "new";
        r.volunteerNote = "Đoàn viên KP.3 xác nhận đúng sự cố tại chỗ, chuyển Cán bộ Phường phân công.";
        r.sla = "Chờ Cán bộ Phường giao đơn vị";
        showToast(`Đã xác minh #${id} và bàn giao lên Cán bộ Phường`);
      } else {
        r.volunteerVerified = true;
        r.status = "closed";
        r.volunteerNote = "Đoàn viên KP.3 kiểm tra thực địa lúc 09:40: Nước đã tự rút, không còn sự cố (Đóng lưu vết).";
        r.sla = "Đã đóng sau xác minh";
        showToast(`Đã đóng lưu vết #${id} (vẫn giữ lịch sử đối soát tại Phường)`);
      }
      render();
    },
    switchToAssistedReport() {
      state.role = "citizen";
      state.seniorMode = false;
      state.citizenTab = "create";
      state.createStep = 1;
      render();
      showToast("Đang mở biểu mẫu gửi phản ánh hộ người dân");
    },
    setOfficerFilter(f) { state.officerFilter = f; render(); },
    openOfficerModal(id) {
      const r = state.reports.find(x => x.id === id);
      state.officerModalId = id;
      state.tempAfterPhotoUrl = null;
      if (r) state.assignCategory = r.category;
      render();
    },
    closeOfficerModal() { state.officerModalId = null; render(); },
    setAssignCat(v) { state.assignCategory = v; },
    setAssignDept(v) { state.assignDept = v; },
    setAssignSla(v) { state.assignSla = v; },
    assignTicket(id) {
      const r = state.reports.find(x => x.id === id);
      if (!r) return;
      r.category = state.assignCategory || r.category;
      r.status = "progress";
      r.department = state.assignDept;
      r.sla = state.assignSla;
      // Không tự gán r.mine = true để tránh làm sai danh sách của người dân!
      state.officerModalId = null;
      render();
      showToast(`Đã bàn giao #${id} cho "${state.assignDept}" thực thi`);
    },
    setAfterNote(v) { state.afterResolutionNote = v; },
    completeTicket(id) {
      const r = state.reports.find(x => x.id === id);
      if (!r || r.status !== "progress") return;
      state.stats.resolved += 1;
      r.status = "done";
      if (state.tempAfterPhotoUrl) r.customAfterPhotoUrl = state.tempAfterPhotoUrl;
      r.afterNote = state.afterResolutionNote;
      r.sla = "Đã nghiệm thu & công khai kết quả";
      state.officerModalId = null;
      render();
      showToast(`Đã nghiệm thu & công khai ảnh sau xử lý cho #${id}`);
    },
    runScenario(name) {
      state.showDemoDrawer = false;
      state.role = "citizen";
      if (name === "standard") {
        state.seniorMode = false; state.citizenTab = "create"; state.createStep = 1; state.gpsErrorMode = false;
        window.App.selectSample("pothole_clear");
      } else if (name === "override_ai") {
        state.seniorMode = false; state.citizenTab = "create"; state.createStep = 3; state.gpsErrorMode = false;
        window.App.selectSample("pothole_clear");
        window.App.selectCategory("ngap_nuoc");
      } else if (name === "medium_ai") {
        state.seniorMode = false; state.citizenTab = "create"; state.createStep = 1; state.gpsErrorMode = false;
        window.App.selectSample("flood_night");
      } else if (name === "senior") {
        state.seniorMode = true; state.seniorPage = "home"; state.createStep = 1; render();
      } else if (name === "error_blur") {
        state.seniorMode = false; state.citizenTab = "create"; state.createStep = 1;
        window.App.selectSample("blurry_error");
      } else if (name === "error_gps") {
        state.seniorMode = false; state.citizenTab = "create"; state.createStep = 2; state.gpsErrorMode = true; render();
      } else if (name === "empty") {
        state.seniorMode = false; state.citizenTab = "map"; state.mapFilter = "empty_kp6"; render();
      }
    }
  };

  window.addEventListener("DOMContentLoaded", render);
})();
