# 21-ASR Raqamli Xizmatlar Markazi — PRD v3

## Major Updates v3
- **Logo**: Foydalanuvchi logosi qoldi, qo'shimcha matn olib tashlandi
- **Auth**: Email olib tashlandi - **faqat telefon raqami + parol** bilan ro'yxatdan o'tish va kirish
- **Payment system**: Admin "to'lov kerak" deb belgilaydi → mijozga to'lov ekrani ochiladi
  - To'lov usullari: Payme, Click, Xazna, Paynet (default seeded)
  - Admin har bir usulni qo'sha/tahrirlay/o'chira oladi (Link yoki QR rasm)
- **Clickable contacts**: Telegram → Telegram ilovasi, Telefon → qo'ng'iroq, Email → mail
- **Custom contact types**: Admin yangi kontakt turi (Instagram, WhatsApp va h.k.) qo'shishi mumkin
- **File viewer**: Admin va egasi fayllarni ochishi mumkin (rasmlar/PDF data URI orqali)

## Stack
Same as v2: Expo Router + FastAPI + MongoDB + JWT (phone-based)

## Auth (yangilangan)
- POST `/api/auth/register` - { first_name, last_name, phone, password }
- POST `/api/auth/login` - { phone, password }

## Admin
- **Phone**: +998901112233
- **Password**: Admin@123

## Payment APIs
- GET `/api/payments/methods` (auth) - active methods
- POST/PATCH/DELETE `/api/admin/payments` - CRUD methods
- POST `/api/requests/{id}/mark-paid` - user marks as paid
- PATCH `/api/admin/requests/{id}/payment` - admin sets payment_status
- Admin status update extended with payment_required, payment_amount, payment_note

## Contact Items APIs (yangi)
- GET `/api/contact-items` (public) - dynamic contact items
- CRUD `/api/admin/contact-items`
