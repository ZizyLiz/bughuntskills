---
name: bug-bounty-methodology
description: >-
  Master orchestrator and validation discipline for bug bounty hunting sessions.
  Combines the 5-phase non-linear hunting workflow with the critical thinking
  framework (developer psychology, anomaly detection, What-If experiments),
  the 7-Question Gate for finding validation before any report is written,
  discipline rules (Marker Discipline, Body-Diff Rule, Statistical-Sample Rule,
  Shell-Loop Ban), Pre-Severity Gate, never-submit list, conditionally-valid
  chain table, CVSS 3.1 quick reference, and evidence hygiene protocols.
  Based on 681 disclosed HackerOne report patterns and real engagement
  failure modes. Activates at session start, when switching targets, when
  feeling lost, before writing any report, or when validating findings.
domain: cybersecurity
subdomain: web-application-security
tags:
  - bug-bounty
  - methodology
  - validation
  - triage
  - 7-question-gate
  - discipline-rules
  - false-positive-prevention
  - cvss-scoring
  - evidence-hygiene
  - report-quality
  - mindset
  - critical-thinking
version: "1.0"
author: mahipal
license: Apache-2.0
nist_csf:
  - ID.RA-01
  - ID.RA-02
  - ID.RA-06
  - RS.AN-03
  - RS.CO-03
  - GV.RM-01
mitre_attack:
  - T1595
  - T1190
---

# Bug Bounty Methodology: Workflow + Mindset + Validation

Master orchestrator for hunting sessions. Combines the 5-phase non-linear workflow with the critical thinking framework that separates top 1% hunters from the rest, plus the validation discipline that prevents N/A submissions.

---

## PART 0: MODE CONFIRMATION (Before Anything Else)

Confirm the engagement type before deciding what counts as a finding. The same target produces a different report shape depending on which mode applies.

| Engagement type | What counts as a finding | What gets rejected |
|---|---|---|
| **Bug bounty** (H1 / Bugcrowd / Intigriti) | Impact-demonstrated bugs ONLY. Full chain to attacker-attainable harm. | Hygiene (EoL software alone, permissive CSP alone, stack traces, info disclosure without concrete impact) |
| **Red team** (external client engagement) | Hygiene findings + recon + IoCs + defensive-state observations | Nothing — even "no finding here" is reportable |
| **Pentest** (signed SoW / WAPT) | Depends on SoW. Usually accepts hygiene + impact + recon | Out-of-scope assets, unsigned testing |

**Hard rule:** Write the engagement type as the first line in your hunt notes. If you can't answer it from the instruction, ASK once. Don't assume.

---

## PART 1: MINDSET — Critical Thinking Framework

### Core Principle

Hunting is NOT "find a bug" — it is "prove an attack scenario." Think like an attacker with a specific goal, not a scanner looking for patterns.

### Daily Discipline: Define, Select, Execute

1. **Define**: "Today I target [feature/domain] to achieve [CIA impact]"
2. **Select**: Choose 1-2 vuln classes (IDOR, Race Condition, etc.)
3. **Execute**: Focus ONLY on selected techniques. No wandering.

### 5 Ultimate Goals (Pick One Per Session)

1. **Confidentiality** — steal data the attacker shouldn't see
2. **Integrity** — modify data the attacker shouldn't change
3. **Availability** — disrupt service (app-level DoS only)
4. **Account Takeover** — control another user's account
5. **RCE** — execute commands on the server

### 4 Thinking Domains

#### 1. Critical Thinking (Deep Analysis)

**Question trust boundaries:**
- Frontend control disabled? Send request directly via proxy
- `user_role=user` cookie? Change to `admin`
- `price=1000` in POST? Change to `1`
- `<script>` blocked? Try `<img onerror=...>`

**Reverse-engineer developer psychology:**
- Feature A has auth checks → Similar feature B (newly added) probably doesn't
- Complex flows (coupon + points + refund) → Edge cases have bugs
- `/api/v2/user` exists → Does `/api/v1/user` still work with weaker auth?

**What-If experiments:**
- Skip checkout → hit `/checkout/success` directly
- Skip 2FA → navigate to `/dashboard`
- Send coupon request 10x simultaneously → Race condition?
- Replace `guid=f8a2...` with `id=100` on sibling endpoint → IDOR?

#### 2. Multi-Perspective Analysis

