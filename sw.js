// بص يا سيدي، ده الـ Service Worker اللي هيخلي التطبيق يشتغل أوفلاين زي الفل
const CACHE_NAME = 'area-calc-v14';

// دي قايمة بكل الملفات اللي محتاجينها عشان التطبيق يشتغل من غير نت
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'icon.png',
  'calculator.html',
  'cyclicQuadrilateral.html',
  'divide_area.html',
  'irregular_quadrilateral.html',
  'login.html',
  'main_screen.html',
  'profile.html',
  'saved_results.html',
  'trapezoid.html',
  'trapezoid_height_division.html',
  'triangle.html',
  'mini-calculator.js',
  'reset-button.js',
  'firebase-config.js',
  'firebase-logic.js',
  // الروابط الخارجية المهمة
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
];

// أول ما الـ Service Worker يتثبت، هنسيف كل الملفات دي في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('يا مسهل.. بنسيف الملفات في الكاش');
      // بنستخدم map عشان لو ملف واحد فشل، الباقي يكمل عادي
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => console.warn('فشل تحميل ملف في الكاش:', url, err));
        })
      );
    })
  );
  self.skipWaiting();
});

// تنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('بنمسح الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية الـ Fetch: نحاول نجيب من النت الأول، لو فشل نرجع للكاش
self.addEventListener('fetch', (event) => {
  // بنتجاهل الطلبات اللي مش GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // لو الرد تمام، نحدث الكاش بالنسخة الجديدة
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // لو النت فصل، ندور في الكاش
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // لو صفحة ومش موجودة، نرجع index.html كحل أخير
          if (event.request.mode === 'navigate') {
            return caches.match('index.html');
          }
        });
      })
  );
});
