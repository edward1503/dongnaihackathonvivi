@echo off
chcp 65001 >nul
echo ===============================================================
echo   DONG GOI SAN PHAM NOP BAI VONG SO LOAI - DE SO 2
echo ===============================================================
set /p TEAM_ID="Nhap Ma Doi cua ban (vi du: 13 -> se tao thu muc Doi13_De2): "
if "%TEAM_ID%"=="" set TEAM_ID=XX

set OUT_DIR=%~dp0Doi%TEAM_ID%_De2
mkdir "%OUT_DIR%" 2>nul
mkdir "%OUT_DIR%\prototype" 2>nul

set BROWSER="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %BROWSER% set BROWSER="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

echo [1/3] Dang xuat 01_Ban_Thiet_Ke_Giao_Dien_De2.pdf (07 trang A4 Ngang - Du 10 man hinh)...
%BROWSER% --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="%OUT_DIR%\01_Ban_Thiet_Ke_Giao_Dien_De2.pdf" "file:///%~dp0design_pdf/Ban_Thiet_Ke_Giao_Dien_De2.html"

echo [2/3] Dang sao chep 02_Prototype bam duoc ngoai tuyen...
xcopy /E /I /Y "%~dp0prototype\*" "%OUT_DIR%\prototype\" >nul

echo [3/3] Dang xuat 03_Ban_Thuyet_Minh_De2.pdf (Chuan <= 03 trang A4)...
%BROWSER% --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="%OUT_DIR%\03_Ban_Thuyet_Minh_De2.pdf" "file:///%~dp0docs/Ban_Thuyet_Minh_De2_In_A4.html"

echo.
echo ===============================================================
echo   HOAN TAT! Thu muc nop bai da san sang tai:
echo   %OUT_DIR%
echo   (Nho copy thu muc nay ra Man hinh may tinh Desktop truoc 15:00!)
echo ===============================================================
pause