| Perspective | What to check |
|------------|---------------|
| Horizontal (same role) | User A's token + User B's ID → IDOR |
| Vertical (different role) | Regular user → `/admin/deleteUser` |
| Data flow (proxy view) | Hidden params in JSON: `debug=false`, `discount_rate` |
| Time/State | Race conditions, post-delete session reuse |
| Client environment | Mobile UA → legacy API with weaker auth |
| Business impact | "What's the $ damage if this breaks?" |

#### 3. Tactical Pattern Detection

- **Naming anomaly**: `userId` everywhere but suddenly `user_id` → different dev, weaker security
- **Error diff**: Same 403 but different JSON structure → different backend systems
- **Environment diff**: Prod vs Dev/Staging → debug headers, CSP disabled
- **Supply chain**: Check framework/library versions for known CVEs

#### 4. Strategic Thinking

- **Asymmetry**: Defender must patch ALL holes. You only need ONE.
- **Intuition engineering**: Log why something "feels wrong." Verify later.
- **20-minute rotation**: Every 20 minutes ask "Am I making progress?" → No → Rotate endpoint/subdomain/vuln class/target

---

## PART 2: 5-PHASE NON-LINEAR WORKFLOW

```
+-------------------------------------------------+
|                                                  |
|  +----------+    +----------+    +----------+    |
|  | 1. RECON |---+| 2. MAP   |---+| 3. HUNT  |   |
|  +----------+    +-----+----+    +-----+-----+   |
|       ^                |               |         |
|       |                v               v         |
|       |          +----------+    +----------+    |
|       +----------| 4. PROVE |---+| 5. REPORT|   |
|                  +----------+    +----------+    |
|                                                  |
|  Non-linear: stuck at any phase → go back        |
+-------------------------------------------------+
```

### Phase 1: RECON — Maximize Attack Surface

**Goal**: Find what others missed. Build the asset inventory.

**Wide approach**: Subdomain enum → DNS resolution → HTTP probing → Tech detect → JS analysis → Cloud assets
**Deep approach**: Google Dorks → JS file download → Hidden param discovery → API mapping → Source code analysis

| Signal | Wide | Deep |
|--------|------|------|
| New program, first day | ✓ | |
| Wildcard scope `*.target.com` | ✓ | |
| Main webapp, >3 days target | | ✓ |
| Found interesting subdomain | | ✓ |

**5-minute rule**: If a host yields nothing after 5 minutes → skip, try next.

### Phase 2: MAP — Understand Like the Developer

- Map all endpoints (Burp sitemap + JS analysis)
- Identify auth model (cookie, JWT, OAuth, SAML?)
- Find business-critical flows (payment, registration, password reset)
- Download and analyze JS files for hidden routes, secrets, logic
- Identify roles and permissions (user, admin, API keys)
- Note "weird" behaviors (anomalies in naming, errors, timing)

### Phase 3: HUNT — Vulnerability Discovery

**Decision flow by input type:**

```
ID parameter → IDOR checklist
Search/filter/sort → SQLi, NoSQLi probing
URL input / webhook / PDF gen → SSRF checklist
Text field reflected in page → XSS (DOM or reflected)
File upload → SVG XSS, web shell, path traversal
Price/quantity/coupon → Business logic, race conditions
Login / 2FA / password reset → Auth bypass
Profile update API → Mass Assignment
Template / wiki editor → SSTI
Nothing obvious → Fuzz with ffuf, Error-based probing
```

**Error vs Blind decision:**
1. Error-based first (send `'`, `"`, `{{7*7}}`, `${7*7}`) — watch for 500 errors
2. No error? Time-based (`SLEEP(10)`, `; sleep 10;`) — watch response time  
3. No time diff? OOB (`curl attacker.com`, interactsh) — watch for DNS callback
4. Still nothing? Boolean (`AND 1=1` vs `AND 1=0`) — watch content-length diff

**20-minute rule**: If stuck 20 minutes on one endpoint → rotate to next.

### Phase 4: PROVE — Escalate to Maximum Impact

Turn Low into Critical through chaining:

```
XSS → steal cookie/token → Session hijack → ATO
IDOR → read PII → automate scraping, show scale
SSRF → reach 169.254.169.254 → extract IAM keys → RCE  
SQLi → UNION/extract data → admin passwords → ATO
Open Redirect → OAuth flow → token theft → ATO
```

