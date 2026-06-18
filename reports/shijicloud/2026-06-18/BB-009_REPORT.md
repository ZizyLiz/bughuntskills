# BB-009: Hardcoded OAuth Client Secret in JavaScript Bundle

**Severity**: Low | **CVSS**: 3.1 | **CWE**: CWE-798
**Affected URL**: https://op-web-uat-ap1.shijicloud.com/assets/js/ (JS bundles)

## Summary
The web application JavaScript contains client_secret=123456 for the OAuth refresh token flow: grant_type=refresh_token&refresh_token=X&client_id=client&client_secret=123456.

## Proof of Concept
### Step 1
```
Review JS bundle source
```
→ client_secret=123456 hardcoded in client-side code

## Impact
- If refresh token endpoint does not validate client_secret, enables session hijacking

## Remediation
Never store secrets in client-side JavaScript. Use backend-to-backend communication for OAuth token exchange.

## Evidence
- evidence/BB-009_js_secret.txt
