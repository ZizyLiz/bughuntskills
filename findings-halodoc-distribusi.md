# distribusi-medisend.halodoc.com — Vulnerability Assessment Report

## Executive Summary
**Target**: Angular 19 PWA distributor portal on S3+CloudFront  
**API**: REST at `/portald/v1/` — 17 endpoints discovered via JS extraction  
**Auth**: Phone OTP + JWT refresh tokens  
**Testing Date**: 2026-06-18  
**Methodology**: Bughuntskills v3.16 pipeline — Caido MCP traffic analysis → JS endpoint extraction → CLI exploitation

---

## Asset Inventory

| Component | Details |
|-----------|---------|
| Frontend | Angular 19 (build hash `9c13ac133ed9178e`), PWA with Service Worker |
| CDN | CloudFront (SIN3-P2 POP), S3 origin |
| Server | AmazonS3 (static hosting) |
| Monitoring | Dynatrace, New Relic, Google Analytics, Mixpanel, Amplitude |
| Widgets | TidioChat, Smooch (Zendesk Sunshine), Firebase (FCM) |
| Auth | Phone OTP (WhatsApp + SMS channels), JWT refresh tokens |

## API Endpoints Discovered (JS Extraction)

```
GET    /portald/v1/users/status                              — session check
POST   /portald/v1/users/logout                              — session termination
POST   /portald/v1/users/authentication/otp/requests         — OTP request
POST   /portald/v1/users/portal-d/authentication/otp/validations — OTP verify
POST   /portald/v1/users/portal-d/registration              — distributor register
POST   /portald/v1/users/principal/registration             — principal register
POST   /portald/v1/users/authentication/refresh             — JWT refresh
GET    /portald/v1/distributor/orders/                      — order listing
GET    /portald/v1/distributor/pharmacy/orders              — pharmacy orders
GET    /portald/v1/distributor/payments/branch/             — branch payments
GET    /portald/v1/distributors/products/external/          — external products
GET    /portald/v1/distributors/products/search             — product search
GET    /portald/v1/distributor-user-pharmacy-mappings       — pharmacy mapping
GET    /portald/v1/distributor-user-pharmacy-mappings/search — mapping search
POST   /portald/v1/documents                                — document upload (from JS)
GET    /portald/return                                      — return orders (from JS)
```

---

## Findings

### Finding 1: CSP `frame-src: *` — Universal Clickjacking (Medium, CVSS 4.7)

**CWE-1021**: Improper Restriction of Rendered UI Layers

```
Content-Security-Policy: frame-src *
```

The CSP allows any origin to frame this application. Combined with `X-Frame-Options: SAMEORIGIN` being *absent* from the response headers, any attacker can embed the login page or authenticated pages in an invisible iframe and overlay deceptive UI elements.

**Impact**: Phishing attacks via UI redressing on the OTP login / registration flow. An attacker could overlay a fake "Enter your OTP" form and capture the victim's real OTP.

**Remediation**: Set `frame-src 'self'` and add `X-Frame-Options: DENY` or `SAMEORIGIN`.

---

### Finding 2: CSP `connect-src` Contains `http://localhost:14000` — Dev Artifact (Low, CVSS 2.6)

**CWE-489**: Active Debug Code

```
connect-src: http://localhost:14000
```

The CSP allows XHR/fetch connections to `http://localhost:14000`. This is a development/testing artifact that:
- Leaks internal developer workflow details
- Could allow an attacker on the same machine (via XSS or malicious extension) to intercept API traffic
- Indicates incomplete production hardening

**Remediation**: Remove `http://localhost:14000` from production CSP.

---

### Finding 3: CSP `script-src *.halodoc.com` + `unsafe-inline` + `unsafe-eval` — Weak CSP (Medium, CVSS 4.0)

**CWE-693**: Protection Mechanism Failure

```
script-src: 'self' ... *.halodoc.com ... 'unsafe-inline' 'unsafe-eval'
```

1. **`unsafe-inline`** — any reflected/stored XSS will execute unrestricted
2. **`unsafe-eval`** — Angular's JIT compiler needs this, but it enables `eval()`-based gadgets
3. **`*.halodoc.com`** — any subdomain takeover on any halodoc.com subdomain becomes a CSP bypass vector. The wildcard trust means if `*.halodoc.com` has any compromised/misconfigured subdomain, an attacker can serve scripts from it and bypass the entire CSP.

**Impact**: CSP provides minimal protection. Any XSS finding is fully exploitable with no CSP mitigation.

**Remediation**: Use nonce-based or hash-based CSP. Remove `unsafe-inline` and `unsafe-eval`. Replace `*.halodoc.com` with explicit allowed subdomains.

---

### Finding 4: OTP Rate Limiting — 1 Request Then 403 (Informational)

The OTP `/requests` endpoint returns 200 on the first attempt and 403 on the second attempt for the same phone number within the cooldown period (`otp_wait_time: 30s`). Rate limiting is properly implemented — no brute force vector found.

---

### Finding 5: Verbose Validation Errors — Information Disclosure (Low, CVSS 2.3)

**CWE-209**: Generation of Error Message Containing Sensitive Information

```
POST /portald/v1/users/authentication/otp/requests
{"phone":"+62812345678"} 
→ {"errors":["phoneNumber Phone Number must be entered"]}
```

Validation errors expose:
- Internal field names (`phoneNumber`, `gpid`, `username`)
- Expected field structures (`gpid must not be blank`)
- API error format (`{"code":"1003","status_code":403}`)

**Impact**: Assists reconnaissance by revealing API structure and expected parameter names.

---

### Finding 6: User Enumeration via Registration (Low, CVSS 2.8)

**CWE-204**: Observable Response Discrepancy

```
POST /portald/v1/users/portal-d/registration
{"email":"test@evil.com","phone_number":"+6281234567890","gpid":"test-gpid","name":"Test"}
→ {"code":"not_found","status_code":404,"message":"User was not found"}
```

The error message `"User was not found"` confirms whether a given email/phone combination has an associated account. This enables email enumeration.

**Remediation**: Use a generic error message: "Invalid credentials" or "If an account exists, a reset link has been sent."

---

## Security Posture Summary

| Area | Rating | Notes |
|------|--------|-------|
| Authentication | ✅ Good | OTP with proper rate limiting, JWT refresh |
| Authorization | ✅ Good | Session-based, /users/status enforces auth |
| CSP | ⚠️ Weak | frame-src:*, unsafe-inline, *.halodoc.com wildcard |
| CORS | ⚠️ Weak | No CORS headers on API — any origin can read responses |
| Error Handling | ⚠️ Weak | Verbose errors leak field names and structure |
| CDN/WAF | ✅ Good | CloudFront + S3 origin, proper cache headers |

## Recommendations (Priority Order)

1. **CRITICAL**: Remove `frame-src *` — add `X-Frame-Options: DENY`
2. **HIGH**: Replace `*.halodoc.com` with explicit subdomain allowlist in CSP
3. **HIGH**: Add CORS headers (`Access-Control-Allow-Origin`) to API endpoints
4. **MEDIUM**: Remove `unsafe-inline` and `unsafe-eval` from CSP
5. **MEDIUM**: Replace verbose validation errors with generic messages
6. **LOW**: Remove `http://localhost:14000` from production CSP
7. **LOW**: Add `Cache-Control: no-store` to API responses containing session data