### Phase 5: VALIDATE & REPORT — Get Paid

Run the **7-Question Gate** (Part 3 below) BEFORE writing any report. All 7 must pass.

---

## PART 3: THE 7-QUESTION GATE (Run Before Every Report)

Ask IN ORDER. One wrong answer = KILL the finding immediately.

### Q1: Can an attacker use this RIGHT NOW, step by step?

Complete this template:
```
1. Setup:   I need [own account / another user's ID / no account]
2. Request: [exact HTTP method, URL, headers, body — copy-paste ready]
3. Result:  I can [read / modify / delete] [exact data shown in response]
4. Impact:  The real-world consequence is [ATO / PII read / money stolen]
5. Cost:    Time: [X minutes], Capital: [$0]
```

**If you CANNOT write step 2 as a real HTTP request → KILL IT.**

### Q2: Is the impact on the program's accepted impact list?

Check the program's "Vulnerability Types" or "Out of Scope" page. If your bug maps to a listed exclusion → KILL IT.

Common tiers:
- **Critical**: Any-user ATO without interaction, RCE, SQLi with data exfil  
- **High**: Mass PII exfil, privilege escalation, internal SSRF with data
- **Medium**: IDOR on specific user non-critical data, XSS requiring click
- **Low**: Non-sensitive info disclosure, clickjacking with PoC

### Q3: Is the root cause in an in-scope asset?

Confirm vulnerable domain is on the in-scope list, it's production (not staging/dev unless explicitly in scope), and it's not a third-party service (Stripe, Salesforce, Google Auth). If out-of-scope → KILL IT.

### Q4: Does it require privileged access an attacker can't realistically get?

- "Admin can do X" = centralization risk = KILL IT
- "Non-admin can do X that only admin should do" = valid
- "Requires physical access / MFA device" = usually invalid

### Q5: Is this already known or accepted behavior?

Search: program's HackerOne/Bugcrowd disclosed reports, GitHub issues, changelog, API docs. If acknowledged/design decision → KILL IT.

### Q6: Can you prove impact beyond "technically possible"?

- XSS → show actual cookie theft or session hijack, not just `alert(1)`
- SSRF → hit an internal endpoint that returns data, not just DNS ping
- SQLi → show actual data exfil from a real table, not just error message
- IDOR → show actual other-user's data in response, not just 200 status

**If only "technically possible" → DOWNGRADE severity, not kill.**

### Q7: Is this a known-invalid bug class?

Check the NEVER SUBMIT list below. If on this list without a chain → KILL IT.

---

## PART 4: NEVER SUBMIT LIST

Submitting these destroys your validity ratio:

```
Missing CSP / HSTS / security headers
Missing SPF / DKIM / DMARC
GraphQL introspection alone (no auth bypass, no IDOR demonstrated)
Banner / version disclosure without working CVE exploit
Clickjacking on non-sensitive pages
Tabnabbing
CSV injection (no actual code execution shown)
CORS wildcard (*) without credential exfil proof
Logout CSRF
Self-XSS (only exploits own account)
Open redirect alone (no ATO or OAuth theft chain)
OAuth client_secret in mobile app (known, expected)
SSRF DNS callback only (no internal service access or data)
Host header injection alone (no password reset poisoning PoC)
Rate limit on non-critical forms
Session not invalidated on logout
Concurrent sessions
Internal IP in error message
Mixed content / SSL weak ciphers
Missing HttpOnly / Secure cookie flags alone
Autocomplete on password fields
```

---

## PART 5: CONDITIONALLY VALID — CHAIN REQUIRED

Build the chain first, prove it works end to end, THEN report.

| Standalone Finding | Chain Required | Valid Result |
|---|---|---|
| Open redirect | + OAuth redirect_uri → auth code theft | ATO (Critical) |
| Clickjacking | + sensitive action + working PoC | Medium |
| CORS wildcard | + credentialed request exfils user PII | High |
| CSRF | + sensitive action (transfer, change email) | High |
| Rate limit bypass | + OTP/reset token brute force succeeds | Medium/High |
| SSRF DNS-only | + internal service access + data returned | Medium |
| Host header injection | + password reset uses injected host | High |
| Self-XSS | + CSRF to trigger on victim | Medium |
| Subdomain takeover | + OAuth redirect_uri at that subdomain | Critical |
| GraphQL introspection | + auth bypass mutation or node() IDOR | High |

