# Optimization Proposals & Status

This document outlines potential optimizations for the Minhas Finanças Pro project, focusing on performance, maintainability, and code quality.

## 1. Architecture & Performance

### 1.1 Replace Tailwind CDN with Build Step [COMPLETED]
**Current State:** The project loads Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com"></script>`). This involves downloading a large script and compiling CSS in the browser at runtime.
**Action:** Implemented a build process using Tailwind CLI. The project now uses `css/output.css`.
**Benefits:**
- **Performance:** Generates a minimal, pre-purged CSS file (~10kb vs 3mb+ script). Drastically reduces Time-to-First-Paint.
- **Offline:** The app will work fully offline without relying on the CDN.
- **Consistency:** Ensures fixed versions of styles.

### 1.2 Data Caching Strategy [COMPLETED]
**Current State:** `DataService.js` fetches and parses data every time the application initializes (page reload).
**Action:** Implemented `localStorage` caching for the parsed transaction data with a time-to-live (TTL) mechanism (e.g., 5-10 minutes).
**Benefits:**
- **Instant Load:** Subsequent visits load instantly without network requests.
- **Reliability:** App works even if the network (or the proxy) flakes out temporarily.

### 1.3 Web Workers for Parsing [COMPLETED]
**Current State:** TSV parsing and data processing happen on the main thread in `DataService.js`.
**Action:** Offloaded the `parseBankStatement` and regex operations to a Web Worker (`js/workers/parser.worker.js`).
**Benefits:**
- **Responsiveness:** Prevents the UI from freezing/janking during the initial load of large transaction histories.

## 2. Code Quality & Maintainability

### 2.1 Refactor to ES Modules [ATTEMPTED & REVERTED]
**Current State:** The project uses the "Namespace Pattern" (attaching `DataService`, `UI`, `Tables` to `window`).
**Action:** Attempted conversion to standard ES Modules (`import`/`export`).
**Outcome:** Reverted. The project relies on direct script loading in `index.html` without a build system (like Webpack/Vite) for JS. Browsers require strict `type="module"` usage which caused issues with the existing architecture and global accessibility needed by inline HTML handlers. The global namespace pattern was restored.

### 2.2 Strict Parsing & Validation
**Current State:** The parser assumes a specific TSV format and might be fragile to changes in bank export formats.
**Proposal:** specific schema validation (e.g., using `zod` or manual checks) to warn the user if the input format has changed, rather than silently failing or producing bad data.

## 3. Visuals & UX Improvements

### 3.1 Chart Rendering Optimization [COMPLETED]
**Current State:** Charts are re-created on tab switches.
**Action:** Implemented `resizeDelay` for chart instances and debounce resize events in `ChartManager.js`.
**Benefits:** Smoother resizing experience on mobile/desktop without layout thrashing.

### 3.2 Accessibility (a11y) [COMPLETED]
**Current State:** Some interactive elements (icons/divs) may lack semantic tags or labels.
**Action:**
- Added `aria-label` to icon-only buttons (like Privacy and Theme toggles).
- Ensured interactive elements use correct tags.

## 4. Security & Privacy

### 4.1 Proxy Dependency
**Current State:** The app uses `api.allorigins.win` as a fallback proxy for fetching data.
**Proposal:** If feasible, configure CORS headers on the source server or use a dedicated backend/lambda function.
**Reason:** Sending financial data URLs (even if just file paths) through a public third-party proxy poses a privacy risk.
