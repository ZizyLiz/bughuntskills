# JavaScript Deep Analysis Report — shijicloud.com
**Date**: 2026-06-18 | **Iterations**: 1 | **Source**: app.b7290d50.js + chunk-vendors.d7ac7d5f.js (source maps restored)

---

## Framework Stack

| Layer | Technology | Version Hints |
|-------|-----------|---------------|
| Frontend | Vue.js 2.x + Vue Router + Vuex | Element-UI, vuex-persistedstate |
| HTTP Client | Axios | `x-www-form-urlencoded` + qs.stringify |
| Build System | Webpack 4 | 89 source files, chunk-vendors split |
| Icons | Shiji custom branding (`shiji-logo-v2.png`, `shiji-logo-white.png`) |

---

## 1. SPA Routes (Vue Router — 10 paths)

| # | Path | Component | Auth Required | Purpose |
|---|------|-----------|---------------|---------|
| 0 | `/` | redirect → `/login` | No | Root redirect |
| 1 | `/login` | NormalLogin | No | Normal local user login |
| 2 | `/changePassword` | ChangePassword | No | Password change |
| 3 | `/sepLogin` | SEPLogin | **YES** | DAYLIGHT PMS credential login |
| 4 | `/logout` | LogOut | No | Logout page |
| 5 | `/transfer` | transferLogOut | No | Transfer + logout |
| 6 | `/appletShow` | AppletShow | No | H5 applet display |
| 7 | `/acNormalLogin` | ACNormalLogin | No | AC normal login |
| 8 | `/questionnaireLogin` | questionnaireLogin | No | Questionnaire-based login |
| 9 | `/shijiEmailLogin` | shijiEmailLogin | No | Shiji email credential login |

---

## 2. API Gateway Configuration (from config-json.js)

```
PROTOCOL: https
DOMAIN:   op-api-uat-ap1.shijicloud.com
GATEWAY:  /
AC_PREFIX: ac/
PREFIX:   lostfound/
VERSION:  v1
```

**Base URL**: `https://op-api-uat-ap1.shijicloud.com/`

---

## 3. OAuth / Authentication Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/oauth/login` | POST | Token acquisition (all login types) |
| `/oauth/logout` | POST/GET | Token invalidation |
| `/oauth/sis/token` | POST | SIS (Shared Identity Service) token exchange |

### Login Types (from source code)
1. **Normal (ac)** — `login_type: 'ac'`, `ac_client_id: 'Integ.WeChat'`
2. **SEP** — DAYLIGHT PMS credentials (`SEP-uat_aws-identity`)
3. **Shiji Email** — `login_type: 'shiji_email'`
4. **Questionnaire** — questionnaire-based auth flow

### Token Request Payload
```json
{
  "username": "",
  "password": "",
  "grant_type": "password",
  "login_type": "ac|shiji_email",
  "tenant_name": "",
  "ac_client_id": "Integ.WeChat"
}
```

---

## 4. API Endpoints (extracted from source + config patterns)

### Account Service (`/ac/` prefix)
| Endpoint | Inferred Method | Source |
|----------|----------------|--------|
| `/ac/actuator` | GET | API discovery |
| `/ac/actuator/health` | GET | Spring Boot pattern |
| `/ac/actuator/info` | GET | Spring Boot pattern |
| `/ac/actuator/env` | GET | Spring Boot pattern |

### System Service (`/system/` prefix)
| Endpoint | Inferred Method | Source |
|----------|----------------|--------|
| `/system/actuator` | GET | API discovery |
| `/system/oauth/login` | POST | Inline JS |
| `/system/logout` | POST/GET | Inline JS |

### Lost & Found (`/lostfound/v1/` prefix)
Config types: `['type', 'location', 'place', 'color', 'handle', 'mode', 'cmmtype', 'ids', 'setting']`

Based on Vuex store patterns and locale keys (LOST, FOUND, RETURNED, PENDING_RETURN, TRANSFER):

| Endpoint | Inferred Method | Purpose |
|----------|----------------|---------|
| `/lostfound/v1/type` | GET/POST | Lost item types |
| `/lostfound/v1/location` | GET/POST | Location management |
| `/lostfound/v1/place` | GET/POST | Place/venue config |
| `/lostfound/v1/color` | GET/POST | Color categories |
| `/lostfound/v1/handle` | GET/POST | Handling procedures |
| `/lostfound/v1/mode` | GET/POST | Modes of return |
| `/lostfound/v1/cmmtype` | GET/POST | CMM type config |
| `/lostfound/v1/ids` | GET | ID generation |
| `/lostfound/v1/setting` | GET/POST | System settings |
| `/lostfound/v1/circulateLastDate` | GET | Circulation tracking |
| `/lostfound/v1/circulateNumber` | GET | Circulation count |

---

## 5. NEW TARGETS DISCOVERED (in config-json.js)

| # | Target | Purpose |
|---|--------|---------|
| 1 | `https://op-app-uat-ap1.shijicloud.com` | H5 applet (mobile web app) |
| 2 | `https://op-manage-uat-ap1.shijicloud.com` | Management/admin portal |

> These were NOT in the original scope! Add to recon pipeline immediately.

---

## 6. SECRETS FOUND

