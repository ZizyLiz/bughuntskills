# BB-005: Missing Security Headers Across All 3 In-Scope Targets

**Severity**: Medium | **CVSS**: 5.3 | **CWE**: CWE-693
**Affected URL**: Web, API, Identity servers

## Summary
All three in-scope targets are missing critical security headers. Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, and Cross-Origin-Resource-Policy are absent on all targets. The API gateway also lacks Content-Security-Policy.

## Proof of Concept
### Step 1
```
HEAD / HTTP/1.1 on each target
```
→ Missing: HSTS, X-Content-Type-Options, Referrer-Policy, Cross-Origin-Resource-Policy across all 3. API also missing CSP.

## Impact
- MITM downgrade possible (no HSTS)
- MIME sniffing attacks possible (no X-Content-Type-Options)
- Referrer leakage to third parties (no Referrer-Policy)

## Remediation
Add HSTS (max-age=31536000; includeSubDomains), X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin on all targets.

## Evidence
- evidence/BB-005_security_headers_audit.txt
