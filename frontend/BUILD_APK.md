# APK chiqarish — 21-ASR mobil ilova

## 1. Tayyorgarlik

```powershell
cd frontend
copy .env.example .env
# .env ichida haqiqiy API manzilini yozing:
# EXPO_PUBLIC_BACKEND_URL=https://sizning-server.com
npm install
```

Backend ishlayotgan bo‘lishi kerak (HTTPS tavsiya etiladi).

## 2. EAS orqali APK (tavsiya, bepul tier)

```powershell
npm install -g eas-cli
eas login
eas build:configure
npm run build:apk
```

Yoki interaktiv:

```powershell
eas build -p android --profile preview
```

Tugagach: https://expo.dev → Builds → `.apk` yuklab oling.

## 3. Lokal APK (siz o'rnatgan JDK + Android Studio)

**1-qadam:** Android Studio yoki [JDK 17](https://adoptium.net/) o'rnating  
**2-qadam:** Android Studio → SDK Manager → Android SDK o'rnating  
**3-qadam:** Cursor/terminalni **yopib qayta oching** (PATH yangilanishi uchun)

**4-qadam:** PowerShell:

```powershell
cd "C:\Yangi-ilova12.05.2026-main (1)\Yangi-ilova12.05.2026-main\frontend"
.\build-apk-local.ps1
```

Tayyor APK: `frontend\21-ASR-GROUP-release.apk`

Qo'lda (skript ishlamasa):

```powershell
cd frontend\android
.\gradlew.bat assembleRelease
```

## 4. Backend (alohida)

`backend/` — `MONGO_URL`, `DB_NAME`, `JWT_SECRET` bilan serverda:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```
