# BB-008: JSESSIONID Cookie Missing Secure and HttpOnly Flags

**Severity**: Low | **CVSS**: 3.7 | **CWE**: CWE-614
**Affected URL**: https://op-api-uat-ap1.shijicloud.com

## Summary
The API gateway sets JSESSIONID cookie without Secure or HttpOnly flags.

## Proof of Concept
### Step 1
```
GET / HTTP/1.1 on API gateway
```
→ Set-Cookie: JSESSIONID=xxx (no Secure, no HttpOnly)

## Impact
- Cookie vulnerable to MITM interception (no Secure flag)
- Cookie accessible via XSS (no HttpOnly flag)

## Remediation
Set Secure; HttpOnly; SameSite=Strict on all session cookies.

## Evidence
- evidence/BB-008_cookie_flags.txt
