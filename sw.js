const CACHE_NAME = 'area-calc-v18';

const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'sw.js',
  'manifest.json',
  'icon.png',
  // Layers
  'src/app/navigation.js',
  'src/app/session.js',
  'src/services/registry.js',
  'src/services/geometry.js',
  'src/services/units.js',
  'src/state/firebase-client.js',
  'src/state/firebase-config.js',
  'src/state/firebase-logic.js',
  'styles/styles.css',
  // Screen pages
  'ui/screens/main_screen.html',
  'ui/screens/calculator.html',
  'ui/screens/saved_results.html',
  'ui/screens/all_tools.html',
  'ui/screens/smart_tool.html',
  'ui/screens/settings.html',
  'ui/screens/profile.html',
  'ui/screens/login.html',
  'ui/screens/setup.html',
  // Widgets
  'ui/widgets/export-image.js',
  'ui/widgets/mini-calculator.js',
  'ui/widgets/reset-button.js',
  'ui/widgets/zoom-handler.js',
  // Tool category pages
  'ui/tools/area/trapezoid.html',
  'ui/tools/area/trapezoid_height_division.html',
  'ui/tools/area/cyclicQuadrilateral.html',
  'ui/tools/area/irregular_quadrilateral.html',
  'ui/tools/area/triangle.html',
  'ui/tools/area/circle_sector.html',
  'ui/tools/area/regular_polygon.html',
  'ui/tools/area/square.html',
  'ui/tools/area/rectangle.html',
  'ui/tools/area/parallelogram.html',
  'ui/tools/area/rhombus.html',
  'ui/tools/area/kite.html',
  'ui/tools/area/annulus.html',
  'ui/tools/volumes/volumes_3d.html',
  'ui/tools/volumes/cube.html',
  'ui/tools/volumes/pyramid.html',
  'ui/tools/volumes/frustum_cone.html',
  'ui/tools/volumes/capsule.html',
  'ui/tools/volumes/ellipsoid.html',
  'ui/tools/construction/concrete_calc.html',
  'ui/tools/construction/land_leveling.html',
  'ui/tools/construction/bricks_calc.html',
  'ui/tools/construction/tiles_calc.html',
  'ui/tools/construction/paint_calc.html',
  'ui/tools/construction/steel_weight.html',
  'ui/tools/construction/steel_plate.html',
  'ui/tools/construction/excavation.html',
  'ui/tools/construction/plastering.html',
  'ui/tools/conversion/divide_area.html',
  'ui/tools/conversion/length_conv.html',
  'ui/tools/conversion/weight_conv.html',
  'ui/tools/conversion/temp_conv.html',
  'ui/tools/conversion/pressure_conv.html',
  'ui/tools/conversion/power_conv.html',
  'ui/tools/electrical/ohms_law.html',
  'ui/tools/electrical/elec_power.html',
  'ui/tools/electrical/volt_drop.html',
  'ui/tools/electrical/wire_size.html',
  'ui/tools/mechanical/speed_dist.html',
  'ui/tools/mechanical/force_calc.html',
  'ui/tools/mechanical/torque_calc.html',
  'ui/tools/mechanical/hydraulic_force.html',
  'ui/tools/math/percentage.html',
  'ui/tools/math/quadratic.html',
  'ui/tools/math/pythagoras.html',
  'ui/tools/math/trigonometry.html',
  'ui/tools/math/scale_map.html',
  'ui/tools/math/avg_calc.html',
  'ui/tools/math/slope_deg.html',
  'ui/tools/math/ratio_calc.html',
  'ui/tools/math/unit_price.html',
  // External dependencies
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
