# Verified Not Vulnerable — shijicloud.com

These attack vectors were thoroughly tested and found to be properly secured:

- Actuator detail endpoints (/env, /mappings, /heapdump) — properly auth-gated (401 on clean session)
- CORS configuration — no arbitrary origin reflection with credentials
- Host header injection — properly blocked (403/404)
- HTTP request smuggling — nginx RFC-strict (returns 400)
- User enumeration timing — not statistically significant (0.2σ)
- Scope escalation — token scope fixed to 'app'
- Password policy — weak passwords properly rejected
- GraphQL — no endpoints detected
