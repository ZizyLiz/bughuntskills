# BB-004: Token Not Invalidated After Logout, No Concurrent Session Limit

**Severity**: High | **CVSS**: 7.5 | **CWE**: CWE-613
**Affected URL**: https://op-api-uat-ap1.shijicloud.com/system/logout

## Summary
After calling GET /system/logout which returns HTTP 302, the access token remains fully valid. Additionally, generating 3 concurrent login sessions produces 3 independently valid tokens that can be used simultaneously without any session limit enforcement.

## Proof of Concept
### Step 1
```
GET /system/logout
```
→ HTTP 302 — redirected

### Step 2
```
GET /swagger-resources (same token, after logout)
```
→ HTTP 200 — token still valid after logout!

### Step 3
```
3 concurrent login calls → 3 tokens generated → all 3 valid simultaneously
```
→ All 3 tokens return HTTP 200 on protected endpoints

## Impact
- Stolen tokens persist after user logout
- Multiple concurrent sessions bypass session management
- Token expires_in: 12 hours — long window for abuse

## Remediation
Implement server-side token revocation on logout. Limit concurrent sessions per user. Reduce token expiry time to 1 hour with refresh rotation.

## Evidence
- evidence/BB-004_logout_token_reuse.txt
