# Agoda Booking Page XSS Assessment Report
## Target: www.agoda.com/book/*

### Summary
Comprehensive XSS assessment conducted against Agoda's booking SPA. The application is a React-based single-page application behind Akamai WAF/CDN with strong XSS filtering but notable missing security headers.

### Findings

#### 1. Missing Content-Security-Policy Header (Medium)
- No CSP header detected on any page response
- Implication: Any XSS vulnerability found would be fully exploitable without CSP as a second line of defense
- Fixed on some endpoints (observed on analytics.google.com calls via report-only CSP)

#### 2. Missing X-Frame-Options Header (Low)
- Pages lack X-Frame-Options or frame-ancestors CSP directive
- Allows clickjacking attacks

#### 3. Unauthenticated Information Disclosure via /getClientSideAssets (Low)
- `GET /getClientSideAssets` returns full inventory of JS/CSS bundle URLs
- No authentication, session, or rate limiting required
- Reveals exact CDN paths and hashed filenames
- Returns: `vendor_dll_.js`, `vendor.js`, `ccform.js`, design system, and CSS paths

#### 4. Unauthenticated SEO API Endpoint (Low)
- `POST /api/cronos/seo/search` returns SEO metadata without auth
- Includes metaText, openGraphs, twitterCards data
- Useful for mapping content structure

### XSS Test Results

| Vector | Result | Notes |
|--------|--------|-------|
| masterRoomTypeId reflection | **Not reflected** | SPA doesn't embed query params in HTML |
| checkIn/checkOut reflection | **Not reflected** | Same as above |
| SVG/IMG event handlers | **Blocked by WAF** | Akamai WAF times out on script payloads |
| Error page (errorpage.html) | **Not reflected** | Returns same SPA shell |
| API POST body injection | **Blocked by WAF** | Post body XSS triggers timeout |
| DOM XSS (ccform.js) | **No sinks found** | React SPA, no innerHTML/document.write |
| DOM XSS (vendor.js) | **No sinks found** | URLSearchParams used only for parsing |
| GW API endpoints | **Requires auth** | 302 redirects without session |
| Cart API (POST) | **No reflection** | Returns server status JSON |

### API Surface Discovered

**Working Endpoints (No Auth Required):**
- `GET /getClientSideAssets` — JS/CSS asset inventory
- `POST /api/cronos/seo/search` — SEO metadata
- `GET /api/cronos/geo/faq` — FAQ data (empty)
- `GET /api/cronos/geo/accommodations` — Accommodations (null)
- `POST /api/booking-bff/booking/setup` — Booking config

**Working Endpoints (Session Required):**
- `POST /api/cart/items` — Cart management
- `POST /api/gw/pages/HotelsBookingForm` — Booking form submit (500 w/o proper body)
- `POST /api/gw/BookingsV3/Setup` — Booking engine setup (302 without auth)

**Blocked/404 Endpoints:**
- `/api/gw/member/*` — Member endpoints (requires auth)
- `/api/review/*` — Review data (404)
- `/api/cronos/layout` — Layout data (404 without POST)
- `/api/cronos/home` — Home data (404)
- `/traveltips/*` — 403 Forbidden

### CDN Bundle Inventory
- `https://cdn6.agoda.net/cdn-bfspa/js/mspa/vendor_dll_.js` (vendor DLL)
- `https://cdn6.agoda.net/cdn-bfspa/js/mspa/vendor.js` (vendor bundle)
- `https://cdn6.agoda.net/cdn-bfspa/js/mspa/ccform.js` (booking form component)
- `https://cdn6.agoda.net/cdn-design-system/themes/4.67.0/agoda.js` (design system)
- Design system CSS + ccform CSS

### Security Headers Assessment
| Header | Present | Value |
|--------|---------|-------|
| Strict-Transport-Security | ✅ | max-age=2592000 |
| X-Content-Type-Options | ✅ | nosniff |
| Content-Security-Policy | ❌ | Missing |
| X-Frame-Options | ❌ | Missing |
| X-XSS-Protection | ❌ | Missing (deprecated) |
| Referrer-Policy | ❌ | Missing |
| Permissions-Policy | ❌ | Missing |

### Summary
Agoda's booking page is a well-hardened React SPA. No XSS vulnerabilities were identified after testing reflected, stored, and DOM-based vectors across all accessible API endpoints. The application's architecture (React JSX rendering, no innerHTML sinks, backend rendering only config data) prevents common XSS patterns. Akamai WAF provides additional protection blocking XSS payloads server-side. However, the missing CSP header leaves no defense-in-depth against XSS.
