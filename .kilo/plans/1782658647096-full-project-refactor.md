# Refactor Plan: Area Calculator PWA

## Current State Assessment

**What exists:** Pure frontend PWA (no build step, no bundler). 30+ standalone HTML calculator pages, one monolithic `index.html` (714 lines), scattered JS modules.

**Target:** Apply layered architecture adapted for frontend-only: clear ownership per file, data-driven UI, no mixed concerns.

---

## Smell Map (current → principle → fix)

### 1. `index.html` — God Module
- **Lines 11-392:** CSS for app shell + bottom-nav + cards + buttons + Dark Mode — everything in one `<style>`
- **Lines 429-980:** Single `<script type="module">` mixes: SPA router, UI state, dark mode toggle, unit system (AREA_UNITS/VOLUME_UNITS), converter functions, session save/restore, DOMContentLoaded bootstrap
- **Principle:** SRP — one file answers 7+ questions
- **Fix:** Extract to `lib/` modules: `navigation.js`, `units.js`, `session.js`

### 2. `main_screen.html` — Hardcoded Tool Grid
- **Lines 17-80+:** 30+ hardcoded `<div class="tool-item">` blocks, each repeating the same icon/details/arrow pattern
- **Principle:** DRY — data that changes together (tool list) should live in one place
- **Fix:** `tools-data.js` already has the registry. Main screen should generate the grid from it via one JS call.

### 3. `tools-data.js` — Registry with Legacy Flag Drift
- **Lines 7-15:** Category constants are fine
- **Lines 17-84:** All 49 tools have `legacy: true` — the flag is meaningless noise, every entry has it
- **Principle:** Lean code — remove noise; YAGNI on unused flags
- **Fix:** Remove `legacy` field

### 4. `utils.js` — Unused/Partial Utility
- **Lines 1-56:** Has `convertToFeddans` (duplicated in `index.html`), `Geometry` object, `formatResult`
- **Same math exists inline in `index.html` lines 580-630** — duplicated domain logic
- **Principle:** DRY + single source of truth for math
- **Fix:** Remove math from `index.html`, consolidate in `lib/geometry.js`, delete冗余 from `utils.js`

### 5. `firebase-logic.js` — Side Effects on Import
- **Lines 29-36:** Firebase is initialized at module top-level (`initializeApp` runs on import)
- **Lines 266-284:** Pollutes `window.firebaseLogic`, adds `online` event listener globally
- **Principle:** Import-time side effects; implicit global coupling
- **Fix:** Export a `createFirebaseClient()` factory; remove `window.firebaseLogic` globals

### 6. Scattered HTML Pages (root directory)
- 30+ `.html` files at root level, all following the same pattern: `<title>`, card markup, inline `<style>`, inline `<script>`
- Hard to navigate, no logical grouping
- **Principle:** Ownership obvious — related files grouped together
- **Fix:** Group into `features/area/`, `features/volumes/`, `features/construction/`, `features/conversion/`, `features/electrical/`, `features/mechanical/`, `features/math/`

### 7. Calculator Pages — Mixed Style/Logic
- Each calculator page has its own inline `<style>` and inline `<script oninput="calculateArea()">`
- No shared base styles (buttons, inputs, cards already defined in `index.html` but redefined in each page)
- **Principle:** Reuse patterns; move shared presentation to shared layer
- **Fix:** Calculator pages keep page-specific layout; shared components extracted to `lib/ui-helpers.js`. Pages use `oninput` pattern consistently.

### 8. Duplicate Script Tags in `index.html`
- **Lines 429-443:** html2canvas, export-image, mini-calculator, reset-button, zoom-handler loaded twice (static + dynamic in module)
- **Principle:** Lean code — remove duplication
- **Fix:** Load once (already handled in current version)

---

## Execution Plan (9 Steps, Behavior-Preserving)

### Step 0: Extract `lib/styles.css` — Shared Stylesheet (BEFORE everything else)
- Move global styles from `index.html` to `lib/styles.css`:
  - `:root` variables
  - `body`, `.app-bar`, `.user-profile-btn`, `.nav-btn`
  - `#main-content`
  - `.bottom-nav`, `.bottom-nav-item` (+ active/press states)
  - `.card`, `.card:active`
  - `input, select`, `input:focus`
  - `button.btn-main`, `.btn-main:active`
  - `.unit-selector`
  - `.result-header`, `.result-unit-row`
  - `.page-enter`, `@keyframes iosSlideUp`
  - All `body.dark-mode` and `.dark-mode *` rules
  - `.loading-overlay`, `.spinner` (if present)
- Link `lib/styles.css` from `index.html` with `<link rel="stylesheet" href="lib/styles.css">`
- Each calculator page that redefines these shared rules: strip its `<style>` block of shared selectors, keep only page-specific selectors
- Verify: App shell + 3 calculator pages (triangle, rectangle, circle_sector) render identically

