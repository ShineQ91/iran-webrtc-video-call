# راهنمای کامل دیپلوی اتاق ویدیویی ایران

این راهنما به شما کمک می‌کند تا اپلیکیشن را روی پلتفرم‌های مختلف دیپلوی کنید.

## 🚀 دیپلوی روی Render.com (توصیه شده)

Render.com یک پلتفرم رایگان برای Node.js اپلیکیشن‌هاست.

### مرحله 1: آماده‌سازی گیت‌هاب

1. **ایجاد ریپازیتوری جدید**
```bash
git init
git add .
git commit -m "Initial commit - Iran Video Call"
```

2. **آپلود به گیت‌هاب**
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/iran-webrtc-video-call.git
git push -u origin main
```

**نکته مهم:** مطمئن شوید پوشه `public` در `.gitignore` نباشد تا فایل‌های فرانت‌اند آپلود شوند.

### مرحله 2: تنظیم Render.com

1. **ثبت‌نام در Render**
- به [render.com](https://render.com) بروید
- با GitHub ثبت‌نام کنید

2. **ساخت Web Service جدید**
- روی "New +" کلیک کنید
- "Web Service" را انتخاب کنید
- ریپازیتوری گیت‌هاب را متصل کنید

3. **تنظیمات Build و Start**
```yaml
Name: iran-video-call
Environment: Node
Region: Europe West
Branch: main
Root Directory: (خالی بگذارید)
Runtime: Node 18.x
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

4. **متغیرهای محیطی**
```
NODE_ENV=production
```

### مرحله 3: تست دیپلوی

1. **بررسی لاگ‌ها**
- در داشبورد Render، لاگ‌ها را بررسی کنید
- اطمینان از اجرای موفقیت‌آمیز سرور

2. **تست اتصال**
- به آدرس داده شده بروید
- تست تماس با چند کاربر همزمان

**لینک پروژه نمونه:**
- ریپازیتوری: https://github.com/ShineQ91/iran-webrtc-video-call
- اپلیکیشن: https://iran-video-call.onrender.com
git remote add origin https://github.com/your-username/iran-webrtc-video-call.git
git push -u origin main
```

### مرحله 2: تنظیم Render.com

1. **ثبت‌نام در Render.com**
- به [render.com](https://render.com) بروید
- با گیت‌هاب ثبت‌نام کنید

2. **ساخت Web Service جدید**
- روی "New +" کلیک کنید
- "Web Service" را انتخاب کنید
- ریپازیتوری گیت‌هاب را انتخاب کنید

3. **تنظیمات Build و Start**
```yaml
Build Command: npm install
Start Command: npm start
```

4. **تنظیمات پیشرفته**
- **Name**: `iran-video-call`
- **Environment**: `Node`
- **Region**: نزدیک‌ترین منطقه به کاربران ایرانی
- **Branch**: `main`
- **Root Directory**: خالی بگذارید
- **Instance Type**: `Free`

5. **متغیرهای محیطی (Environment Variables)**
```
NODE_ENV=production
PORT=3000
```

### مرحله 3: تنظیم HTTPS و دامنه

1. **HTTPS خودکار**
- Render به طور خودکار SSL را تنظیم می‌کند
- اپلیکیشن روی HTTPS در دسترس خواهد بود

2. **دامنه سفارشی (اختیاری)**
- در تنظیمات Web Service، دامنه سفارشی را اضافه کنید
- DNS را مطابق دستورالعمل Render تنظیم کنید

### مرحله 4: تست دیپلوی

1. **بررسی لاگ‌ها**
- در داشبورد Render، لاگ‌ها را بررسی کنید
- اطمینان از اجرای موفقیت‌آمیز سرور

2. **تست اتصال**
- به آدرس داده شده بروید
- تست تماس با چند کاربر همزمان

---

## 🐳 دیپلوی با Docker

### ساخت Dockerfile

```dockerfile
FROM node:18-alpine

# تنظیم دایرکتوری کاری
WORKDIR /app

# کپی فایل‌های package
COPY package*.json ./

# نصب وابستگی‌ها
RUN npm ci --only=production

# کپی سورس کد
COPY . .

# افشای پورت
EXPOSE 3000

# اجرای اپلیکیشن
CMD ["npm", "start"]
```

### ساخت و اجرا

```bash
# ساخت ایمیج
docker build -t iran-video-call .

# اجرا
docker run -p 3000:3000 iran-video-call
```

### دیپلوی روی Docker Hub

```bash
# تگ کردن
docker tag iran-video-call yourusername/iran-video-call:latest

