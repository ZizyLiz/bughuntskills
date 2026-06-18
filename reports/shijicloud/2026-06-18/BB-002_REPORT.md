# BB-002: Swagger UI + Swagger Resources Publicly Accessible Without Authentication

**Severity**: High | **CVSS**: 7.5 | **CWE**: CWE-200
**Affected URL**: https://op-api-uat-ap1.shijicloud.com/swagger-ui.html

## Summary
The full Swagger UI interface and /swagger-resources endpoint are publicly accessible without any authentication. The resources endpoint exposes 3 API groups (ac, system, minipos) with their v2/api-docs paths, providing a complete API attack surface map to unauthenticated users.

## Proof of Concept
### Step 1
```
GET /swagger-ui.html HTTP/1.1
Host: op-api-uat-ap1.shijicloud.com
```
→ HTTP/1.1 200 OK
Full Swagger UI rendered — Springfox v2.10.0

### Step 2
```
GET /swagger-resources HTTP/1.1
Host: op-api-uat-ap1.shijicloud.com
```
→ HTTP/1.1 200 OK
[{"name":"ac","url":"/ac//v2/api-docs",...},{"name":"system",...},{"name":"minipos",...}]

## Impact
- Complete API inventory exposed to unauthenticated attackers
- 3 microservice groups enumerated
- Combined with JS source analysis reveals 32+ API endpoints

## Remediation
Restrict /swagger-ui.html and /swagger-resources to authenticated sessions only. Disable Swagger entirely in production environments.

## Evidence
- evidence/BB-002_swagger_ui.png
- evidence/BB-002_swagger_resources.json