---

## PART 6: DISCIPLINE RULES — False-Positive Prevention

Most retracted findings come from four recurring process bugs. Each has a hard rule.

### Rule 1: Marker Discipline

Your injected marker string MUST be unique and unmistakable.

- Markers are random alphanumeric strings, 8+ characters, no English words.
- **NEVER** use `test`, `marker`, `evil`, `attacker`, `payload`, `javascript`, `AAAA`, `BBBB`, your domain name.
- **Good markers:** `cpmark987abc`, `x4hd2k9pq`, `__ZZ_MARKER_<random>_ZZ__`.
- Before claiming reflection: search the **baseline** (no-marker) response for the marker string.
- This single check catches 80% of false-positive reflection reports.

### Rule 2: Body-Diff Rule

A bypass claim requires response **body** differential, not just status code.

- 200 OK with byte-identical body to baseline is NOT a bypass.
- Always diff the body side-by-side: `diff <(curl ... baseline) <(curl ... bypass)`.
- Status-code-only claims are the most common rejected-as-N/A category.

### Rule 3: Statistical-Sample Rule (for timing-based claims)

Single outliers are NOT signal. Network jitter routinely produces 2× outliers.

- Minimum sample: **n ≥ 10 INTERLEAVED trials per group** (control + test, randomized order).
- Compute mean, median, σ for each group.
- Signal requires suspect group mean ≥ **2σ above** control group mean.
- A single 2× outlier in n=1 is jitter, not signal.

### Rule 4: Shell-Loop Ban (>5 iterations)

For any iteration >5 times, **use Python (with try/except per iteration), not shell for-loops.**

- Shell array expansion fails silently on edge cases.
- Always count results. If you expected 100 probes and got <50 lines, your loop ate something.

---

## PART 7: PRE-SEVERITY GATE

Before labelling any finding **Critical** or **High**, answer these:

1. **Have I validated the FULL chain to attacker-attainable impact**, or only one primitive in the middle?
2. **What does the attacker walk away with**, in one concrete sentence?
3. **Have I personally reproduced the full chain end-to-end at least twice?**
4. **Is there an inheritance gate or validation step still gating the chain?**
5. **Has the program rejected this severity class before?**

Multi-Tool Reproduction Bar (Critical/High only): reproduce via at least **two independent tools** (curl + Python requests, curl + Burp, etc.).

---

## PART 8: CVSS 3.1 QUICK REFERENCE

### Common Score Examples

| Finding | Score | Severity | Vector |
|---|---|---|---|
| IDOR read PII, any user, auth required | 6.5 | Medium | AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N |
| IDOR write/delete, any user | 7.5 | High | AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N |
| Auth bypass → admin panel | 9.8 | Critical | AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H |
| Stored XSS → cookie theft | 8.5 | High | AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:L/A:N |
| SQLi → full DB dump | 9.1 | Critical | AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N |
| SSRF → cloud metadata | 9.1 | Critical | AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N |
| Race → double spend | 7.5 | High | AV:N/AC:H/PR:L/UI:N/S:U/C:H/I:H/A:N |
| JWT none algorithm | 9.1 | Critical | AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H |
| Unprotected admin via JS source | 9.8 | Critical | AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H |

### Metric Quick Guide

| What you have | Metric | Value |
|---|---|---|
| Exploitable over internet | AV | Network (N) |
| No special timing or race | AC | Low (L) |
| Free account needed | PR | Low (L) |
| No login needed | PR | None (N) |
| Admin needed | PR | High (H) |
| No victim action | UI | None (N) |
| Victim must click | UI | Required (R) |
| Reads all data | C | High (H) |
| Reads some data | C | Low (L) |
| Modifies all data | I | High (H) |
| Affects only app | S | Unchanged (U) |
| Affects browser/OS/cloud | S | Changed (C) |

---

## PART 9: EVIDENCE HYGIENE PROTOCOL

### Cookie Redaction

Before any screenshot with cookies appears in a report:
- Mask ALL session cookies (`session=REDACTED`, `auth_token=REDACTED`)
- Use Burp's Preview annotation or DevTools to hide cookie values
- Never screenshot raw cookie headers in a report

### PII Black-Bar Discipline

