# BB-007: Opaque 500 Errors on Invalid Authentication (Information Disclosure)

**Severity**: Medium | **CVSS**: 5.3 | **CWE**: CWE-209
**Affected URL**: https://op-api-uat-ap1.shijicloud.com/oauth/login

## Summary
All failed login attempts return HTTP 500 with {"code":"500","msg":"System Error","traceId":"..."} instead of a proper HTTP 401 with clean error messaging. The traceId leaks internal request tracking identifiers.

## Proof of Concept
### Step 1
```
POST /oauth/login with invalid credentials
```
→ HTTP 500 → {"code":"500","msg":"System Error","traceId":"d37cdfe7506d791a"}

## Impact
- Internal traceId values leaked to unauthenticated users
- Cannot differentiate between 'system down' and 'wrong password' for incident response
- Non-standard error handling exposes internal implementation details

## Remediation
Return HTTP 401 with {"error":"invalid_grant","error_description":"Invalid credentials"} for authentication failures.

## Evidence
- evidence/BB-007_error_responses.json
