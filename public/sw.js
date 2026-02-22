// Service Worker برای PWA اتاق ویدیویی ایران
const CACHE_NAME = 'iran-video-call-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  '/socket.io/socket.io.js'
];

// نصب Service Worker و کش کردن فایل‌های ضروری
self.addEventListener('install', (event) => {
  console.log('Service Worker در حال نصب است...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('فایل‌ها در کش ذخیره شدند');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('خطا در کش کردن فایل‌ها:', error);
      })
  );
  
  // فعال کردن سریع Service Worker
  self.skipWaiting();
});

// فعال کردن Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker فعال شد');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف کش قدیمی:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // کنترل فوری تمام کلاینت‌ها
  return self.clients.claim();
});

// مدیریت درخواست‌های شبکه
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // برای درخواست‌های Socket.IO از شبکه استفاده کن (نمی‌توان کش کرد)
  if (url.pathname.startsWith('/socket.io/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // برای درخواست‌های دیگر، ابتدا کش را بررسی کن
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // اگر در کش وجود داشت، از کش برگردان
        if (response) {
          console.log('سرویس از کش:', event.request.url);
          return response;
        }
        
        // در غیر این صورت از شبکه درخواست کن
        console.log('سرویس از شبکه:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // بررسی اینکه پاسخ معتبر است
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // کلون کردن پاسخ برای کش کردن
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // کش کردن پاسخ برای استفاده آینده
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.error('خطا در درخواست شبکه:', error);
            
            // اگر صفحه اصلی بود و آفلاین هستیم، صفحه آفلاین را نمایش بده
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// مدیریت پیام‌ها از کلاینت
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// همگام‌سازی پس از بازگشت از حالت آفلاین
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('همگام‌سازی پس‌زمینه اجرا شد');
    event.waitUntil(doBackgroundSync());
  }
});

// تابع همگام‌سازی پس‌زمینه
async function doBackgroundSync() {
  try {
    // اینجا می‌توان پیام‌های ارسال نشده را ارسال کرد
    console.log('همگام‌سازی پس‌زمینه با موفقیت انجام شد');
  } catch (error) {
    console.error('خطا در همگام‌سازی پس‌زمینه:', error);
  }
}

// مدیریت push notifications (در صورت نیاز در آینده)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'پیام جدید در اتاق ویدیویی ایران',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'ورود به اتاق',
          icon: '/icon-96.png'
        },
        {
          action: 'close',
          title: 'بستن',
          icon: '/icon-96.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'اتاق ویدیویی ایران', options)
    );
  }
});

// مدیریت کلیک روی notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification کلیک شد:', event.notification.data);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // باز کردن اپلیکیشن
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// به‌روزرسانی کش
self.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_CACHE') {
    updateCache();
  }
});

// تابع به‌روزرسانی کش
async function updateCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
    console.log('کش با موفقیت به‌روزرسانی شد');
  } catch (error) {
    console.error('خطا در به‌روزرسانی کش:', error);
  }
}