When showing other-user data in PoC screenshots:
- Black-bar: names, emails, phone numbers, addresses, SSNs
- Show only the structure that proves you can access the data
- Replace actual values with placeholders: `[REDACTED]`, `victim@REDACTED.com`

### Screenshot Protocol

- Crop to the relevant portion (HTTP request + response + impact evidence)
- Annotate with arrows/circles highlighting the exploit
- Include a verification marker (timestamp, response status code)
- File naming: `{vuln_id}_{step_number}_{description}.png`

### Retraction Discipline

If a finding stops reproducing → document the retraction, don't silently drop it:

```markdown
### Retracted: {finding name}
- **Original signal:** {what looked like a bug}
- **Disproving evidence:** {concrete reproduction + observation}
- **Why it looked like a bug:** {root cause of false positive}
- **Retraction date:** {YYYY-MM-DD}
```

---

## PART 10: ANTI-PATTERNS THAT LOSE MONEY

```
Writing a report before confirming the bug exists
Submitting theoretical impact without proof
"The API returns more fields than necessary" (sensitivity matters)
Chaining A+B into one report when they're separate bugs (2 payouts vs 1)
Reporting B saying "similar to A in my other report" — validate B independently
Overclaiming severity — triagers trust you less next time
Under-describing impact — triager doesn't understand why it matters
Program hopping — stick with one target minimum 2 weeks / 30 hours
Tool-only hunting — automation finds duplicates, manual finds uniques
Rabbit hole — max 45 min per parameter, set a timer
```

---

## PART 11: RETRACTION DISCIPLINE

When a finding fails reproduction — **never silently drop it.** Document in an appendix. This proves to the triager that you validate your own work and saves them from chasing phantoms.

**Retraction entry template:**

```markdown
### Retracted: <finding name>
- **Original signal:** <one-line description>
- **Disproving evidence:** <concrete reproduction + observation>
- **Why it looked like a bug:** <root cause of false positive>
- **Retraction date:** <YYYY-MM-DD>
```

A clean 11-finding report with a retraction appendix is more trustworthy than a 13-finding report where 2 fall apart at triage.

---

## PART 12: KILL FAST RULES

1. **5-minute rule**: If you can't fill in Q1's template in 5 minutes → move on
2. **Precondition count**: More than 2 preconditions simultaneously → kill it
3. **Impact test**: "What does attacker walk away with?" — if nothing tangible → kill it
4. **Admin bypass**: "Admin can do X" is NEVER a bug → kill it immediately
5. **Design doc test**: If documented behavior → kill it immediately
6. **Rabbit hole signal**: 30+ min on Q6 with no reproducible PoC → kill it

---

## PART 13: SESSION START RITUAL

Before touching any tool, answer these:

1. **Define**: "Today I target [feature/domain] to achieve [C/I/A/ATO/RCE]"
2. **Select**: Choose 1-2 vuln classes
3. **Execute**: Focus ONLY on selected techniques

**Route selection:**

| Signal | Wide (recon sweep) | Deep (focused testing) |
|--------|-------------------|----------------------|
| New program, first day | ✓ | |
| Wildcard scope | ✓ | |
| Main webapp, >3 days here | | ✓ |
| Scope update (new domain) | ✓ | |
| Found interesting subdomain | | ✓ |

---

## PART 14: SESSION END CHECKLIST

- [ ] Save all Burp/ZAP project files
- [ ] Record any "weird but not yet exploitable" behaviors (future gadgets)
- [ ] Update notes with failed attempts (don't re-test with same techniques)
- [ ] Snapshot evidence folder with timestamps
- [ ] Log all findings and submission IDs

---

## PART 15: NAVIGATION QUICK REFERENCE

| I'm stuck because... | Go to... |
|----------------------|----------|
| Can't find subdomains | Phase 1: Different recon sources, Google Dorks |
| Found subdomain but don't know what to test | Phase 2: Map app, download JS, understand auth |
| Testing but nothing works | Phase 3: Switch vuln class (20-min rotation rule) |
| Found bug but impact is low | Phase 4: Escalation paths or gadget chaining |
| WAF/CSP/403 blocking payload | Bypass techniques, then return to current phase |
| Been stuck 45 min on one param | STOP. Rabbit hole. Move to next endpoint. |
| New API discovered during testing | Return to Phase 2: map it before attacking |
| Found one bug | A→B signal: same dev made more mistakes. Hunt 20 min for siblings. |