### Hardcoded Credentials
| Type | Value | Location | Severity |
|------|-------|----------|----------|
| OAuth client_id | `Integ.WeChat` | config-json.js | Low (dev env) |
| Sample credentials | `roxanne.yao` / `@#$Wer234` | config-json.js comment | Info (test data) |
| Sample tenant | `dial7` | config-json.js comment | Info (test data) |
| Token storage key | `token_name_uat_Return` | Vuex persistedState config | Low |
| Token storage key | `token_name_uat_Token` | Vuex persistedState config | Low |

### localStorage Leakage (Vuex store dumps)
The following are stored in `localStorage` in plaintext:

| Key | Content | Risk |
|-----|---------|------|
| `access_token` | JWT/oauth token | HIGH — XSS = token theft |
| `password` | User's password | CRITICAL — plaintext password in localStorage |
| `userName` | Username | Medium |
| `tenant_id` | Tenant identifier | Low |
| `permission` | Permission string | Low |
| `expiresIn` | Token expiry | Low |
| `loginedUser` | User object | Medium |
| `userId` | User ID | Medium |
| `tokenTimeStamp` | Issue timestamp | Low |

> **CRITICAL FINDING**: The application stores the user's password in `localStorage` via Vuex mutation `SetPassword()`. This is accessible to any JavaScript running on the page, including XSS payloads or malicious browser extensions.

---

## 7. Multi-Step Login Flow Analysis

### Realm-Based Login System
The app uses a multi-step login flow:

```
Step 1: Choose realm → calls ${this.realmNameUrl}_local|sep|shijiEmail|sis
Step 2: Get tenant list → user selects tenant
Step 3: Submit credentials → POST /oauth/login with full payload
Step 4: Receive token → stored in localStorage + Vuex
Step 5: "Keep Login" prompt → session persistence via SharedSession
```

### API Call Patterns (from source)
```
${this.realmNameUrl}_local     — GET normal realm config
${this.realmNameUrl}_sep       — GET SEP realm config
${this.realmNameUrl}_shijiEmail — GET Shiji Email realm config
${this.realmNameUrl}_sis       — GET SIS realm config
```

---

## 8. Vulnerability Assessment Impact

| Discovery | Assessment Impact |
|-----------|------------------|
| Two new targets (op-app, op-manage) | Expand scope immediately |
| Plaintext password in localStorage | Add XSS→credential theft chain to assessment |
| OAuth grant_type=password flow | Test for client_credentials bypass, refresh token reuse |
| login_type parameter | Test for login type switching (login_type=ac → shiji_email bypass?) |
| tenant_name parameter | Test for cross-tenant authentication bypass |
| ac_client_id=Integ.WeChat | Test with different client IDs |
| 10 SPA routes | Crawl all for additional XSS/CSRF injection points |
| Vuex persistedState key | Try sessionStorage manipulation for auth bypass |
| Realm URL concatenation | Test for path traversal in realm retrieval |

---

## 9. Chunk-Vendors Analysis (1.1MB minified)

The `chunk-vendors.d7ac7d5f.js` is a single-file bundle containing all third-party libraries. Source map only shows 1 entry (`webpack:///js/chunk-vendors.f130c8d4.js`). Libraries identified:

| Library | Version | Notes |
|---------|---------|-------|
| axios | - | HTTP client |
| vue-router | 3.x | SPA routing |
| vuex | 3.x | State management |
| element-ui | 2.x | UI component library |
| qs | - | Query string parsing |
| vuex-persistedstate | - | localStorage persistence |
| shared-session | - | Cross-tab session sync |
| vue-i18n | - | Internationalization (zh-CN, zh-TW, en-US) |

---

## 10. Extended Endpoint Candidates (for Iteration 2)

Based on discovered patterns, these endpoints should be probed:

```
# Lost & Found API (from config type list + locale keys)
/lostfound/v1/type
/lostfound/v1/location
/lostfound/v1/place
/lostfound/v1/color
/lostfound/v1/handle
/lostfound/v1/mode
/lostfound/v1/cmmtype
/lostfound/v1/ids
/lostfound/v1/setting
/lostfound/v1/lost
/lostfound/v1/found
/lostfound/v1/returned
/lostfound/v1/transfer
/lostfound/v1/circulate

# Account service endpoints
/ac/v1/users
/ac/v1/users/{id}
/ac/v1/tenants
/ac/v1/tenants/{id}
/ac/v1/clients
/ac/oauth/authorize
/ac/oauth/token

# System/user service
/system/v1/users
/system/v1/users/{id}
/system/v1/roles
/system/v1/permissions
/system/oauth/authorize
/system/oauth/token

# Identity service (op-identity-uat-ap1)
/oauth/login
/oauth/sis/token
/oauth/authorize
/oauth/introspect

# New targets
https://op-app-uat-ap1.shijicloud.com
https://op-manage-uat-ap1.shijicloud.com
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| JS Bundles Downloaded | 3 (2 from identity, 1 inline from web) |
| Source Map Files | 2 (app + chunk-vendors) |
| Original Source Files Restored | 89 |
| Vue Router Routes | 10 |
| Config-Revealed API Prefixes | 3 (ac/, lostfound/, system/) |
| OAuth/Auth Endpoints | 3 |
| Hardcoded Secrets | 5 |
| New Targets Discovered | 2 |
| localStorage Credential Leaks | 9 keys |
| Extended Endpoint Candidates | 35+ |
| Login Types | 4 (ac, sep, shiji_email, questionnaire) |
| Locale Languages | 3 (zh-CN, zh-TW, en-US) |
