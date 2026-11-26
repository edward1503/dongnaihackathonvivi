# Image dùng chung cho quay trailer "Lá chắn số" trên scoai: lcs-trailer:1
#   Dựng: bash ~/lcs-video/trailer/cong-cu/sv.sh image   (trên scoai)
# Có: Chromium (chạy bằng người dùng thường "quay", cùng uid/gid với minhhoang trên máy chủ),
# ffmpeg, Node 22 (sẵn trong image gốc), Python venv cho máy chủ Lá chắn số (/opt/venv),
# thư viện cho Android Emulator (SDK gắn từ /t/sdk, không nằm trong image), pulseaudio, Java 17 cho sdkmanager.
FROM node:22-bookworm-slim

ARG QUAY_UID=1001
ARG QUAY_GID=984

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    TZ=Asia/Ho_Chi_Minh \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium ffmpeg python3 python3-venv python3-pip openjdk-17-jre-headless procps unzip \
      pulseaudio pulseaudio-utils fonts-noto-core fonts-noto-color-emoji \
      libpulse0 libgl1 libnss3 libxkbfile1 libx11-xcb1 libxcb-cursor0 libxcomposite1 libxcursor1 \
      libxi6 libxtst6 libasound2 libdbus-1-3 libxdamage1 libxrandr2 libxkbcommon0 libgbm1 \
      libegl1 libx11-6 libxext6 libxfixes3 libxrender1 libxcb1 libfontconfig1 libfreetype6 \
      libdrm2 libexpat1 libuuid1 libbsd0 \
      ca-certificates curl tzdata iproute2 file sqlite3 \
 && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
 && rm -rf /var/lib/apt/lists/*

# Máy chủ Lá chắn số: như requirements.txt của kho, cộng phần khớp miệng (onnxruntime, numpy, Pillow) như máy chủ demo.
COPY requirements.txt /opt/requirements.txt
RUN python3 -m venv /opt/venv \
 && /opt/venv/bin/pip install -r /opt/requirements.txt onnxruntime numpy Pillow

# Người dùng thường cho Chromium và mọi thứ không cần root (trùng uid/gid minhhoang để tệp ghi ra /t thuộc về minhhoang).
RUN groupadd -g ${QUAY_GID} quay \
 && useradd -m -u ${QUAY_UID} -g ${QUAY_GID} -s /bin/bash quay

ENV PATH=/opt/venv/bin:/t/sdk/platform-tools:/t/sdk/emulator:/t/sdk/cmdline-tools/latest/bin:$PATH \
    ANDROID_SDK_ROOT=/t/sdk \
    ANDROID_HOME=/t/sdk \
    ANDROID_AVD_HOME=/t/avd

WORKDIR /t
CMD ["sleep", "infinity"]
