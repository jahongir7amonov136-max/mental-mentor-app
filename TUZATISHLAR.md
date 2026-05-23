# Tuzatishlar (2026-05-22)

## 1. APK logosi
- `frontend/scripts/generate-app-icons.mjs` — keng logo kvadrat 1024×1024 formatga (padding bilan) o‘tkaziladi.
- Build oldidan: `cd frontend && npm run generate:icons`
- `icon.png`, `adaptive-icon.png`, `splash-icon.png` yangilanadi — Android adaptive icon kesib qolmaydi.

## 2. Super admin
- Backend: `+998901112233` (yoki `SUPER_ADMIN_PHONE`) har doim `super_admin` rolida.
- Login paytida ham rol yangilanadi.
- Oddiy admin: `REGULAR_ADMIN_PHONE` + `REGULAR_ADMIN_PASSWORD` (.env)
- Frontend: super admin barcha bo‘limlarni ko‘radi (jamoa, kontakt, to‘lov usullari).

## 3. Oferta va kirish
- Oferta matni uzunlashtirildi (v1.1, 3 til).
- Tasdiqlashdan keyin foydalanuvchi darhol yangilanadi (`updateUser`) — ilovaga kirish xatosi bartaraf.
- Yo‘naltirish: `/(tabs)` o‘rniga `/` (index router).

## 4. Chek yuborish / ko‘rish
- Admin chek rasmini to‘liq ko‘radi (`include_receipt`).
- Mijoz chek yuklashda ruxsat xabari qo‘shildi.

## 5. Yangiliklar (yangi)
- Bosh sahifada Online xizmatlar va Buxgalteriya ostida **harakatlanuvchi yangiliklar** (tepadan pastga).
- Admin panel → **Yangiliklar boshqaruvi**: sarlavha, matn, rasm.
- API: `GET /api/news`, `POST/PATCH/DELETE /api/admin/news`

## 6. Admin qo'shish (super admin)
- Admin panel → **Adminlar** (faqat super admin).
- Yangi admin: ism, telefon, parol.
- API: `GET/POST/DELETE /api/admin/staff`

## Admin kirish
- Super: telefon `+998901112233`, parol `Admin@123`
- Oddiy admin: `.env` dagi `REGULAR_ADMIN_PHONE` / `REGULAR_ADMIN_PASSWORD`
