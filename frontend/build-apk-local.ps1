# 21-ASR GROUP - lokal APK build (Windows)
# Ishga tushirish: .\build-apk-local.ps1

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

Write-Host "=== 21-ASR GROUP APK build ===" -ForegroundColor Cyan

Write-Host "Ikonlar yaratilmoqda (kvadrat logo)..." -ForegroundColor Cyan
$py = Get-Command python -ErrorAction SilentlyContinue
if ($py) {
    python "$Root\scripts\generate-app-icons.py"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "OGOHLANTIRISH: python topilmadi — icon.png ni qo'lda yangilang (npm run generate:icons)" -ForegroundColor Yellow
}

if (-not (Test-Path "$Root\.env")) {
    Write-Host "XATO: .env fayl topilmadi. .env.example dan nusxa oling." -ForegroundColor Red
    exit 1
}
Write-Host "OK: .env topildi" -ForegroundColor Green
$envLine = Get-Content "$Root\.env" | Where-Object { $_ -match '^EXPO_PUBLIC_BACKEND_URL=' } | Select-Object -First 1
if ($envLine) {
    Write-Host "API: $envLine" -ForegroundColor Cyan
} else {
    Write-Host "XATO: .env da EXPO_PUBLIC_BACKEND_URL yo'q" -ForegroundColor Red
    exit 1
}

$javaCandidates = @(
    "$env:JAVA_HOME\bin\java.exe",
    "C:\Program Files\Android\Android Studio\jbr\bin\java.exe",
    "C:\Program Files\Android\Android Studio1\jbr\bin\java.exe"
)
Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Recurse -Filter "java.exe" -ErrorAction SilentlyContinue | ForEach-Object { $javaCandidates += $_.FullName }
Get-ChildItem "C:\Program Files\Java" -Recurse -Filter "java.exe" -ErrorAction SilentlyContinue | ForEach-Object { $javaCandidates += $_.FullName }
Get-ChildItem "C:\Program Files\Microsoft" -Recurse -Filter "java.exe" -ErrorAction SilentlyContinue | ForEach-Object { $javaCandidates += $_.FullName }

$javaExe = $null
foreach ($c in $javaCandidates) {
    if ($c -and (Test-Path $c)) { $javaExe = $c; break }
}

if (-not $javaExe) {
    Write-Host ""
    Write-Host "XATO: Java JDK 17 topilmadi." -ForegroundColor Red
    Write-Host "Android Studio yoki JDK 17 o rnating: https://adoptium.net/" -ForegroundColor Yellow
    Write-Host "Keyin terminalni yopib qayta oching va skriptni qayta ishga tushiring." -ForegroundColor Yellow
    exit 1
}

$jdkHome = Split-Path (Split-Path $javaExe -Parent) -Parent
$env:JAVA_HOME = $jdkHome
$env:Path = "$jdkHome\bin;" + $env:Path
Write-Host "OK: Java - $javaExe" -ForegroundColor Green

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk -and (Test-Path "$env:LOCALAPPDATA\Android\Sdk")) {
    $sdk = "$env:LOCALAPPDATA\Android\Sdk"
}
if ($sdk) {
    $env:ANDROID_HOME = $sdk
    $env:ANDROID_SDK_ROOT = $sdk
    Write-Host "OK: Android SDK - $sdk" -ForegroundColor Green
} else {
    Write-Host "OGOHLANTIRISH: ANDROID_HOME topilmadi. Android Studio SDK kerak." -ForegroundColor Yellow
}

if (-not (Test-Path "$Root\android\gradlew.bat")) {
    Write-Host "android papka yoq - prebuild ishga tushirilmoqda..." -ForegroundColor Yellow
    $env:CI = "1"
    npx expo prebuild --platform android
}

Write-Host ""
Write-Host 'Gradle build boshlandi. Taxminan 5 dan 15 daqiqa...' -ForegroundColor Cyan
Set-Location "$Root\android"
# Eski JS bundle (noto'g'ri API URL) o'chirish uchun clean
.\gradlew.bat clean assembleRelease

$apk = "$Root\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apk) {
    $dest = "$Root\21-ASR-GROUP-release.apk"
    Copy-Item $apk $dest -Force
    Write-Host ""
    Write-Host "TAYYOR APK:" -ForegroundColor Green
    Write-Host $dest
} else {
    Write-Host "APK topilmadi. Yuqoridagi xatolarni tekshiring." -ForegroundColor Red
    exit 1
}