# پوش به Docker Hub
docker push yourusername/iran-video-call:latest
```

---

## 🖥️ دیپلوی روی VPS شخصی

### مرحله 1: آماده‌سازی سرور

1. **نصب Node.js**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

2. **نصب Git**
```bash
sudo apt-get install git  # Ubuntu/Debian
sudo yum install git      # CentOS/RHEL
```

### مرحله 2: دیپلوی اپلیکیشن

1. **کلون کردن پروژه**
```bash
cd /var/www
git clone https://github.com/your-username/iran-webrtc-video-call.git
cd iran-webrtc-video-call
```

2. **نصب وابستگی‌ها**
```bash
npm install --production
```

3. **اجرای با PM2**
```bash
# نصب PM2
npm install -g pm2

# اجرا
pm2 start server.js --name "iran-video-call"

# تنظیم استارت خودکار
pm2 startup
pm2 save
```

### مرحله 3: تنظیم Nginx (برای SSL)

1. **نصب Nginx**
```bash
sudo apt-get install nginx
```

2. **تنظیم فایل کانفیگ**
```bash
sudo nano /etc/nginx/sites-available/iran-video-call
```

محتوای فایل:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **فعال‌سازی سایت**
```bash
sudo ln -s /etc/nginx/sites-available/iran-video-call /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### مرحله 4: تنظیم SSL با Let's Encrypt

1. **نصب Certbot**
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. **دریافت گواهی SSL**
```bash
sudo certbot --nginx -d your-domain.com
```

3. **تمدید خودکار**
```bash
sudo crontab -e
# اضافه کردن این خط:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## ☁️ دیپلوی روی پلتفرم‌های ابری

### Heroku

1. **نصب Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
choco install heroku-cli

# Linux
sudo snap install heroku --classic
```

2. **لاگین و ساخت اپ**
```bash
heroku login
heroku create your-app-name
```

3. **دیپلوی**
```bash
git push heroku main
```

### Vercel

1. **نصب Vercel CLI**
```bash
npm i -g vercel
```

2. **دیپلوی**
```bash
vercel --prod
```

### DigitalOcean App Platform

1. **ایجاد اپلیکیشن**
- به کنترل پنل DigitalOcean بروید
- "Apps" را انتخاب کنید
- ریپازیتوری گیت‌هاب را متصل کنید

2. **تنظیمات**
```yaml
Build Command: npm install
Run Command: npm start
HTTP Port: 3000
```

---

## 🔧 تنظیمات پیشرفته

### متغیرهای محیطی

```bash
# تولیدی
NODE_ENV=production
PORT=3000

# امنیتی (اختیاری)
CORS_ORIGIN=https://your-domain.com

# عملکرد
UV_THREADPOOL_SIZE=128
```

### بهینه‌سازی عملکرد

1. **فشرده‌سازی با Gzip**
```javascript
// در server.js
const compression = require('compression');
app.use(compression());
```

2. **تنظیمات Socket.IO برای production**
```javascript
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});
```

### مانیتورینگ

1. **استفاده از New Relic**
```bash
npm install newrelic
```

2. **تنظیمات PM2**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## 🚨 عیب‌یابی دیپلوی

### مشکلات رایج

**1. خطای EADDRINUSE**
```bash
# پیدا کردن پروسه روی پورت 3000
sudo lsof -i :3000

# کشتن پروسه
sudo kill -9 PID
```

**2. خطاهای CORS**
- بررسی تنظیمات CORS در سرور
- اطمینان از HTTPS در production

**3. مشکلات WebRTC**
- بررسی HTTPS الزامی
- تست سرورهای STUN/TURN
- بررسی فایروال و پورت‌ها

### لاگ‌گیری

1. **لاگ‌های اپلیکیشن**
```bash
pm2 logs iran-video-call
```

2. **لاگ‌های Nginx**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

3. **لاگ‌های سیستم**
```bash
sudo journalctl -u nginx -f
```

---

## 📊 پایش و تحلیل

### Google Analytics (اختیاری)

در `public/index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### مانیتورینگ سرور

```bash
# نصب htop
sudo apt-get install htop

# مانیتورینگ منابع
htop

# مانیتورینگ شبکه
iftop
```

---

## 🔄 به‌روزرسانی

### فرآیند به‌روزرسانی

1. **کد جدید**
```bash
git pull origin main
```

2. **نصب وابستگی‌های جدید**
```bash
npm install
```

3. **ری‌استارت سرویس**
```bash
pm2 restart iran-video-call
```

### دیپلوی خودکار با GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/iran-webrtc-video-call
          git pull origin main
          npm install
          pm2 restart iran-video-call
```

---

با دنبال کردن این راهنما، اپلیکیشن شما به راحتی روی پلتفرم مورد نظر دیپلوی خواهد شد. در صورت بروز هرگونه مشکل، لاگ‌ها را بررسی کنید یا از بخش عیب‌یابی استفاده کنید.
