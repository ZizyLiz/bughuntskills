# Bughuntskills

Bug bounty hunting skills for AI agents. A structured knowledge framework for autonomous bug bounty workflows.

## Skills

| # | Skill | Version | Lines | Focus |
|---|-------|---------|-------|-------|
| 0 | **bug-bounty-methodology** | v1.0 | 500+ | Orchestrator, 7-Question Gate, mindset, CVSS |
| 1 | **bug-bounty-reconnaissance** | v3.7 | 1000+ | Subdomain enum, CDN bypass, URL discovery, cloud assets |
| 1.5 | **bug-bounty-js-analysis** | v1.2 | 900+ | Deep JS: source maps, webpack, SPA, prototype pollution |
| 2 | **bug-bounty-xss** | v1.0 | 500+ | Reflected/Stored/DOM/Blind XSS, CSP, WAF bypass |
| 3 | **bug-bounty-sql-injection** | v2.0 | 400+ | SQLi + NoSQLi, sqlmap, WAF bypass tamper scripts |
| 4 | **bug-bounty-api-security** | v1.0 | 300+ | REST/GraphQL/gRPC/WS, OWASP API Top 10 |
| 5 | **bug-bounty-vulnerability-assessment** | v3.12 | 1300+ | IDOR, XSS, SQLi, forced admin, WAF detection |
| 6 | **bug-bounty-exploitation** | v3.16 | 3100+ | SQLi, XSS, SSRF, JWT, IDOR, smuggling, race conditions |
| 7 | **bug-bounty-reporting** | v3.3 | 960+ | H1/HC templates, CVSS mapping, submission checklists |
| 8 | **bug-bounty-xxe** | v1.0 | 286+ | XML/XXE: classic, blind, OOB, XInclude, SVG, DOCX |
| 9 | **bug-bounty-ssrf** | v1.0 | 300+ | Cloud metadata, protocol abuse, serverless, DNS rebinding |
| 10 | **bug-bounty-toolkit** | v1.0 | 410+ | Reverse shells, file transfer, tunneling, privesc |

## Pipeline Flow

```
Methodology → Recon → [JS Analysis] → XSS/SQLi/API → Assessment → Exploitation → Reporting
```

## How to Use

Follow [WORKFLOW.md](WORKFLOW.md) which contains the complete pipeline orchestration guide. Each skill folder contains a `SKILL.md` with the complete methodology.

