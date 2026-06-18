# Bug Bounty Assessment — shijicloud.com

**Scope**: op-web-uat-ap1, op-api-uat-ap1, op-identity-uat-ap1
**Date**: 2026-06-18
**Credentials**: test63:****, tenant: shijiutilitiestest

## Engagement Statistics
| Metric | Value |
|--------|-------|
| Endpoints Tested | 150 |
| Findings Identified | 9 |
| Critical | 1 |
| High | 3 |
| Medium | 3 |
| Low | 2 |
| Verified Not Vulnerable | 8 |

## Most Critical Finding
**BB-001 — SQL Error Disclosure via client_id Parameter** (CVSS 8.6)

The /oauth/token endpoint leaks Hibernate SQLGrammarException errors, confirming the client_id parameter is directly injected into database queries. Reproduced from unauthenticated session.

## Finding Inventory
| ID | Title | Severity | CVSS |
|---|---|---|---|
| BB-001 | SQL Error Disclosure via client_id Parameter in OAuth Token  | Critical | 8.6 |
| BB-002 | Swagger UI + Swagger Resources Publicly Accessible Without A | High | 7.5 |
| BB-003 | No Rate Limiting on Authentication Endpoint | High | 7.5 |
| BB-004 | Token Not Invalidated After Logout, No Concurrent Session Li | High | 7.5 |
| BB-005 | Missing Security Headers Across All 3 In-Scope Targets | Medium | 5.3 |
| BB-006 | Nginx Server Version Disclosure | Medium | 5.3 |
| BB-007 | Opaque 500 Errors on Invalid Authentication (Information Dis | Medium | 5.3 |
| BB-008 | JSESSIONID Cookie Missing Secure and HttpOnly Flags | Low | 3.7 |
| BB-009 | Hardcoded OAuth Client Secret in JavaScript Bundle | Low | 3.1 |