### Step 1: Extract `lib/registry.js` from `tools-data.js`
- Remove `legacy` field from all 49 entries
- Export clean `TOOL_CATEGORIES` + `TOOLS` as before
- Verify: `main_screen.html` still renders when data is consumed

### Step 2: Extract `lib/units.js` from `index.html`
- Move `AREA_UNITS`, `VOLUME_UNITS`, `getSelectedUnit`, `setSelectedUnit`, `formatAreaValue`, `formatVolumeValue`, `createUnitSelectorHTML` to `lib/units.js`
- Update `index.html` to import from `lib/units.js`
- Verify: Unit selector dropdowns still work, saved results still show correct units

### Step 3: Extract `lib/geometry.js` from `utils.js` + `index.html`
- Consolidate `convertToFeddans` (currently duplicated in both `utils.js` and `index.html`)
- Move `Geometry` object from `utils.js`
- Remove duplicates from `index.html`
- Verify: Trapezoid and triangle calculations produce identical numbers

### Step 4: Extract `lib/navigation.js` from `index.html`
- Move `navigateTo`, `updateUIState`, `goBack`, `toolPages` array
- Keep router logic, DOM manipulation stays in `index.html` but calls imported functions
- Verify: All 3 nav buttons (الرئيسية, الآلة, المحفوظات) navigate correctly

### Step 5: Extract `lib/session.js` from `index.html`
- Move `saveSession`, `restoreSession`, `saveSession` call in beforeunload
- Verify: Navigate away and back — form data is preserved

### Step 6: Extract `lib/firebase-client.js` from `firebase-logic.js`
- Remove top-level side effects; export `createFirebaseClient(firebaseConfig)` factory
- Remove `window.firebaseLogic` — callers import directly
- Verify: Login/logout/save/restore flow unchanged (check `login.html` + `saved_results.html`)

### Step 7: Reorganize calculator pages into `features/` folders
Move each `.html` file to its category folder:
```
features/area: trapezoid, trapezoid_height_division, cyclicQuadrilateral, irregular_quadrilateral, triangle, circle_sector, regular_polygon, square, rectangle, parallelogram, rhombus, kite, annulus
features/volumes: volumes_3d, cube, pyramid, frustum_cone, capsule, ellipsoid
features/construction: concrete_calc, land_leveling, bricks_calc, tiles_calc, paint_calc, steel_weight, steel_plate, excavation, plastering
features/conversion: divide_area, length_conv, weight_conv, temp_conv, pressure_conv, power_conv
features/electrical: ohms_law, elec_power, volt_drop, wire_size
features/mechanical: speed_dist, force_calc, torque_calc, hydraulic_force
features/math: percentage, quadratic, pythagoras, trigonometry, scale_map, avg_calc, slope_deg, ratio_calc, unit_price
```
- Update `navigateTo` in `lib/navigation.js` to map old paths → new paths
- Verify: Every tool card in `main_screen.html` still opens its calculator

### Step 8: Make `main_screen.html` data-driven
- Remove all 30+ hardcoded `.tool-item` blocks
- Import `TOOLS` + `TOOL_CATEGORIES` from `lib/registry.js`
- Generate grid from data with one rendering function
- Verify: Tool grid looks identical, all icons/categories/colors preserved

---

## Final Target Structure

```
area/
├── index.html                 # App shell (UI only, thin)
├── main_screen.html           # Home (thin view)
├── settings.html
├── login.html
├── profile.html
├── setup.html
├── saved_results.html
├── calculator.html
│
├── lib/
│   ├── registry.js            # Tool definitions (single source of truth)
│   ├── units.js               # Area/volume units + formatters
│   ├── geometry.js            # All shared math
│   ├── navigation.js          # Router + UI state
│   ├── session.js             # LocalStorage session save/restore
│   ├── firebase-client.js     # Firebase auth + sync
│   └── ui-helpers.js          # Shared card/input/button helpers
│
├── features/
│   ├── area/                  # 13 shape calculators
│   ├── volumes/               # 6 3D calculators
│   ├── construction/          # 9 construction calculators
│   ├── conversion/            # 6 unit converters
│   ├── electrical/            # 4 electrical calculators
│   ├── mechanical/            # 4 mechanical calculators
│   └── math/                  # 9 math calculators
│
├── modules/
│   └── survey-analyzer/       # (already deleted)
│
├── sw.js
├── manifest.json
└── icon.png
```

---

## Validation Plan

After each step:
1. Open `index.html` in browser — does it load?
2. Click each bottom-nav button — does it navigate?
3. Toggle dark mode — does it persist?
4. Open settings — does it load?
5. Open one calculator from each category — does it calculate correctly?
6. Save a result — does it persist in saved_results?

## Out of Scope (deliberately)
- Adding TypeScript or a build step (current project is vanilla HTML/JS)
- Adding tests (no test infrastructure exists)
- Changing any calculation formulas or UI layout
- Firebase migration to different backend
