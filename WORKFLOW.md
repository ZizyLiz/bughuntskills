# Bug Bounty Skills — Workflow Guide

## Skill Architecture

bughuntskills uses 6 standalone skills, each in its own folder with a `SKILL.md` file.
Skills auto-activate based on trigger keywords and domain matching. This guide explains
when each skill fires and how they chain together in a complete bug bounty workflow.

## The Standard Pipeline

```
Reconnaissance → Vulnerability Assessment → Exploitation → Reporting
     ↑                  ↑                       ↑              ↑
  Discover           Identify               Prove impact    Document
  attack surface     vuln class             with PoC        for bounty
```

## Skill Reference

### 1. bug-bounty-reconnaissance (v3.1, 855 lines)

| Attribute | Value |
|-----------|-------|
| **When it fires** | First skill in any hunt. Triggered by subdomain discovery, DNS enumeration, JS analysis, GitHub scanning, cloud asset discovery |
| **Trigger keywords** | recon, reconnaissance, subdomain, dns, enumerate, crawl, wayback, github, s3 bucket, certificate transparency, js analysis, google dork, asn, cidr, whois |
| **What it produces** | `all_subdomains.txt`, `live_urls.txt`, `js_endpoints.txt`, `s3_buckets.txt`, `github_leaks.txt`, `api_endpoints.txt` |
| **Next step** | Feed output to `bug-bounty-vulnerability-assessment` |

**Use when**:
- Starting a new target: "map the attack surface of target.com"
- Expanding scope: "find all subdomains and sibling assets of example.com"
- Finding secrets: "search GitHub for target credentials"
- Cloud discovery: "find S3 buckets belonging to target"

### 2. bug-bounty-vulnerability-assessment (v3.1, 987 lines)

| Attribute | Value |
|-----------|-------|
| **When it fires** | After recon produces live URLs. Activates for vulnerability detection, testing methodology, filter analysis, WAF detection |
| **Trigger keywords** | vulnerability, assessment, testing, find, detect, filter, waf, security level, bypass detection, sql injection, idor, xss, ssrf, business logic |
| **What it produces** | Prioritized vulnerability list, WAF fingerprint, filter bypass strategy, security level progression map |
| **Next step** | Hand confirmed vulnerabilities to `bug-bounty-exploitation` |

**Use when**:
- "test this endpoint for vulnerabilities"
- "find IDORs on the user API"
- "assess the SQL injection surface"
- "detect the WAF and find bypasses"
- "check security level progression"

### 3. bug-bounty-exploitation (v3.3, 2061 lines)

| Attribute | Value |
|-----------|-------|
| **When it fires** | After a vulnerability is confirmed. The largest skill — covers every exploitation technique from UNION SQLi to XSS polyglots to business logic |
| **Trigger keywords** | exploit, exploitation, PoC, proof of concept, impact, extract, bypass, union select, blind SQLi, XSS payload, SSRF, JWT, OAuth, IDOR, XXE |
| **What it produces** | Working exploit payloads, extracted data, admin credentials, impact evidence |
| **Next step** | Pass credentials/impact data to `bug-bounty-reporting` |

**Use when**:
- "exploit this SQL injection"
- "extract admin credentials"
- "get the password via blind SQLi"
- "bypass this WAF filter"
- "find the XSS payload that works"

**Key sections (largest skill)**:
- SQL Injection: UNION, blind boolean, time-based, conditional error, CAST leak, Oracle enumeration
- XSS: 80+ event handlers, consuming tags, restricted char bypasses, framework XSS, prototype pollution, polyglots
- SSRF: cloud metadata, Kubernetes pivoting, IP bypass library
- Business Logic: 6 OWASP case studies, race conditions, stale state
- JWT: algorithm confusion, key injection, brute-force
- OAuth: flow manipulation, scope elevation, CSRF bypass
- IDOR: mass assignment, GraphQL, gRPC

### 4. bug-bounty-reporting (v3.0, 800 lines)

