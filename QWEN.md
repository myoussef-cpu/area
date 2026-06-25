# Area Calculator App (تطبيق حساب المساحات)

## Project Overview

This is a **Progressive Web App (PWA)** for calculating areas, volumes, and various engineering/construction-related measurements. The app is designed with a mobile-first, iOS-inspired glassmorphism UI with Arabic (RTL) language support.

### Key Features
- **50+ Engineering Tools**: Trapezoid area, triangle, circle sectors, regular polygons, 3D volumes, concrete calculations, land leveling, unit conversions, and more
- **Offline Support**: Full PWA capabilities via Service Worker with cache-first strategy
- **Cloud Sync**: Firebase integration (Auth + Firestore) for saving and syncing calculations across devices
- **Google Sign-In**: Authentication via Google with automatic data synchronization
- **Dark Mode**: Toggle between light and dark themes with persistent preferences
- **Floating Mini Calculator**: Draggable, draggable mini-calculator widget
- **Visual Shape Drawing**: Canvas-based geometric shape rendering with dimension labels
- **Save & Retrieve Results**: Local storage fallback when offline, cloud sync when online

### Architecture
- **SPA-like Navigation**: Dynamic page loading via `fetch()` + `DOMParser`, injecting HTML fragments into `#main-content`
- **Firebase Modules**: Modular ES6 imports from Firebase v10.7.1 CDN
- **LocalStorage First**: All data saved locally first, then synced to Firestore when authenticated
- **Modular Design**: Each tool is a standalone `.html` file with embedded styles and scripts

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Vanilla HTML/CSS/JavaScript (ES6 Modules) |
| PWA | Service Worker (`sw.js`), `manifest.json` |
| Backend | Firebase (Authentication + Firestore) |
| UI | Custom CSS with Glassmorphism, Font Awesome 6.4.0, Tajawal font |
| Storage | LocalStorage + Firestore |

## Project Structure

```
area-main/
├── index.html                 # Main entry point, SPA shell, navigation logic
├── main_screen.html           # Home dashboard with tool grid
├── login.html                 # Google sign-in page
├── profile.html               # User profile page
├── saved_results.html         # Saved calculations history
├── settings.html              # App settings
├── calculator.html            # Full-screen calculator tool
├── all_tools.html             # Directory of all available tools
├── smart_tool.html            # Smart/adaptive tool finder
│
├── firebase-config.js         # Firebase configuration (API keys)
├── firebase-logic.js          # Auth, Firestore CRUD, sync logic (ES module)
├── utils.js                   # Shared geometry & unit conversion utilities
├── mini-calculator.js         # Floating mini-calculator widget
├── reset-button.js            # Reset/clear button functionality
├── tools-data.js              # Tool metadata/directory data
├── sw.js                      # Service Worker for offline support
├── manifest.json              # PWA manifest
│
├── trapezoid.html             # Trapezoid area + division calculator
├── triangle.html              # Triangle area calculator
├── circle_sector.html         # Circle and sector calculations
├── regular_polygon.html       # Regular polygon area calculator
├── volumes_3d.html            # 3D volume calculator (cylinder, sphere, cone)
├── concrete_calc.html         # Concrete quantity calculator
├── land_leveling.html         # Land leveling and slope calculator
├── divide_area.html           # Area division and unit converter
├── cyclicQuadrilateral.html   # Cyclic quadrilateral area calculator
├── irregular_quadrilateral.html # Irregular quadrilateral area calculator
├── trapezoid_height_division.html # Trapezoid division by height
│
├── ... (50+ other tool HTML files)
├── icon.png                   # App icon (192x192, 512x512)
└── QWEN.md                    # This file
```

## Key Files Explained

### `index.html`
- **Core SPA shell**: Contains the app bar, main content area, and bottom navigation
- **`navigateTo(page)`**: Fetches HTML fragments, parses them, injects content, and executes embedded scripts
- **`updateUIState(page)`**: Updates the active bottom nav indicator with animated sliding capsule
- **Dark mode toggle**: Persists preference in `localStorage`
- **`convertToFeddans(area)`**: Shared utility for Egyptian land units (Feddan, Qirat, Sahm)

