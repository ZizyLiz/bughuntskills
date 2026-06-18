# BB-006: Nginx Server Version Disclosure

**Severity**: Medium | **CVSS**: 5.3 | **CWE**: CWE-200
**Affected URL**: Web and Identity servers

## Summary
The Web and Identity servers expose nginx/1.25.3 in the Server response header, enabling attackers to check for version-specific CVEs and vulnerabilities.

## Proof of Concept
### Step 1
```
HEAD / HTTP/1.1 on web and identity servers
```
→ Server: nginx/1.25.3

## Impact
- Enables targeted attacks using known nginx 1.25.3 vulnerabilities

## Remediation
Set server_tokens off; in nginx configuration.

## Evidence
- evidence/BB-006_server_headers.txt
