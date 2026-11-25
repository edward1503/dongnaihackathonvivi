plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "vn.doi18.lachanso"
    compileSdk = 35
    buildToolsVersion = "36.0.0"

    defaultConfig {
        applicationId = "vn.doi18.lachanso"
        minSdk = 29          // Android 10: vai trò sàng lọc cuộc gọi
        targetSdk = 34
        versionCode = 1
        versionName = "0.1"
        ndk { abiFilters += listOf("arm64-v8a", "x86_64") }   // điện thoại thật và máy ảo; bớt dung lượng thư viện gốc
    }
    // Trang gọi video và nhân vật lấy thẳng từ bản prototype, không chép thành bản thứ hai trong git.
    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("tai-san"))
    androidResources {
        noCompress += listOf("mp4", "m4a", "onnx", "bin")
        // Mặc định Android bỏ qua thư mục bắt đầu bằng "_" (ở đây là _shared, chứa nhân vật): bỏ luật đó.
        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~"
    }
    buildTypes {
        release { isMinifyEnabled = false }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { buildConfig = true }
    lint { abortOnError = false; checkReleaseBuilds = false }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("com.microsoft.onnxruntime:onnxruntime-android:1.22.0")   // chạy mô hình khẩu hình của cuộc gọi video
    testImplementation("junit:junit:4.13.2")
}

// Sync (không phải Copy): tệp đã xóa hay đổi tên ở nguồn cũng bị xóa khỏi build/tai-san, nếu không APK chở theo bản cũ (từng thừa 102 tệp tiếng chị Lan cũ).
val chepWeb by tasks.registering(Sync::class) {
    from("../..") {
        include("ds.css", "icons.js", "assets/fonts/**", "prototype/video-call.html", "prototype/loi-chi-lan.json", "prototype/hoi-thoai.js", "prototype/hieu-y-loi-nhac.txt", "prototype/tra-loi-loi-nhac.txt", "prototype/hoi-thoai-song-loi-nhac.txt", "prototype/audio/**")
        // các cảnh gọi video (anh Minh, ông Tư): tệp cảnh, lời nhắc, ảnh tĩnh, bảng nhân vật, bộ lời, máy hội thoại chung
        include("prototype/canh/**", "prototype/nhan-vat.json", "prototype/loi-minh.json", "prototype/loi-tu.json", "prototype/hoi-thoai-canh.js")
        // trang bài học (mảng bài học, có thể chưa có lúc build: mẫu không khớp tệp nào thì Gradle bỏ qua) và tranh của nó
        include("prototype/hoc.html", "prototype/hoc/**", "assets/*.png", "motion.css", "motion.js")
        include("vendor/vlearn-avatar/player/**", "vendor/vlearn-avatar/stage/d01-tech/**")
        include("vendor/vlearn-avatar/stage/_shared/voice/models/**", "vendor/vlearn-avatar/stage/_shared/voice/assets/**")
        exclude("**/*.webm")   // Android phát được H.264, không cần bản VP9
        // tranh chỉ dùng cho màn thiết kế (screens/) hoặc bảng nhân vật, không trang nào trong app nạp (kiểm 25/11/2026)
        exclude("assets/ong-tu-bang-nhan-vat.png", "assets/avatar-huong-noi.png")
    }
    into(layout.buildDirectory.dir("tai-san/web"))
}
tasks.named("preBuild") { dependsOn(chepWeb) }
