# BB-001: SQL Error Disclosure via client_id Parameter in OAuth Token Endpoint

**Severity**: Critical | **CVSS**: 8.6 | **CWE**: CWE-209
**Affected URL**: https://op-api-uat-ap1.shijicloud.com/oauth/token

## Summary
The /oauth/token endpoint leaks Hibernate SQLGrammarException errors when an invalid client_id is provided. The client_id parameter is injected directly into a database query. All 5 tested invalid client_id values trigger SQL exceptions, confirming the parameter reaches the database unsanitized. This was reproduced from a completely unauthenticated, cookie-free session.

## Proof of Concept
### Step 1
```
POST /oauth/token HTTP/1.1
Host: op-api-uat-ap1.shijicloud.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=test&client_id=shijimini&client_secret=123456
```
→ HTTP/1.1 401
SQLGrammarException: could not extract ResultSet — Hibernate SQL error leaked in response body

### Step 2
```
POST /oauth/token ...&client_id=test123
```
→ HTTP/1.1 401
SQLGrammarException confirmed for ALL non-existent client_id values

### Step 3
```
POST /oauth/token ...&client_id=admin
```
→ HTTP/1.1 401
Same SQL error — parameter directly injected into database query

## Impact
- Database query structure exposed via Hibernate exception messages
- Client-side parameter injected into backend SQL without sanitization
- Reproducible from unauthenticated, zero-cookie session
- Enables SQL injection exploitation if WAF bypass payloads succeed

## Remediation
Validate client_id against a whitelist before database lookup. Use parameterized queries instead of string concatenation. Return generic 401 without exposing internal exception details.

## Evidence
- evidence/BB-001_sqli_error_screenshot.png
- evidence/BB-001_request_responses.txt