### `firebase-logic.js`
- **`loginWithGoogle()`**: Google OAuth via popup
- **`logoutUser()`**: Sign out and redirect
- **`saveResult(data)`**: Save calculation (local + cloud if authenticated)
- **`fetchResults()`**: Retrieve calculations (cloud + local merge, deduplication)
- **`deleteResult(timestamp, cloudId)`**: Delete from local and/or cloud
- **`syncLocalToCloud(userId)`**: Smart sync unsynced local data to Firestore
- Exports `window.firebaseLogic` for use in tool pages

### `sw.js` (Service Worker)
- **Cache-first strategy**: Tries network first, falls back to cache
- **Caches**: Core HTML, JS, fonts, icons, Firebase SDK
- **Auto-updates cache** on successful network responses
- **Offline fallback**: Returns `index.html` for navigation requests

## Building and Running

### Local Development
This is a **static web app** — no build step required. Simply serve the files:

```bash
# Option 1: Python 3
python -m http.server 8000

# Option 2: Node.js (npx)
npx serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8000` in your browser.

### PWA Installation
1. Serve over HTTPS (required for PWA)
2. Open in Chrome/Edge mobile
3. Tap "Add to Home Screen" when prompted
4. App will work fully offline after first visit

### Firebase Setup
The app currently uses a pre-configured Firebase project (`area-ff605`). To use your own:
1. Create a new project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → Google Sign-In
3. Enable **Firestore Database**
4. Update `firebase-config.js` with your credentials

## Development Conventions

### Code Style
- **Arabic comments**: Code comments are written in Egyptian Arabic for the target developer audience
- **RTL Layout**: All pages use `dir="rtl"` and right-aligned text
- **CSS Variables**: Theme colors defined in `:root` for easy dark mode switching
- **Inline Styles**: Each tool HTML file embeds its own `<style>` and `<script>` blocks (self-contained modules)

### Navigation Pattern
```javascript
// Tool pages expose functions to window scope for onclick handlers
window.calculateArea = function() { ... }
window.saveResult = function() { ... }

// Navigation via SPA router
navigateTo('trapezoid')  // Loads trapezoid.html into #main-content
navigateTo('main')       // Returns to home screen
```

### Data Saving Pattern
```javascript
// All tools follow this pattern:
const data = {
    type: "شبه منحرف",           // Tool type
    input: `قواعد: ${a}, ${b}`,  // Input summary
    result: resultText,           // Result text
    details: detailsText          // Additional details
};

window.firebaseLogic.saveResult(data)
    .then(() => /* success */)
    .catch(/* error handling */);
```

### UI Component Patterns
- `.card`: Glassmorphic card with backdrop-filter blur
- `.btn-main`: Primary action button with shadow and press animation
- `.hidden`: Utility class for `display: none`
- Dark mode via `body.dark-mode` class with CSS variable overrides

## Egyptian Land Unit Conversions

The app uses traditional Egyptian land measurements:
- **1 Feddan (فدان)** = 4200.83 m²
- **1 Qirat (قيراط)** = 175.03 m²
- **1 Sahm (سهم)** = 7.29 m²
- **24 Sahms = 1 Qirat**
- **24 Qirats = 1 Feddan**

## Browser Support

- Chrome/Edge 80+ (recommended)
- Safari 13+ (iOS)
- Firefox 75+
- Requires modern JS support (ES6 modules, `async/await`, `fetch`, `backdrop-filter`)

## Notes

- **Firebase API keys** are exposed in `firebase-config.js` — this is acceptable for client-side apps but ensure Firestore security rules are properly configured
- **No build/bundle tool**: Dependencies load from CDNs (Firebase, Font Awesome, Google Fonts)
- **Service Worker cache version**: `area-calc-v14` — increment when updating cached assets
- **Git**: This is a git repository with `.gitignore` configured
