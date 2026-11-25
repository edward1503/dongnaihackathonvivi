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

echo [1/2] Dang xuat 01_Ban_Thiet_Ke_Giao_Dien_De2.pdf va 03_Ban_Thuyet_Minh_De2.pdf...
node "%~dp0export_pdf.js" "%OUT_DIR%"

echo [2/2] Dang sao chep 02_Prototype bam duoc ngoai tuyen...
xcopy /E /I /Y "%~dp0prototype\*" "%OUT_DIR%\prototype\" >nul

echo.
echo ===============================================================
echo   HOAN TAT! Thu muc nop bai da san sang tai:
echo   %OUT_DIR%
echo   (Nho copy thu muc nay ra Man hinh may tinh Desktop truoc 15:00!)
echo ===============================================================
pause