| Attribute | Value |
|-----------|-------|
| **When it fires** | After successful exploitation. Templates and frameworks for submitting to HackerOne/Bugcrowd |
| **Trigger keywords** | report, reporting, submission, write-up, writeup, severity, cvss, triage, bounty report |
| **What it produces** | Formatted vulnerability report, CVSS scoring, CWE mapping, remediation suggestions |

**Use when**:
- "write the report for this finding"
- "what's the CVSS for this SQL injection?"
- "format my IDOR finding for HackerOne triage"

### 5. bug-bounty-xxe (v1.0, 285 lines)

| Attribute | Value |
|-----------|-------|
| **When it fires** | Specifically when XML parsing is detected. A standalone skill because XXE is a complete exploitation domain with its own workflow |
| **Trigger keywords** | XXE, XML external entity, XML injection, DTD, SVG injection, SOAP, SAML, XInclude, blind XXE |
| **What it produces** | XXE payloads, blind exfiltration DTDs, cloud metadata extraction, file reads |

**Use when**:
- "test this SOAP endpoint for XXE"
- "this XML API — is it vulnerable to XXE?"
- "try blind XXE on the file upload"

### 6. bug-bounty-ssrf (v1.0, 225 lines)

| Attribute | Value |
|-----------|-------|
| **When it fires** | When SSRF vectors are identified. Standalone because SSRF pivoting to cloud/K8s is a specialized exploitation chain |
| **Trigger keywords** | SSRF, server-side request forgery, cloud metadata, IMDS, internal service, gopher, 169.254, DNS rebinding |
| **What it produces** | SSRF payloads, cloud credential extraction, IP bypass payloads, Kubernetes pivot commands |

**Use when**:
- "test this webhook URL for SSRF"
- "can I hit the cloud metadata from this parameter?"
- "bypass SSRF IP filtering"

## Workflow Examples

### Example 1: Full Hunt — Single Target

```
User: "hunt target.com"

1. Reconnaissance auto-fires → discovers subdomains, live URLs, JS files
2. Vulnerability Assessment auto-fires → tests endpoints, finds SQLi in /api/search
3. Exploitation auto-fires → extracts admin credentials via UNION SELECT
4. Reporting auto-fires → formats report with CVSS, PoC, remediation
```

### Example 2: Specific Attack — SSRF

```
User: "test this webhook URL for SSRF: https://target.com/callback?url="

1. SSRF skill auto-fires → tries localhost, 169.254.169.254, internal ports
2. If cloud metadata responds → Exploitation skill provides credential extraction
3. Reporting skill formats the AWS IAM credential theft report
```

### Example 3: Solving a Lab

```
User: "solve this PortSwigger lab using bughuntskills"

1. Reconnaissance → maps site structure, identifies injection points
2. Vulnerability Assessment → confirms SQLi type, column count, DB fingerprint
3. Exploitation → UNION SELECT extracts admin password
4. The flow is: identify → confirm → extract → login
```

## Skill Sizes (for context budgeting)

| Skill | Lines | Focus |
|-------|-------|-------|
| Exploitation | 2061 | Deepest — every PoC technique with payloads |
| Vulnerability Assessment | 987 | Detection patterns, filter analysis, WAF bypass |
| Reconnaissance | 855 | Full discovery pipeline |
| Reporting | 800 | Templates, CVSS, CWE, platform checklists |
| XXE | 285 | XML-specific exploitation |
| SSRF | 225 | Cloud/internal service pivoting |

## Quick Reference Card

```
"What skill should I use for..."

Finding subdomains?              → bug-bounty-reconnaissance
Testing for vulnerabilities?     → bug-bounty-vulnerability-assessment
Extracting data / proving impact? → bug-bounty-exploitation
Writing the H1 report?           → bug-bounty-reporting
XML endpoint attack?             → bug-bounty-xxe
URL/webhook internal access?     → bug-bounty-ssrf
WAF bypass?                      → bug-bounty-vulnerability-assessment (detection)
                                    bug-bounty-exploitation (payloads)
SQL injection extraction?        → bug-bounty-exploitation
XSS payload needed?              → bug-bounty-exploitation
JWT/OAuth/IDOR attack?           → bug-bounty-exploitation
```

---

*Last updated: 2026-06-17 — bughuntskills v3.3*
