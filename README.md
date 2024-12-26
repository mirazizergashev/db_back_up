# MySQL Backup and Telegram Notification

Bu loyiha MySQL ma'lumotlar bazalarini zaxiralash va ushbu zaxirani Telegram kanaliga yuborish uchun yaratilgan. Loyiha Node.js yordamida amalga oshirilgan va `7zip` orqali zip faylga parol qo'shishni ham qo'llab-quvvatlaydi.

## Funksiyalar

- **MySQL Zaxirasi**: Ma'lumotlar bazasini MySQL `mysqldump` utilitasidan foydalangan holda zaxiralash.
- **Arxiv yaratish**: Zaxira fayllarini ZIP formatiga o‘tkazish va ularga parol qo‘shish (`7zip` orqali).
- **Telegram orqali yuborish**: Yaratilgan zip faylini Telegram kanali yoki botga yuborish.
- **Avtomatik ishga tushirish**: Loyiha har 24 soatda avtomatik tarzda ishga tushadi va ma'lumotlar bazasining zaxirasini olishni amalga oshiradi.

## Talablar

- Node.js (v12 yoki undan yuqori)
- MySQL
- `7zip` (Windows, Linux yoki macOS tizimida o‘rnatilgan bo‘lishi kerak)
- Telegram Bot API Token
- Telegram Channel ID

## O‘rnatish

1. **Node.js va npm o‘rnatish**:
   Agar sizda Node.js o‘rnatilmagan bo‘lsa, [Node.js rasmiy saytiga](https://nodejs.org/) kirib, uni o‘rnating.

2. **Loyihani yuklab olish**:
   GitHub'dan loyihani klonlash:
   ```bash
   git clone https://github.com/mirazizergashev/db_back_up.git
   cd project-name
