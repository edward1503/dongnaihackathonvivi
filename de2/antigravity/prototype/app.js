// TrấnBiên Trực Tuyến – Interactive Offline Prototype Engine
(function () {
  const state = {
    viewMode: "split", // citizen | volunteer | officer | split
    seniorMode: false,
    seniorPage: "home", // home | create | mine
    citizenTab: "map", // map | create | mine
    mapFilter: "all", // all | rac_thai | den_duong | ngap_nuoc | mat_duong | empty_kp6
    selectedMapPinId: "TB-1162",

    // Create 3-step state
    selectedSampleId: "pothole_clear",
    customPhotoUrl: null,
    selectedCategory: "mat_duong",
    customDesc: window.PHOTO_SAMPLES[0].suggestedDesc,
    gpsErrorMode: false,
    manualStreet: window.STREETS_TRAN_BIEN[0],
    manualHouseNo: "Số 142 (gần cổng trường)",
    showDuplicateSheet: false,

    // Mine, Detail & Review state
    detailModalId: null,
    reviewModalId: null,
    sliderPos: 50,
    tempRating: 5,
    tempTags: ["⚡ Xử lý nhanh", "✨ Dọn rất sạch"],
    tempComment: "",

    // Volunteer state
    volunteerAssistedMode: false,

    // Officer dashboard state
    officerFilter: "all",
    selectedOfficerId: "TB-1162",
    assignDept: "Ban Quản lý Duy tu Giao thông Đô thị",
    assignSla: "48 giờ (Hạn: 09:00 26/11/2026)",
    showCompleteModal: false,
    afterResolutionNote: "Đã thảm nhựa nóng mặt đường phẳng đẹp, lu lèn đảm bảo an toàn giao thông.",

    // Live data
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
    }, 3400);
  }

  function renderToast() {
    const el = document.getElementById("toast-root");
    if (!el) return;
    el.innerHTML = state.toastMsg ? `<div class="toast">✅ ${state.toastMsg}</div>` : "";
  }

  // Realistic offline street photos (./assets/*.jpg) + AI Vision overlay
  function renderSceneSVG(type, isAfter) {
    let imgSrc = "./assets/pothole_before.jpg";
    let badgeText = "✨ AI: Ổ gà đọng nước";
    let badgeBg = "rgba(220,38,38,0.9)";
    let showBox = !isAfter;
    let boxColor = "#ef4444";

    if (type === "blurry_error") {
      imgSrc = "./assets/blurry_error.jpg";
      badgeText = "⚠️ Ảnh tối & rung nhòe (Độ tin cậy 38%)";
      badgeBg = "rgba(185,28,28,0.92)";
      showBox = false;
    } else if (type === "rac_thai") {
      imgSrc = isAfter ? "./assets/trash_after.jpg" : "./assets/trash_before.jpg";
      badgeText = isAfter ? "✓ Đã thu dọn sạch vỉa hè" : "✨ AI: Rác thải tự phát";
      badgeBg = isAfter ? "rgba(21,128,61,0.9)" : "rgba(220,38,38,0.88)";
    } else if (type === "den_duong") {
      imgSrc = isAfter ? "./assets/streetlight_after.jpg" : "./assets/streetlight_before.jpg";
      badgeText = isAfter ? "✓ Đã thay đèn LED sáng" : "✨ AI: Trụ đèn tắt tối";
      badgeBg = isAfter ? "rgba(21,128,61,0.9)" : "rgba(217,119,6,0.9)";
      boxColor = "#facc15";
    } else if (type === "ngap_nuoc" || type === "flood_night") {
      imgSrc = isAfter ? "./assets/flood_after.jpg" : "./assets/flood_before.jpg";
      badgeText = isAfter ? "✓ Đã khơi thông khô ráo" : "⚠️ AI: Ngập miệng cống (68%)";
      badgeBg = isAfter ? "rgba(21,128,61,0.9)" : "rgba(217,119,6,0.92)";
      boxColor = "#facc15";
    } else {
      imgSrc = isAfter ? "./assets/pothole_after.jpg" : "./assets/pothole_before.jpg";
      badgeText = isAfter ? "✓ Đã thảm nhựa phẳng đẹp" : "✨ AI: Ổ gà mặt đường (92%)";
      badgeBg = isAfter ? "rgba(21,128,61,0.9)" : "rgba(220,38,38,0.88)";
    }

    return `
      <div style="position:relative;width:100%;height:100%;overflow:hidden;background:#0f172a;">
        <img src="${imgSrc}" alt="${badgeText}" style="width:100%;height:100%;object-fit:cover;display:block;" />
        ${
          showBox
            ? `<div style="position:absolute;left:22%;top:26%;width:56%;height:54%;border:2px dashed ${boxColor};border-radius:8px;box-shadow:0 0 0 999px rgba(0,0,0,0.12);pointer-events:none;"></div>`
            : ""
        }
        <div style="position:absolute;bottom:8px;left:8px;background:${badgeBg};color:#fff;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.35);">
          ${badgeText}
        </div>
      </div>
    `;
  }

  function statusBadgeHTML(st) {
    if (st === "new") return `<span class="status-tag st-new">🔴 Mới tiếp nhận</span>`;
    if (st === "verify") return `<span class="status-tag st-verify">🟠 Chờ Đoàn viên xác minh</span>`;
    if (st === "progress") return `<span class="status-tag st-progress">🔵 Đang xử lý</span>`;
    return `<span class="status-tag st-done">🟢 Đã xử lý xong</span>`;
  }

  function catLabel(cat) {
    const info = state.stats.byCategory[cat];
    return info ? `${info.icon} ${info.label}` : "Chưa xác định";
  }

  // ==================== CITIZEN PHONE ====================
  function renderCitizenPhone() {
    const myCount = state.reports.filter(r => r.mine).length;
    let bodyHTML = "";

    if (state.seniorMode) {
      if (state.seniorPage === "create") {
        bodyHTML = renderSeniorCreateScreen();
      } else if (state.seniorPage === "mine") {
        bodyHTML = renderCitizenMineTab();
      } else {
        bodyHTML = renderSeniorScreen();
      }
    } else if (state.citizenTab === "map") {
      bodyHTML = renderCitizenMapTab();
    } else if (state.citizenTab === "create") {
      bodyHTML = renderCitizenCreateTab();
    } else {
      bodyHTML = renderCitizenMineTab();
    }

    const dupSheet = state.showDuplicateSheet ? renderDuplicateSheet() : "";
    const detailModal = state.detailModalId ? renderReportDetailModal() : "";
    const reviewModal = state.reviewModalId ? renderReviewModal() : "";

    const bottomNavHTML = state.seniorMode
      ? `
        <div class="bottom-nav">
          <button class="nav-item ${state.seniorPage === "home" ? "active" : ""}" onclick="App.seniorGoHome()">
            <span>🏠 Trang chính</span>
          </button>
          <button class="nav-item ${state.seniorPage === "create" ? "active" : ""}" onclick="App.seniorGoCreate()">
            <span>📷 Báo sự cố</span>
          </button>
          <button class="nav-item ${state.seniorPage === "mine" ? "active" : ""}" onclick="App.seniorGoMine()">
            <span>📋 Đã báo (${myCount})</span>
          </button>
        </div>
      `
      : `
        <div class="bottom-nav">
          <button class="nav-item ${state.citizenTab === "map" ? "active" : ""}" onclick="App.setCitizenTab('map')">
            <span>🗺️</span>
            <span>Quanh tôi</span>
          </button>
          <button class="nav-item ${state.citizenTab === "create" ? "active" : ""}" onclick="App.setCitizenTab('create')">
            <span class="nav-cta">📷 + Gửi 3 bước</span>
          </button>
          <button class="nav-item ${state.citizenTab === "mine" ? "active" : ""}" onclick="App.setCitizenTab('mine')">
            <span class="badge-dot">${myCount}</span>
            <span>📋</span>
            <span>Của tôi</span>
          </button>
        </div>
      `;

    return `
      <div class="phone-frame ${state.seniorMode ? "senior-mode" : ""}">
        <div class="phone-statusbar">
          <span>09:30</span>
          <div class="phone-notch"></div>
          <span>5G • 94%</span>
        </div>
        <div class="app-header">
          <div>
            <div class="app-brand-title">🏛️ TrấnBiên Trực Tuyến</div>
            <div class="app-brand-loc">📍 Khu phố 2, P. Trấn Biên, Đồng Nai</div>
          </div>
          <button class="senior-toggle ${state.seniorMode ? "on" : ""}" onclick="App.toggleSenior()">
            👁️ ${state.seniorMode ? "Chữ lớn: BẬT" : "Chữ lớn"}
          </button>
        </div>

        <div class="phone-body">
          ${bodyHTML}
          ${dupSheet}
          ${detailModal}
          ${reviewModal}
        </div>

        ${bottomNavHTML}
      </div>
    `;
  }

  // MH-04: Senior Mode Home
  function renderSeniorScreen() {
    const doneMine = state.reports.filter(r => r.mine && r.status === "done").length;
    return `
      <div class="section-pad">
        <div style="background:#fef9c3;border:2px solid #ca8a04;border-radius:14px;padding:12px;margin-bottom:14px;font-size:16.5px;font-weight:700;color:#713f12;line-height:1.4;">
          👋 Xin chào Bác! Đây là chế độ <u>Chữ Lớn dễ đọc</u>. Bác chỉ cần chạm vào 1 trong 3 nút dưới đây:
        </div>

        <button class="senior-btn" style="background:#fef2f2;color:#991b1b;border-color:#dc2626;" onclick="App.seniorGoCreate()">
          1. 📷 CHỤP ẢNH BÁO SỰ CỐ
          <small>Báo đèn đường tắt, ổ gà, ngập nước, rác thải (Hệ thống tự điền giúp Bác)</small>
        </button>

        <button class="senior-btn" style="background:#eff6ff;color:#1e3a8a;border-color:#1d4ed8;" onclick="App.seniorGoMine()">
          2. 📋 XEM VIỆC BÁC ĐÃ BÁO
          <small>Hiện có ${doneMine} phản ánh Phường đã sửa xong, mời Bác xem ảnh!</small>
        </button>

        <button class="senior-btn" style="background:#f0fdf4;color:#14532d;border-color:#16a34a;" onclick="App.callVolunteerSupport()">
          3. 🤝 NHỜ ĐOÀN VIÊN HỖ TRỢ
          <small>Nhắn Đội Thanh niên Tình nguyện Khu phố 2 đến chụp và báo giúp</small>
        </button>
      </div>
    `;
  }

  // MH-04B: Senior Mode Simplified 3-Step Create (Chữ lớn xuyên suốt, bỏ mọi thành phần thừa)
  function renderSeniorCreateScreen() {
    const sample = window.PHOTO_SAMPLES.find(s => s.id === state.selectedSampleId) || window.PHOTO_SAMPLES[0];
    const conf = sample.confidence >= 60 ? sample.confidence : 92;
    const activeSample = sample.confidence >= 60 ? sample : window.PHOTO_SAMPLES[0];
    const categories = ["mat_duong", "den_duong", "ngap_nuoc", "rac_thai"];

    return `
      <div class="section-pad">
        <button class="btn-outline" style="font-size:16px;font-weight:700;border-width:2px;margin-bottom:12px;text-align:left;" onclick="App.seniorGoHome()">
          ← Quay về Trang chính
        </button>

        <div style="border:2px solid #94a3b8;border-radius:16px;padding:12px;margin-bottom:12px;background:#fff;">
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:8px;">1. Ảnh sự cố Bác vừa chụp</div>
          <div style="height:155px;border-radius:12px;overflow:hidden;border:2px solid #cbd5e1;margin-bottom:10px;">
            ${
              state.customPhotoUrl
                ? `<img src="${state.customPhotoUrl}" style="width:100%;height:100%;object-fit:cover;" alt="Ảnh Bác chụp"/>`
                : renderSceneSVG(activeSample.category, false)
            }
          </div>
          <label style="display:block;text-align:center;background:#eff6ff;border:2px solid #1d4ed8;color:#1e3a8a;padding:10px;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;">
            📷 Chụp lại / Chọn ảnh khác
            <input type="file" accept="image/*" style="display:none" onchange="App.handleFileUpload(event)"/>
          </label>

          <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:10px 12px;margin-top:10px;display:flex;align-items:center;gap:12px;">
            <div style="font-size:26px;font-weight:700;color:#15803d;padding-right:10px;border-right:2px solid #bbf7d0;">${conf}%</div>
            <div style="font-size:15.5px;font-weight:700;color:#14532d;line-height:1.35;">
              Máy đã nhận ra sự cố &amp; chọn sẵn ô bên dưới giúp Bác!
            </div>
          </div>
        </div>

        <div style="border:2px solid #94a3b8;border-radius:16px;padding:12px;margin-bottom:12px;background:#fff;">
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:4px;">2. Vị trí tự động</div>
          <div style="font-size:16.5px;color:#1e3a8a;font-weight:700;">📍 ${activeSample.address}</div>
        </div>

        <div style="border:2px solid #94a3b8;border-radius:16px;padding:12px;margin-bottom:12px;background:#fff;">
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:8px;">3. Loại sự cố (Chạm nếu muốn đổi)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
            ${categories.map(cat => {
              const info = state.stats.byCategory[cat];
              const isSelected = state.selectedCategory === cat;
              return `
                <button onclick="App.selectCategory('${cat}')" style="padding:12px 10px;border-radius:12px;text-align:left;cursor:pointer;font-size:16px;font-weight:700;border:${isSelected ? "3px solid #1d4ed8" : "2px solid #cbd5e1"};background:${isSelected ? "#eff6ff" : "#fff"};color:${isSelected ? "#1e3a8a" : "#0f172a"};">
                  <div style="font-size:24px;margin-bottom:4px;">${info.icon}</div>
                  <div>${info.label}</div>
                </button>
              `;
            }).join("")}
          </div>

          <button class="btn-primary" style="font-size:19px;padding:16px;border-radius:14px;background:#dc2626;" onclick="App.submitReportStep()">
            🚀 GỬI BÁO PHƯỜNG NGAY
          </button>
        </div>
      </div>
    `;
  }

  // MH-01: Map Around Me + Empty State
  function renderCitizenMapTab() {
    const s = state.stats;
    const pct = Math.round((s.resolved / s.total) * 1000) / 10;

    const filtered = state.mapFilter === "empty_kp6"
      ? []
      : state.reports.filter(r => state.mapFilter === "all" || r.category === state.mapFilter);

    const selected = filtered.find(r => r.id === state.selectedMapPinId) || filtered[0] || null;

    const pinsSVG = filtered.map(r => {
      const fill = r.status === "done" ? "#16a34a" : (r.status === "new" ? "#dc2626" : "#d97706");
      const isSel = selected && selected.id === r.id;
      return `
        <g class="pin-btn" onclick="App.selectPin('${r.id}')" transform="translate(${r.x}, ${r.y})">
          ${isSel ? `<circle cx="0" cy="0" r="20" fill="${fill}" opacity="0.25"/>` : ""}
          <circle cx="0" cy="0" r="${isSel ? 13 : 10}" fill="${fill}" stroke="#ffffff" stroke-width="2.5"/>
          <text x="0" y="4" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">${r.supporters > 1 ? r.supporters : "•"}</text>
        </g>
      `;
    }).join("");

    return `
      <div class="kpi-strip">
        <span class="kpi-pill">P. Trấn Biên: <strong>${s.total} đơn</strong></span>
        <span class="kpi-pill">Đã xử lý: <strong style="color:#16a34a">${s.resolved} (${pct}%)</strong></span>
        <span class="kpi-pill">TB: <strong>${s.avgDays} ngày</strong></span>
      </div>

      <div class="chip-scroll">
        <button class="chip ${state.mapFilter === "all" ? "active" : ""}" onclick="App.setMapFilter('all')">Tất cả (${s.total})</button>
        <button class="chip ${state.mapFilter === "rac_thai" ? "active" : ""}" onclick="App.setMapFilter('rac_thai')">🗑️ Rác (${s.byCategory.rac_thai.count})</button>
        <button class="chip ${state.mapFilter === "den_duong" ? "active" : ""}" onclick="App.setMapFilter('den_duong')">💡 Đèn (${s.byCategory.den_duong.count})</button>
        <button class="chip ${state.mapFilter === "ngap_nuoc" ? "active" : ""}" onclick="App.setMapFilter('ngap_nuoc')">🌊 Ngập (${s.byCategory.ngap_nuoc.count})</button>
        <button class="chip ${state.mapFilter === "mat_duong" ? "active" : ""}" onclick="App.setMapFilter('mat_duong')">🚧 Đường (${s.byCategory.mat_duong.count})</button>
        <button class="chip ${state.mapFilter === "empty_kp6" ? "active" : ""}" onclick="App.setMapFilter('empty_kp6')">🌿 KP.6 (Trống)</button>
      </div>

      <div class="map-container">
        <svg viewBox="0 0 380 360" width="100%" height="100%">
          <rect width="380" height="360" fill="#e5eef7"/>
          <rect x="20" y="25" width="110" height="75" rx="8" fill="#dcfce7"/>
          <rect x="255" y="205" width="105" height="90" rx="8" fill="#dcfce7"/>
          <path d="M0 295 Q120 270 220 325 T380 340 L380 360 L0 360 Z" fill="#bae6fd"/>
          <text x="85" y="342" fill="#0369a1" font-size="10" font-weight="bold">Sông Đồng Nai</text>
          <!-- Streets -->
          <line x1="0" y1="150" x2="380" y2="150" stroke="#ffffff" stroke-width="14"/>
          <line x1="195" y1="0" x2="195" y2="310" stroke="#ffffff" stroke-width="12"/>
          <line x1="35" y1="50" x2="345" y2="270" stroke="#ffffff" stroke-width="10"/>
          <line x1="70" y1="240" x2="350" y2="95" stroke="#f8fafc" stroke-width="8"/>
          <text x="95" y="145" fill="#475569" font-size="9.5" font-weight="bold">Đ. Hưng Đạo Vương</text>
          <text x="202" y="75" fill="#475569" font-size="9.5" font-weight="bold">Đ. Nguyễn Ái Quốc</text>
          <text x="52" y="222" fill="#64748b" font-size="9">Hẻm Hà Huy Tập</text>
          <text x="262" y="232" fill="#166534" font-size="9" font-weight="bold">TH Tiểu học Trấn Biên</text>

          <!-- User Current Location -->
          <circle cx="172" cy="168" r="16" fill="#2563eb" opacity="0.2"/>
          <circle cx="172" cy="168" r="6" fill="#2563eb" stroke="#fff" stroke-width="2"/>
          ${pinsSVG}
        </svg>

        <div class="map-legend">
          <span><i class="dot dot-red"></i>Chờ xử lý</span>
          <span><i class="dot dot-amber"></i>Đang sửa</span>
          <span><i class="dot dot-green"></i>Đã xong</span>
        </div>
      </div>

      <div class="section-pad">
        ${
          filtered.length === 0
            ? `<div class="card" style="text-align:center;padding:22px 14px;border:1.5px dashed #86efac;background:#f0fdf4;">
                <div style="font-size:32px;margin-bottom:6px;">🌿</div>
                <div style="font-weight: 700;color:#166534;font-size:14px;">Khu phố 6 hiện không có sự cố tồn đọng!</div>
                <p style="font-size:12px;color:#15803d;margin:6px 0 12px;">Bán kính 500m quanh khu vực này sạch đẹp, hạ tầng ổn định. Cảm ơn bà con đã chung tay giám sát đô thị.</p>
                <button class="btn-outline" onclick="App.setMapFilter('all')">Xem lại toàn Phường Trấn Biên</button>
              </div>`
            : `<div class="card" style="margin-bottom:0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  ${statusBadgeHTML(selected.status)}
                  <span style="font-size:11px;color:#64748b;font-weight:600;">#${selected.id} • Cách bạn ${selected.distance}</span>
                </div>
                <div style="font-weight: 700;font-size:14px;margin-bottom:4px;">${selected.title}</div>
                <div style="font-size:12px;color:#475569;margin-bottom:8px;">📍 ${selected.address} • 👥 <strong>${selected.supporters} người dân</strong> phản ánh</div>
                <div style="display:flex;gap:8px;">
                  ${
                    selected.status === "done"
                      ? `<button class="btn-primary" style="padding:9px;font-size:12.5px;background:#16a34a;" onclick="App.openReview('${selected.id}')">✨ Xem ảnh Trước/Sau &amp; Đánh giá (${selected.rating}★)</button>`
                      : `<button class="btn-outline" style="padding:8px;font-size:12px;" onclick="App.supportExisting('${selected.id}')">👍 +1 Đồng tình thúc đẩy (${selected.supporters})</button>`
                  }
                </div>
              </div>`
        }
      </div>
    `;
  }

  // MH-02 + MH-03 + MH-10 (Error States)
  function renderCitizenCreateTab() {
    const sample = window.PHOTO_SAMPLES.find(s => s.id === state.selectedSampleId) || window.PHOTO_SAMPLES[0];
    const conf = sample.confidence;
    const isLow = conf < 60;
    const isMed = conf >= 60 && conf < 85;
    const barColor = isLow ? "#dc2626" : (isMed ? "#d97706" : "#16a34a");
    const aiClass = isLow ? "low" : (isMed ? "medium" : "");

    const categories = ["mat_duong", "den_duong", "ngap_nuoc", "rac_thai"];

    return `
      <div class="stepper">
        <div class="step-pill done">1. Chụp ảnh ✓</div>
        <div class="step-pill ${state.gpsErrorMode ? "active" : "done"}">2. Vị trí ${state.gpsErrorMode ? "⚠️" : "✓"}</div>
        <div class="step-pill active">3. Chọn loại</div>
      </div>

      <div class="section-pad">
        <!-- Bước 1: Ảnh & AI -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-weight: 700;font-size:13px;">Bước 1: Ảnh hiện trường</span>
            <label style="font-size:11.5px;color:#1d4ed8;font-weight:700;cursor:pointer;">
              📁 Tải ảnh thật từ máy <input type="file" accept="image/*" style="display:none" onchange="App.handleFileUpload(event)"/>
            </label>
          </div>

          <select class="form-control" style="margin-bottom:8px;font-size:12px;" onchange="App.selectSample(this.value)">
            ${window.PHOTO_SAMPLES.map(p => `<option value="${p.id}" ${p.id === state.selectedSampleId ? "selected" : ""}>${p.name}</option>`).join("")}
          </select>

          <div style="height:145px;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;background:#0f172a;">
            ${
              state.customPhotoUrl
                ? `<img src="${state.customPhotoUrl}" style="width:100%;height:100%;object-fit:cover;" alt="Uploaded"/>`
                : renderSceneSVG(sample.id === "blurry_error" ? "blurry_error" : sample.category, false)
            }
          </div>

          <!-- Hộp Độ tin cậy AI (Bố cục 2 cột gọn sạch: Số lớn bên trái | Dấu hiệu bên phải) -->
          <div class="ai-box ${aiClass}">
            <div class="ai-split">
              <div class="ai-score-col">
                <div class="ai-score-num" style="color:${barColor};">${conf}%</div>
                <div class="ai-score-lbl" style="color:${barColor};">${isLow ? "Tin cậy thấp" : isMed ? "Trung bình" : "Tin cậy cao"}</div>
              </div>
              <div class="ai-evidence-col">
                <div style="font-size:11.5px;font-weight:700;color:#0f172a;">✨ Dấu hiệu AI phát hiện:</div>
                <div class="ai-ev-chips">
                  ${sample.evidence.map(e => `<span class="ai-ev-chip">${e}</span>`).join("")}
                </div>
              </div>
            </div>
            ${
              isLow
                ? `<div style="font-size:11.5px;color:#991b1b;font-weight:600;margin-top:8px;padding-top:7px;border-top:1px dashed #fca5a5;">
                    ⚠️ Ảnh quá mờ/tối. Bác vui lòng bật Flash hoặc đứng gần hơn để chụp lại nhé!
                    <button class="btn-outline" style="margin-top:6px;padding:7px;border-color:#dc2626;color:#dc2626;" onclick="App.selectSample('pothole_clear')">📷 Chụp lại ảnh rõ nét</button>
                  </div>`
                : isMed
                  ? `<div style="font-size:11.5px;color:#92400e;font-weight:600;margin-top:8px;padding-top:7px;border-top:1px dashed #fcd34d;">
                      ℹ️ Ảnh chụp đêm chưa rõ 100% &rarr; Đơn sẽ chuyển <strong>Đoàn viên Khu phố xác minh tại chỗ</strong>.
                    </div>`
                  : `<div style="font-size:11px;color:#15803d;font-weight:600;margin-top:7px;padding-top:6px;border-top:1px solid #e2e8f0;">
                      ✓ Đã tự động chọn loại sự cố &amp; điền mô tả gợi ý bên dưới.
                    </div>`
            }
          </div>
        </div>

        <!-- Bước 2: Vị trí trên bản đồ / Fallback mất GPS -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-weight: 700;font-size:13px;">Bước 2: Vị trí trên bản đồ</span>
            <button style="font-size:11px;border:none;background:#f1f5f9;padding:3px 8px;border-radius:6px;cursor:pointer;color:#475569;" onclick="App.toggleGpsError()">
              ${state.gpsErrorMode ? "🔄 Bật lại GPS tự động" : "🧪 Thử lỗi mất GPS"}
            </button>
          </div>
          ${
            state.gpsErrorMode
              ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:10px;">
                  <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;">📍 Không lấy được sóng GPS – Chọn nhanh tên đường:</div>
                  <select class="form-control" style="margin-bottom:6px;font-size:12px;" onchange="App.setManualStreet(this.value)">
                    ${window.STREETS_TRAN_BIEN.map(st => `<option value="${st}" ${st === state.manualStreet ? "selected" : ""}>${st}</option>`).join("")}
                  </select>
                  <input class="form-control" style="font-size:12px;" value="${state.manualHouseNo}" oninput="App.setManualHouse(this.value)" placeholder="Nhập số nhà / mốc nhận biết (VD: đối diện chợ)"/>
                </div>`
              : `<div style="display:flex;align-items:center;gap:10px;background:#f8fafc;padding:8px 10px;border-radius:10px;border:1px solid #cbd5e1;">
                  <div style="font-size:22px;">📌</div>
                  <div style="flex:1;">
                    <div style="font-size:12.5px;font-weight:700;">${sample.address}</div>
                    <div style="font-size:11px;color:#16a34a;font-weight:600;">✓ Định vị GPS chính xác (±8m) ${sample.duplicateId ? "• Phát hiện 1 sự cố cách 18m" : ""}</div>
                  </div>
                </div>`
          }
        </div>

        <!-- Bước 3: Chọn loại & Gửi -->
        <div class="card">
          <div style="font-weight: 700;font-size:13px;">Bước 3: Chọn loại sự cố</div>
          <div class="cat-grid">
            ${categories.map(cat => {
              const info = state.stats.byCategory[cat];
              const isSelected = state.selectedCategory === cat;
              const isAiPick = !isLow && sample.category === cat;
              return `
                <button class="cat-tile ${isSelected ? "selected" : ""}" onclick="App.selectCategory('${cat}')">
                  ${isAiPick ? `<span class="cat-ai-badge">✨ AI chọn</span>` : ""}
                  <div style="font-size:20px;margin-bottom:3px;">${info.icon}</div>
                  <div>${info.label}</div>
                </button>
              `;
            }).join("")}
          </div>

          <label class="form-label" style="margin-top:10px;">Ghi chú ngắn (AI đã điền hộ – không bắt buộc gõ):</label>
          <textarea class="form-control" rows="2" style="font-size:12px;margin-bottom:10px;" oninput="App.setDesc(this.value)">${state.customDesc}</textarea>

          <button class="btn-primary" ${isLow ? "disabled style='opacity:0.45;cursor:not-allowed;'" : ""} onclick="App.submitReportStep()">
            🚀 Gửi phản ánh về UBND Phường
          </button>
        </div>
      </div>
    `;
  }

  // MH-03: Duplicate Detection Sheet (<= 50m)
  function renderDuplicateSheet() {
    const dup = state.reports.find(r => r.id === "TB-1162") || state.reports[0];
    return `
      <div class="sheet-backdrop">
        <div class="sheet-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span class="status-tag st-verify">📡 Phát hiện trùng vị trí (cách 18m)</span>
            <button style="border:none;background:none;font-size:18px;cursor:pointer;" onclick="App.closeDupSheet()">✕</button>
          </div>
          <div style="font-size:15px;font-weight: 700;margin-bottom:6px;">Đã có ${dup.supporters} hàng xóm báo sự cố này!</div>
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:10px;margin-bottom:10px;font-size:12.5px;">
            <strong>#${dup.id}: ${dup.title}</strong>
            <div style="color:#475569;margin-top:3px;">📍 ${dup.address}</div>
            <div style="color:#0369a1;font-weight:700;margin-top:4px;">✓ Đoàn viên KP.2 đã xác minh tại chỗ</div>
          </div>
          <p style="font-size:12px;color:#475569;margin-bottom:12px;">
            Bấm <strong>+1 Đồng tình</strong> giúp gộp chung hồ sơ và đẩy sự cố này lên <strong>Ưu tiên Cao</strong> trên màn hình Phường!
          </p>
          <button class="btn-primary" style="margin-bottom:8px;" onclick="App.mergeIntoExisting('${dup.id}')">
            👍 +1 Đồng tình &amp; Đính kèm thêm ảnh của tôi
          </button>
          <button class="btn-outline" onclick="App.forceCreateNew()">
            Đây là vị trí khác – Vẫn tạo phản ánh mới
          </button>
        </div>
      </div>
    `;
  }

  // MH-05: Track My Reports (Danh sách tối giản: chỉ hiện Status, Tiêu đề và 1 nút Chi tiết)
  function renderCitizenMineTab() {
    const myReports = state.reports.filter(r => r.mine);
    return `
      <div class="section-pad">
        ${
          state.seniorMode
            ? `<button class="btn-outline" style="font-size:16px;font-weight:700;border-width:2px;margin-bottom:12px;text-align:left;" onclick="App.seniorGoHome()">
                ← Quay về Trang chính
              </button>`
            : ""
        }
        <div style="font-weight:700;font-size:${state.seniorMode ? "19px" : "14.5px"};margin-bottom:10px;">
          📋 Phản ánh của tôi (${myReports.length})
        </div>
        ${myReports.map(r => `
          <div class="report-list-card">
            <div class="report-list-main">
              <div>${statusBadgeHTML(r.status)}</div>
              <div class="report-list-title">${r.title}</div>
            </div>
            <button class="btn-detail" onclick="App.openDetail('${r.id}')">
              Chi tiết &rarr;
            </button>
          </div>
        `).join("")}
      </div>
    `;
  }

  // Modal Chi tiết tiến độ 4 bước (Mở khi bấm nút "Chi tiết ->" trên từng phản ánh)
  function renderReportDetailModal() {
    const r = state.reports.find(x => x.id === state.detailModalId);
    if (!r) return "";
    return `
      <div class="sheet-backdrop">
        <div class="sheet-card" style="max-height:90%;overflow-y:auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            ${statusBadgeHTML(r.status)}
            <button style="border:none;background:#f1f5f9;width:32px;height:32px;border-radius:99px;font-size:16px;font-weight:700;cursor:pointer;" onclick="App.closeDetail()">✕</button>
          </div>

          <div style="font-weight:700;font-size:${state.seniorMode ? "19px" : "15px"};margin-bottom:4px;">${r.title}</div>
          <div style="font-size:${state.seniorMode ? "15.5px" : "12px"};color:#475569;margin-bottom:10px;">
            Mã <strong>#${r.id}</strong> • 📍 ${r.address} • 👥 ${r.supporters} người đồng tình
          </div>

          <div style="height:135px;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;margin-bottom:10px;">
            ${renderSceneSVG(r.category, r.status === "done")}
          </div>

          <div style="font-weight:700;font-size:${state.seniorMode ? "16.5px" : "12.5px"};color:#1e3a8a;margin-bottom:4px;">Tiến độ xử lý tại Phường:</div>
          <div class="timeline">
            <div class="tl-item done">
              <span class="tl-dot"></span>
              <strong>Đã tiếp nhận:</strong> ${r.createdAt} (AI tin cậy ${r.aiConfidence}%)
            </div>
            <div class="tl-item ${r.volunteerVerified ? "done" : "current"}">
              <span class="tl-dot"></span>
              <strong>Đoàn viên xác minh:</strong> ${r.volunteerVerified ? (r.volunteerNote || "Đã xác nhận đúng hiện trạng") : "Đang chờ Đội TNTN kiểm tra thực địa"}
            </div>
            <div class="tl-item ${r.status === "progress" ? "current" : (r.status === "done" ? "done" : "")}">
              <span class="tl-dot"></span>
              <strong>Giao xử lý &amp; Hạn SLA:</strong> ${r.department || "Chờ phân công"} (${r.sla})
            </div>
            <div class="tl-item ${r.status === "done" ? "done" : ""}">
              <span class="tl-dot"></span>
              <strong>Kết quả nghiệm thu:</strong> ${r.status === "done" ? "Đã có ảnh Sau xử lý!" : "Chờ hoàn thành"}
            </div>
          </div>

          ${
            r.status === "done"
              ? `<button class="btn-primary" style="margin-top:8px;background:#16a34a;font-size:${state.seniorMode ? "17px" : "13.5px"};" onclick="App.openReview('${r.id}')">
                  🌟 Kéo xem Ảnh Trước/Sau &amp; Đánh giá (${r.rating ? r.rating + "★" : "Chưa đánh giá"})
                </button>`
              : `<button class="btn-outline" style="margin-top:8px;font-size:${state.seniorMode ? "16px" : "13px"};" onclick="App.closeDetail()">Đóng cửa sổ</button>`
          }
        </div>
      </div>
    `;
  }

  // MH-06: Before / After Comparison & 1-5 Star Citizen Satisfaction
  function renderReviewModal() {
    const r = state.reports.find(x => x.id === state.reviewModalId);
    if (!r) return "";
    const tagOptions = ["⚡ Xử lý nhanh", "✨ Dọn rất sạch", "👍 Cán bộ nhiệt tình", "⚠️ Lo ngại tái diễn"];
    return `
      <div class="sheet-backdrop">
        <div class="sheet-card" style="max-height:92%;overflow-y:auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span class="status-tag st-done">🟢 Đã khắc phục xong (#${r.id})</span>
            <button style="border:none;background:none;font-size:18px;cursor:pointer;" onclick="App.closeReview()">✕</button>
          </div>
          <div style="font-weight: 700;font-size:14.5px;margin-bottom:8px;">${r.title}</div>

          <div style="font-size:11.5px;font-weight:700;color:#1d4ed8;margin-bottom:4px;">↔ Kéo thanh trượt để đối chiếu Ảnh Trước &amp; Sau xử lý:</div>
          <div class="ba-wrap">
            <div class="ba-layer">${renderSceneSVG(r.category, true)}</div>
            <div class="ba-before-clip" style="width:${state.sliderPos}%;">
              <div style="width:360px;height:175px;">${renderSceneSVG(r.category, false)}</div>
            </div>
            <span class="ba-label left">TRƯỚC XỬ LÝ</span>
            <span class="ba-label right">SAU XỬ LÝ</span>
          </div>
          <input type="range" min="5" max="95" value="${state.sliderPos}" style="width:100%;margin:8px 0;" oninput="App.setSlider(this.value)"/>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:8px 10px;font-size:12px;margin-bottom:10px;">
            <strong>🏛️ Kết quả từ ${r.department}:</strong><br/>
            ${r.afterNote || "Đã xử lý dứt điểm và dọn vệ sinh hiện trường."}
          </div>

          <div style="text-align:center;margin-bottom:8px;">
            <div style="font-size:12.5px;font-weight: 700;margin-bottom:4px;">Bác đánh giá mức độ hài lòng kết quả xử lý:</div>
            <div style="font-size:28px;letter-spacing:4px;cursor:pointer;">
              ${[1, 2, 3, 4, 5].map(n => `<span onclick="App.setTempRating(${n})" style="color:${n <= state.tempRating ? "#eab308" : "#cbd5e1"}">★</span>`).join("")}
            </div>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;justify-content:center;">
            ${tagOptions.map(t => {
              const on = state.tempTags.includes(t);
              return `<button class="chip ${on ? "active" : ""}" onclick="App.toggleRatingTag('${t}')">${t}</button>`;
            }).join("")}
          </div>

          <button class="btn-primary" onclick="App.saveReview('${r.id}')">Gửi đánh giá công khai</button>
        </div>
      </div>
    `;
  }

  // ==================== VOLUNTEER PHONE (MH-07) ====================
  function renderVolunteerPhone() {
    const needVerify = state.reports.filter(r => !r.volunteerVerified && r.status !== "done");
    return `
      <div class="phone-frame">
        <div class="phone-statusbar">
          <span>09:30</span>
          <div class="phone-notch"></div>
          <span>Đoàn viên • 5G</span>
        </div>
        <div class="app-header volunteer-header">
          <div>
            <div class="app-brand-title">🦺 Đội TNTN Phường Trấn Biên</div>
            <div class="app-brand-loc">Nguyễn Minh Khoa • Bí thư Chi đoàn KP.3 (14 ca xác minh)</div>
          </div>
        </div>
        <div class="phone-body">
          <div class="section-pad">
            <div class="card" style="background:#f0f9ff;border-color:#7dd3fc;">
              <div style="font-weight: 700;font-size:13px;color:#0369a1;">⚡ Nhiệm vụ thanh niên tình nguyện tại chỗ</div>
              <p style="font-size:11.5px;color:#0c4a6e;margin-top:3px;">
                Kiểm chứng nhanh các phản ánh gần khu phố hoặc có <strong>Độ tin cậy AI trung bình (60–84%)</strong> để lọc tin nhầm giúp UBND Phường.
              </p>
            </div>

            <div style="font-weight: 700;font-size:13.5px;margin:10px 0 8px;">📍 Sự cố cần xác minh gần tôi (${needVerify.length})</div>

            ${
              needVerify.length === 0
                ? `<div class="card" style="text-align:center;padding:20px;">
                    <div style="font-size:28px;">🎉</div>
                    <div style="font-weight: 700;color:#166534;margin-top:4px;">Đã xác minh hết sự cố trong Khu phố!</div>
                  </div>`
                : needVerify.map(r => `
                  <div class="card">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                      <span class="status-tag st-verify">⚠️ AI tin cậy: ${r.aiConfidence}%</span>
                      <span style="font-size:11px;color:#64748b;font-weight:700;">#${r.id} • Cách 150m</span>
                    </div>
                    <div style="font-weight: 700;font-size:13.5px;margin-bottom:4px;">${r.title}</div>
                    <div style="font-size:12px;color:#475569;margin-bottom:8px;">📍 ${r.address}</div>
                    <div style="height:110px;border-radius:8px;overflow:hidden;margin-bottom:8px;">
                      ${renderSceneSVG(r.category, false)}
                    </div>
                    <button class="btn-primary" style="background:#0284c7;padding:10px;font-size:12.5px;margin-bottom:6px;" onclick="App.volunteerVerify('${r.id}', true)">
                      ✓ Xác nhận ĐÚNG &amp; Khẩn cấp (Gần cổng trường học)
                    </button>
                    <button class="btn-outline" style="padding:8px;font-size:12px;" onclick="App.volunteerVerify('${r.id}', false)">
                      ✕ Báo nhầm / Sự cố đã tự hết
                    </button>
                  </div>
                `).join("")
            }

            <div class="card" style="margin-top:12px;border:1.5px dashed #0284c7;">
              <div style="font-weight: 700;font-size:13px;margin-bottom:4px;">🤝 Hỗ trợ Cô/Chú cao tuổi không có điện thoại</div>
              <p style="font-size:11.5px;color:#475569;margin-bottom:8px;">Chuyển sang biểu mẫu gửi phản ánh hộ người dân khi đi tuần tra khu phố.</p>
              <button class="btn-outline" style="border-color:#0284c7;color:#0284c7;font-weight:700;" onclick="App.switchToAssistedReport()">
                📷 Mở biểu mẫu Gửi hộ Người dân
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== OFFICER DESKTOP DASHBOARD (MH-08 & MH-09) ====================
  function renderOfficerDesktop() {
    const s = state.stats;
    const pct = Math.round((s.resolved / s.total) * 1000) / 10;
    const rated = state.reports.filter(r => r.rating > 0);
    const avgStar = rated.length
      ? (rated.reduce((acc, x) => acc + x.rating, 0) / rated.length).toFixed(1)
      : "4.8";

    const list = state.reports
      .filter(r => state.officerFilter === "all" || r.status === state.officerFilter)
      .slice()
      .sort((a, b) => b.supporters - a.supporters);

    const sel = state.reports.find(r => r.id === state.selectedOfficerId) || list[0] || state.reports[0];

    return `
      <div class="desktop-frame">
        <div class="desk-topbar">
          <div>
            <div style="font-size:16px;font-weight: 700;">🏛️ TRUNG TÂM ĐIỀU HÀNH PHẢN ÁNH HIỆN TRƯỜNG – UBND PHƯỜNG TRẤN BIÊN</div>
            <div style="font-size:12px;opacity:0.88;">Cán bộ trực tiếp nhận: Trần Văn Hùng (Công chức Địa chính – Đô thị) • Dữ liệu ${s.month}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <span style="background:rgba(255,255,255,0.16);padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;">🟢 Đồng bộ thời gian thực</span>
          </div>
        </div>

        <div class="desk-kpi-grid">
          <div class="desk-kpi">
            <div class="lbl">TỔNG PHẢN ÁNH (THÁNG 11)</div>
            <div class="num">${s.total}</div>
            <div class="sub">🗑️ ${s.byCategory.rac_thai.count} • 💡 ${s.byCategory.den_duong.count} • 🌊 ${s.byCategory.ngap_nuoc.count} • 🚧 ${s.byCategory.mat_duong.count}</div>
          </div>
          <div class="desk-kpi">
            <div class="lbl">ĐÃ XỬ LÝ CÔNG KHAI</div>
            <div class="num" style="color:#16a34a;">${s.resolved} <span style="font-size:14px;">(${pct}%)</span></div>
            <div class="sub">Còn ${s.total - s.resolved} hồ sơ đang điều phối</div>
          </div>
          <div class="desk-kpi">
            <div class="lbl">THỜI GIAN XỬ LÝ TRUNG BÌNH</div>
            <div class="num" style="color:#1d4ed8;">${s.avgDays} ngày</div>
            <div class="sub">Nhanh hơn 35% nhờ gộp cụm 50m</div>
          </div>
          <div class="desk-kpi">
            <div class="lbl">ĐÁNH GIÁ HÀI LÒNG DÂN</div>
            <div class="num" style="color:#ca8a04;">${avgStar} / 5.0 ★</div>
            <div class="sub">Minh bạch ảnh Trước &amp; Sau xử lý</div>
          </div>
        </div>

        <div class="desk-main">
          <!-- Bảng danh sách ưu tiên -->
          <div class="desk-table-wrap">
            <div style="padding:10px 12px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:13px;">Danh sách phản ánh (Ưu tiên theo cụm gộp trùng &amp; xác minh)</strong>
              <div style="display:flex;gap:4px;">
                ${[
                  ["all", "Tất cả"],
                  ["new", "Mới"],
                  ["progress", "Đang xử lý"],
                  ["done", "Đã xong"]
                ].map(([k, lbl]) => `<button class="chip ${state.officerFilter === k ? "active" : ""}" onclick="App.setOfficerFilter('${k}')">${lbl}</button>`).join("")}
              </div>
            </div>

            <table class="desk-table">
              <thead>
                <tr>
                  <th>Mã / Cụm</th>
                  <th>Nội dung &amp; Địa điểm</th>
                  <th>Độ tin cậy AI</th>
                  <th>Trạng thái / SLA</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(r => `
                  <tr class="${sel && sel.id === r.id ? "selected" : ""}" onclick="App.selectOfficerRow('${r.id}')">
                    <td>
                      <strong>#${r.id}</strong><br/>
                      ${r.supporters > 1 ? `<span style="background:#fee2e2;color:#991b1b;font-size:10.5px;font-weight: 700;padding:1px 6px;border-radius:99px;">🔥 Cụm ${r.supporters} dân</span>` : `<span style="font-size:11px;color:#64748b;">1 người báo</span>`}
                    </td>
                    <td>
                      <div style="font-weight:700;">${catLabel(r.category)}</div>
                      <div style="font-size:11.5px;color:#334155;">${r.address}</div>
                      ${r.volunteerVerified ? `<div style="font-size:10.5px;color:#0284c7;font-weight:700;">✓ Đoàn viên đã xác minh</div>` : ""}
                    </td>
                    <td>
                      <strong style="color:${r.aiConfidence >= 85 ? "#16a34a" : "#d97706"}">${r.aiConfidence}%</strong>
                    </td>
                    <td>
                      ${statusBadgeHTML(r.status)}
                      <div style="font-size:10.5px;color:#64748b;margin-top:3px;">${r.sla}</div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <!-- Cột phải: Giao xử lý & Nghiệm thu ảnh Sau xử lý (MH-08 & MH-09) -->
          <div class="desk-detail">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:14px;">Chi tiết điều phối #${sel.id}</strong>
              ${statusBadgeHTML(sel.status)}
            </div>

            <div style="height:125px;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;">
              ${renderSceneSVG(sel.category, sel.status === "done")}
            </div>

            <div style="font-size:12.5px;">
              <strong>${sel.title}</strong>
              <div style="color:#475569;margin-top:2px;">📍 ${sel.address} • 👥 Gộp từ <strong>${sel.supporters} lượt báo</strong></div>
              ${sel.volunteerNote ? `<div style="background:#f0f9ff;border-left:3px solid #0284c7;padding:5px 8px;margin-top:5px;font-size:11.5px;color:#0c4a6e;">🦺 <strong>Xác minh thực địa:</strong> ${sel.volunteerNote}</div>` : ""}
            </div>

            ${
              sel.status !== "done"
                ? `
                <div style="border-top:1px solid #e2e8f0;padding-top:8px;">
                  <label class="form-label">1. Phân loại &amp; Giao bộ phận chuyên trách:</label>
                  <select class="form-control" style="margin-bottom:8px;font-size:12px;" onchange="App.setAssignDept(this.value)">
                    <option ${state.assignDept.includes("Giao thông") ? "selected" : ""}>Ban Quản lý Duy tu Giao thông Đô thị</option>
                    <option ${state.assignDept.includes("Điện") ? "selected" : ""}>Đội Quản lý Điện chiếu sáng Đô thị</option>
                    <option ${state.assignDept.includes("Sonadezi") ? "selected" : ""}>Công ty CP Môi trường Đô thị Sonadezi</option>
                    <option ${state.assignDept.includes("Thoát nước") ? "selected" : ""}>Xí nghiệp Cấp thoát nước Đồng Nai</option>
                  </select>

                  <label class="form-label">2. Ấn định Hạn xử lý cam kết (SLA):</label>
                  <select class="form-control" style="margin-bottom:10px;font-size:12px;" onchange="App.setAssignSla(this.value)">
                    <option>24 giờ – Khẩn cấp (Hạn: 09:30 25/11/2026)</option>
                    <option selected>48 giờ – Tiêu chuẩn (Hạn: 09:30 26/11/2026)</option>
                    <option>72 giờ – Duy tu định kỳ (Hạn: 27/11/2026)</option>
                  </select>

                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button class="btn-primary" style="padding:10px;font-size:12.5px;" onclick="App.assignTicket('${sel.id}')">
                      📤 Giao bộ phận xử lý
                    </button>
                    <button class="btn-primary" style="padding:10px;font-size:12.5px;background:#16a34a;" onclick="App.toggleCompleteModal(true)">
                      📷 Cập nhật Ảnh Sau xử lý
                    </button>
                  </div>
                </div>

                ${
                  state.showCompleteModal
                    ? `<div style="background:#f0fdf4;border:1.5px solid #22c55e;border-radius:10px;padding:10px;margin-top:4px;">
                        <div style="font-size:12.5px;font-weight: 700;color:#166534;margin-bottom:6px;">📸 Nghiệm thu &amp; Công khai Ảnh Sau Xử Lý (MH-09)</div>
                        <div style="font-size:11px;color:#15803d;margin-bottom:6px;">✓ AI kiểm tra ảnh nghiệm thu: Khớp bối cảnh GPS (Độ tin cậy 95%) – Bề mặt đã khắc phục sạch.</div>
                        <textarea class="form-control" rows="2" style="font-size:12px;margin-bottom:8px;" oninput="App.setAfterNote(this.value)">${state.afterResolutionNote}</textarea>
                        <button class="btn-primary" style="background:#15803d;padding:9px;font-size:12.5px;" onclick="App.completeTicket('${sel.id}')">
                          ✅ Hoàn tất &amp; Bắn thông báo mời Dân đánh giá
                        </button>
                      </div>`
                    : ""
                }
                `
                : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px;font-size:12px;">
                    <strong style="color:#166534;">✓ Hồ sơ đã hoàn thành &amp; công khai minh bạch</strong>
                    <p style="margin-top:4px;color:#334155;">${sel.afterNote}</p>
                    <div style="margin-top:6px;font-weight:700;color:#ca8a04;">Đánh giá của người dân: ${sel.rating ? sel.rating + " ★" : "Chưa chấm sao"} ${sel.ratingTags.join(" • ")}</div>
                  </div>`
            }
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    // Update active buttons in top bar
    document.querySelectorAll("[data-view]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === state.viewMode);
    });

    const stage = document.getElementById("stage-root");
    if (!stage) return;

    if (state.viewMode === "citizen") {
      stage.innerHTML = renderCitizenPhone();
    } else if (state.viewMode === "volunteer") {
      stage.innerHTML = renderVolunteerPhone();
    } else if (state.viewMode === "officer") {
      stage.innerHTML = renderOfficerDesktop();
    } else {
      // Split view: Citizen Phone + Officer Desktop live side-by-side!
      stage.innerHTML = renderCitizenPhone() + renderOfficerDesktop();
    }
    renderToast();
  }

  // Public actions exposed to inline handlers
  window.App = {
    setView(mode) {
      state.viewMode = mode;
      render();
    },
    toggleSenior() {
      state.seniorMode = !state.seniorMode;
      state.seniorPage = "home";
      state.detailModalId = null;
      render();
      showToast(state.seniorMode ? "Đã bật Chế độ Chữ lớn xuyên suốt cho Người cao tuổi" : "Đã chuyển về chế độ tiêu chuẩn");
    },
    seniorGoHome() {
      state.seniorMode = true;
      state.seniorPage = "home";
      render();
    },
    seniorGoCreate() {
      state.seniorMode = true;
      state.seniorPage = "create";
      if (state.selectedSampleId === "blurry_error") {
        window.App.selectSample("pothole_clear");
        return;
      }
      render();
    },
    seniorGoMine() {
      state.seniorMode = true;
      state.seniorPage = "mine";
      render();
    },
    callVolunteerSupport() {
      showToast("Đã gửi yêu cầu tới Đội Thanh niên Tình nguyện Khu phố 2 hỗ trợ Bác!");
    },
    setCitizenTab(tab) {
      state.citizenTab = tab;
      render();
    },
    openDetail(id) {
      state.detailModalId = id;
      render();
    },
    closeDetail() {
      state.detailModalId = null;
      render();
    },
    setMapFilter(f) {
      state.mapFilter = f;
      render();
    },
    selectPin(id) {
      state.selectedMapPinId = id;
      render();
    },
    supportExisting(id) {
      const r = state.reports.find(x => x.id === id);
      if (r) {
        r.supporters += 1;
        r.mine = true;
        state.selectedOfficerId = r.id;
        render();
        showToast(`Đã +1 đồng tình vào #${r.id} (Tổng ${r.supporters} người dân cùng báo)!`);
      }
    },
    selectSample(sampleId) {
      state.selectedSampleId = sampleId;
      state.customPhotoUrl = null;
      const s = window.PHOTO_SAMPLES.find(x => x.id === sampleId);
      if (s && s.category) {
        state.selectedCategory = s.category;
        state.customDesc = s.suggestedDesc;
      }
      render();
    },
    handleFileUpload(ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        state.customPhotoUrl = e.target.result;
        state.selectedSampleId = "pothole_clear";
        render();
        showToast("AI Vision đã phân tích ảnh tải lên (Độ tin cậy: 92%)");
      };
      reader.readAsDataURL(file);
    },
    toggleGpsError() {
      state.gpsErrorMode = !state.gpsErrorMode;
      render();
    },
    setManualStreet(v) { state.manualStreet = v; },
    setManualHouse(v) { state.manualHouseNo = v; },
    selectCategory(cat) {
      state.selectedCategory = cat;
      render();
    },
    setDesc(v) { state.customDesc = v; },
    submitReportStep() {
      const sample = window.PHOTO_SAMPLES.find(x => x.id === state.selectedSampleId);
      if (!state.gpsErrorMode && sample && sample.duplicateId) {
        state.showDuplicateSheet = true;
        render();
        return;
      }
      window.App.forceCreateNew();
    },
    closeDupSheet() {
      state.showDuplicateSheet = false;
      render();
    },
    mergeIntoExisting(id) {
      const r = state.reports.find(x => x.id === id);
      if (r) {
        r.supporters += 1;
        r.mine = true;
        state.selectedOfficerId = r.id;
      }
      state.showDuplicateSheet = false;
      state.citizenTab = "mine";
      state.seniorPage = "mine";
      render();
      showToast(`Đã gộp phản ánh trùng bán kính 50m vào #${id} (Cụm ${r.supporters} người dân)!`);
    },
    forceCreateNew() {
      const sample = window.PHOTO_SAMPLES.find(x => x.id === state.selectedSampleId);
      const conf = sample ? sample.confidence : 90;
      const needVerify = conf < 85;
      const newId = "TB-" + (1165 + Math.floor(Math.random() * 30));
      const addr = state.gpsErrorMode
        ? `${state.manualHouseNo}, ${state.manualStreet}`
        : (sample ? sample.address : "Phường Trấn Biên");

      const cleanTitle = (state.customDesc || "")
        .split(",")[0]
        .replace(/[.,;:\s]+$/, "")
        .slice(0, 56) || "Phản ánh hiện trường mới từ người dân";

      const newReport = {
        id: newId,
        category: state.selectedCategory,
        title: cleanTitle,
        address: addr,
        x: 215,
        y: 185,
        distance: "30m",
        aiConfidence: conf,
        aiEvidence: sample ? sample.evidence : [],
        supporters: 1,
        volunteerVerified: !needVerify,
        volunteerNote: needVerify ? "" : "Ảnh rõ nét (AI >= 85%), chuyển thẳng điều phối.",
        status: needVerify ? "verify" : "new",
        department: needVerify ? "Chờ Đoàn viên xác minh tại chỗ" : "",
        sla: needVerify ? "Chờ xác minh thực địa" : "Gợi ý SLA: 48 giờ",
        createdAt: "Vừa xong (24/11/2026)",
        mine: true,
        rating: 0,
        ratingTags: [],
        afterNote: ""
      };
      state.reports.unshift(newReport);
      state.stats.total += 1;
      state.stats.byCategory[state.selectedCategory].count += 1;
      state.showDuplicateSheet = false;
      state.citizenTab = "mine";
      state.seniorPage = "mine";
      state.selectedOfficerId = newId;
      render();
      showToast(needVerify
        ? `Đã gửi #${newId}! Do AI tin cậy ${conf}% (TB), đơn đã chuyển sang Đội Đoàn viên xác minh.`
        : `Đã gửi thành công phản ánh #${newId} lên Trung tâm Điều hành Phường!`);
    },
    openReview(id) {
      const r = state.reports.find(x => x.id === id);
      state.detailModalId = null;
      state.reviewModalId = id;
      state.sliderPos = 50;
      state.tempRating = r && r.rating ? r.rating : 5;
      render();
    },
    closeReview() {
      state.reviewModalId = null;
      render();
    },
    setSlider(val) {
      state.sliderPos = Number(val);
      const clip = document.querySelector(".ba-before-clip");
      if (clip) clip.style.width = state.sliderPos + "%";
    },
    setTempRating(n) {
      state.tempRating = n;
      render();
    },
    toggleRatingTag(tag) {
      if (state.tempTags.includes(tag)) {
        state.tempTags = state.tempTags.filter(t => t !== tag);
      } else {
        state.tempTags.push(tag);
      }
      render();
    },
    saveReview(id) {
      const r = state.reports.find(x => x.id === id);
      if (r) {
        r.rating = state.tempRating;
        r.ratingTags = [...state.tempTags];
      }
      state.reviewModalId = null;
      render();
      showToast(`Cảm ơn Bác đã đánh giá ${state.tempRating}★! Kết quả đã cập nhật lên bảng công khai Phường.`);
    },
    volunteerVerify(id, isValid) {
      const r = state.reports.find(x => x.id === id);
      if (!r) return;
      if (isValid) {
        r.volunteerVerified = true;
        r.status = "new";
        r.volunteerNote = "Đoàn viên KP.3 đã kiểm tra thực địa: Đúng sự cố, gần cổng trường học cần xử lý sớm.";
        r.sla = "Ưu tiên giao trong 24h";
        state.selectedOfficerId = r.id;
        showToast(`Đoàn viên đã xác nhận #${id} -> Đẩy lên đầu danh sách Cán bộ Phường!`);
      } else {
        state.reports = state.reports.filter(x => x.id !== id);
        showToast(`Đã đóng phản ánh báo nhầm #${id}, giúp giảm tải cho Cán bộ Phường.`);
      }
      render();
    },
    switchToAssistedReport() {
      state.viewMode = "citizen";
      state.citizenTab = "create";
      render();
      showToast("Đang mở biểu mẫu gửi phản ánh hộ Cô/Chú cao tuổi");
    },
    setOfficerFilter(f) {
      state.officerFilter = f;
      render();
    },
    selectOfficerRow(id) {
      state.selectedOfficerId = id;
      state.showCompleteModal = false;
      render();
    },
    setAssignDept(v) { state.assignDept = v; },
    setAssignSla(v) { state.assignSla = v; },
    assignTicket(id) {
      const r = state.reports.find(x => x.id === id);
      if (!r) return;
      r.status = "progress";
      r.department = state.assignDept;
      r.sla = state.assignSla;
      r.mine = true;
      render();
      showToast(`Đã giao #${id} cho "${state.assignDept}" kèm hạn SLA!`);
    },
    toggleCompleteModal(open) {
      state.showCompleteModal = open;
      render();
    },
    setAfterNote(v) { state.afterResolutionNote = v; },
    completeTicket(id) {
      const r = state.reports.find(x => x.id === id);
      if (!r) return;
      if (r.status !== "done") {
        state.stats.resolved += 1;
      }
      r.status = "done";
      r.department = r.department || state.assignDept;
      r.afterNote = state.afterResolutionNote;
      r.sla = "Hoàn thành đúng hạn (1,5 ngày)";
      r.mine = true;
      state.showCompleteModal = false;
      render();
      showToast(`Đã công khai ảnh Sau xử lý cho #${id}! Ghim bản đồ đổi sang Xanh lá & mở đánh giá dân.`);
    },

    // Quick Presenter Scenarios
    runScenario(name) {
      if (name === "standard") {
        state.viewMode = "split";
        state.seniorMode = false;
        state.citizenTab = "create";
        state.gpsErrorMode = false;
        window.App.selectSample("pothole_clear");
        showToast("Kịch bản 1: AI nhận diện 92% + Bấm Gửi để xem Gộp trùng bán kính 50m!");
      } else if (name === "medium_ai") {
        state.viewMode = "split";
        state.seniorMode = false;
        state.citizenTab = "create";
        state.gpsErrorMode = false;
        window.App.selectSample("flood_night");
        showToast("Kịch bản 2: Ảnh chụp đêm -> Độ tin cậy AI 68% -> Tự chuyển Đoàn viên xác minh!");
      } else if (name === "senior") {
        state.viewMode = "citizen";
        state.seniorMode = true;
        render();
        showToast("Kịch bản 3: Chế độ Chữ lớn tương phản cao cho Người cao tuổi");
      } else if (name === "error_blur") {
        state.viewMode = "citizen";
        state.seniorMode = false;
        state.citizenTab = "create";
        window.App.selectSample("blurry_error");
        showToast("Kịch bản Lỗi 1: Ảnh mờ/tối (Độ tin cậy 38%) -> Chặn gửi rác & nhắc chụp lại");
      } else if (name === "error_gps") {
        state.viewMode = "citizen";
        state.seniorMode = false;
        state.citizenTab = "create";
        state.gpsErrorMode = true;
        render();
        showToast("Kịch bản Lỗi 2: Mất quyền GPS -> Chuyển mượt sang chọn Khu phố & Tên đường");
      } else if (name === "empty") {
        state.viewMode = "citizen";
        state.seniorMode = false;
        state.citizenTab = "map";
        state.mapFilter = "empty_kp6";
        render();
        showToast("Kịch bản Trạng thái trống (Empty State): Khu phố 6 sạch sự cố");
      }
    }
  };

  window.addEventListener("DOMContentLoaded", render);
})();
