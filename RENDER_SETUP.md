# Render + MongoDB sozlash

Backend URL: **https://two1-asr-backend-oxiri.onrender.com**

## Render Dashboard → Environment

Quyidagi o‘zgaruvchilarni qo‘shing (backend/.env bilan bir xil):

| Key | Qiymat |
|-----|--------|
| `MONGO_URL` | `backend/.env` dagi MONGO_URL |
| `DB_NAME` | `asr21` |
| `JWT_SECRET` | `backend/.env` dagi JWT_SECRET |
| `ADMIN_PHONE` | `+998901112233` (ixtiyoriy) |
| `ADMIN_PASSWORD` | `Admin@123` (ixtiyoriy) |

**Save** → **Manual Deploy** yoki avtomatik redeploy kuting.

## Tekshirish

Brauzerda oching:

- https://two1-asr-backend-oxiri.onrender.com — `status: ok`
- https://two1-asr-backend-oxiri.onrender.com/api/ — API xabari
- https://two1-asr-backend-oxiri.onrender.com/api/services/catalog — xizmatlar ro‘yxati

## MongoDB Atlas

1. **Network Access** → `0.0.0.0/0` (Render uchun) yoki Render IP
2. Database user paroli to‘g‘ri bo‘lishi kerak

## Mobil ilova

`frontend/.env`:

```
EXPO_PUBLIC_BACKEND_URL=https://two1-asr-backend-oxiri.onrender.com
```

APK build qilishdan oldin shu URL ishlatiladi.

## Admin rollari

| Rol | Login (default seed) | Huquq |
|-----|----------------------|--------|
| **super_admin** | `SUPER_ADMIN_PHONE` / `SUPER_ADMIN_PASSWORD` | To'lov usullari, Biz haqimizda (jamoa), Bog'lanish |
| **admin** | `REGULAR_ADMIN_PHONE` / `REGULAR_ADMIN_PASSWORD` | KYC, arizalar, support, chek tekshiruvi, xizmat holati |

Render Environment ga ixtiyoriy qo'shing:
- `REGULAR_ADMIN_PHONE=+998901112244`
- `REGULAR_ADMIN_PASSWORD=Admin@456`
