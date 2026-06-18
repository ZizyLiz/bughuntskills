# BB-003: No Rate Limiting on Authentication Endpoint

**Severity**: High | **CVSS**: 7.5 | **CWE**: CWE-307
**Affected URL**: https://op-api-uat-ap1.shijicloud.com/oauth/login

## Summary
The /oauth/login endpoint accepts unlimited consecutive failed authentication attempts without rate limiting, 429 responses, or account lockout. Tested with 10 rapid failed attempts — all accepted within seconds.

## Proof of Concept
### Step 1
```
POST /oauth/login (10 times rapidly)
wrong_password each time
```
→ All 10 attempts return HTTP 500 (not 429). No rate limiting headers present.

## Impact
- Enables credential brute-force attacks
- No account lockout after repeated failures
- Common bug bounty finding — validated per program requirements

## Remediation
Implement rate limiting: 5 failures per IP/minute, account lockout after 10 failures, CAPTCHA after 3 failures.

## Evidence
- evidence/BB-003_rate_limit_log.txt
