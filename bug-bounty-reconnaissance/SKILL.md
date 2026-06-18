---
name: bug-bounty-reconnaissance
description: >-
  Conducts comprehensive reconnaissance for bug bounty hunting against web
  application targets. Handles both wildcard scope (*.example.com) and specific
  subdomain targets. Performs subdomain enumeration, CDN/origin discovery, URL
  enumeration, technology fingerprinting, API endpoint mapping, JavaScript analysis,
  GraphQL detection, cloud asset discovery, and source code leak hunting. Based on
  patterns from 10,000+ disclosed HackerOne reports where information disclosure
  (907 reports) and access control issues (519 reports) are the highest-volume
  categories — reconnaissance quality directly drives bounty impact. Now covers
  robots.txt/sitemap.xml discovery, forced browsing of sensitive paths, and
  unprotected admin panel detection.
domain: cybersecurity
subdomain: web-application-security
tags:
  - bug-bounty
  - reconnaissance
  - subdomain-enumeration
  - cdn-bypass
  - origin-discovery
  - url-discovery
  - attack-surface
  - scope-handling
  - passive-recon
  - active-recon
  - technology-fingerprinting
  - api-discovery
  - javascript-analysis
  - graphql-detection
  - s3-bucket-discovery
  - source-code-leak
  - oauth-endpoint-mapping
  - iis-reconnaissance
  - origin-source-recovery
  - credential-file-discovery
  - phpinfo-discovery
  - xml-endpoint-discovery
  - javascript-api-mapping
  - xml-soap-detection
  - json-endpoint-mapping
  - cookie-injection-discovery
  - sql-injection-surface
  - database-fingerprint
  - content-oracle-discovery
  - column-type-mapping
  - schema-enumeration
  - oracle-catalog-mapping
  - error-disclosure-test
  - union-column-triage
  - sleep-based-fingerprint
  - xml-endpoint-mapping
  - cloud-metadata-detection
  - asn-cidr-correlation
  - reverse-whois
  - subdomain-permutation
  - s3-bucket-discovery
  - github-recon
  - ip-range-scanning
  - google-dork-library
  - robots-txt-discovery
  - sitemap-discovery
  - forced-browsing
  - sensitive-path-discovery
  - unprotected-admin
  - information-disclosure
  - js-admin-url-extraction
  - client-side-source-analysis
  - unpredictable-admin-url
  - automated-output
version: "3.6"
author: mahipal
license: Apache-2.0
nist_csf:
  - ID.RA-01
  - ID.AM-01
  - DE.CM-01
  - ID.RA-06
mitre_attack:
  - T1595
  - T1592
  - T1590
  - T1589
  - T1593
  - T1040
---

# Bug Bounty Reconnaissance

## When to Use

- Starting a bug bounty engagement against any program with wildcard scope (`*.example.com`) or specific subdomains
- Mapping the complete external attack surface before vulnerability assessment and exploitation
- Discovering forgotten, staging, or development subdomains that often contain weaker security controls
- Finding origin servers behind CDNs (Akamai, CloudFront, Cloudflare, Fastly) that bypass WAF protections
- Discovering cloud assets (S3 buckets, Azure blobs, GCP storage) that may be misconfigured
- Building a target inventory of live hosts, technologies, and endpoints for systematic testing
- Continuous monitoring of scope changes and new asset discovery in ongoing bounty programs
- Finding source code leaks on GitHub/GitLab that can reveal credentials (multiple $10K-$25K bounties in disclosed reports)

**Do not use** against targets outside the program's defined scope, for subdomain takeover without explicit program rules allowing it, or against targets where active scanning is explicitly prohibited by the bounty program policy.

## Prerequisites

- Bug bounty program acceptance and scope document defining in-scope targets
- Go 1.21+ installed for running Go-based reconnaissance tools
- Recon tools: Subfinder, Amass, Httpx, Katana, Nuclei, Dnsx, Naabu, PureDNS, Gotator, GAU, waybackurls, URO
- API keys configured for passive sources: Shodan, Censys, VirusTotal, SecurityTrails, Chaos, GitHub, GitLab
- Burp Suite Professional or OWASP ZAP configured for manual crawling
- GitHub Personal Access Token for code search (credential leak discovery)
- Cloud provider CLI tools: awscli, gcloud, az (for bucket enumeration)
- Dedicated reconnaissance VM or VPS to avoid rate-limiting on your primary IP
- Organize outputs at `./bounty/{program_name}/recon/`

## Workflow

### Step 1: Scope Parsing and Validation

Parse and validate the bug bounty scope before any enumeration begins:

```bash
mkdir -p ./bounty/{program_name}/{recon,vulns,exploits,reports}
cd ./bounty/{program_name}

# Define scope — handles both wildcard and specific targets
cat > recon/scope.txt << 'EOF'
# Wildcard scope
*.example.com

# Specific subdomains (in-scope)
app.example.com
admin.example.com
EOF

# Separate wildcard from specific targets

# GOOGLE DORK QUICK REFERENCE (use during scope mapping)
# site:target.com                                — all indexed pages
# site:target.com inurl:login                    — login pages
# site:target.com inurl:register                 — registration pages
# site:target.com filetype:php                   — PHP pages (reveals tech stack)
# site:target.com filetype:aspx                  — ASPX pages
# site:target.com filetype:txt                   — .txt files (robots, config leaks)
# site:target.com intext:"index of /"            — directory listings
# site:target.com inurl:.php?id=                 — PHP GET parameters
# site:target.com intitle:"admin"                — admin panels in title
# site:target.com ext:log                        — log files (credentials in logs)
# site:github.com "target.com" password          — GitHub credential leaks
# site:trello.com "target.com"                   — Trello boards with internal info
# site:pastebin.com "target.com"                 — Pastebin dumps
# site:amazonaws.com inurl:target                — S3 buckets
# "Copyright 2024 Target Inc"                    — find sister domains by copyright text
```
grep '^\*\.' recon/scope.txt | sed 's/^\*\.//' > recon/wildcard_domains.txt
grep -v '^\*\.\|^$\|^#' recon/scope.txt | grep -v '^$' > recon/specific_targets.txt
```

### Step 2: Passive Subdomain Enumeration

Gather subdomains without directly querying target DNS servers. **Based on disclosed H1 reports, certificate transparency logs (crt.sh) are the single highest-yield passive source — they've revealed staging, dev, admin, and internal subdomains across hundreds of reports.**

```bash
cd ./bounty/{program_name}/recon

# Subfinder with all passive sources
subfinder -dL wildcard_domains.txt -all -o subfinder_passive.txt

# Amass passive enumeration
amass enum -passive -df wildcard_domains.txt -o amass_passive.txt

# Certificate transparency via crt.sh (highest-yield passive source)
for domain in $(cat wildcard_domains.txt); do
  curl -s "https://crt.sh/?q=%25.${domain}&output=json" | \
    jq -r '.[].name_value' | sed 's/\*\.//g' | sort -u >> crtsh_subs.txt
done

# CertSpotter API (alternative to crt.sh)
for domain in $(cat wildcard_domains.txt); do
  curl -s "https://api.certspotter.com/v1/issuances?domain=${domain}&include_subdomains=true&expand=dns_names" | \
    jq -r '.[].dns_names[]' | sort -u >> certspotter_subs.txt 2>/dev/null
done

# GitHub code search for subdomain references (passive)
# Search for domain patterns in public repositories, CI/CD configs
github-subdomains -d example.com -t $GITHUB_TOKEN -o github_subs.txt 2>/dev/null

# Chaos project discovery
chaos -d example.com -o chaos_subs.txt 2>/dev/null

# Merge all passive results
cat subfinder_passive.txt amass_passive.txt crtsh_subs.txt \
    certspotter_subs.txt github_subs.txt chaos_subs.txt 2>/dev/null | \
    sort -u > all_passive_subs.txt
```

### Step 3: Active Subdomain Enumeration

Perform active DNS resolution and brute-forcing within scope limits:

```bash
# DNS brute-force with curated wordlists
puredns bruteforce \
  ~/wordlists/subdomains/best-dns-wordlist.txt \
  -d example.com \
  -r ~/wordlists/resolvers/trusted-resolvers.txt \
  -w puredns_bruteforce.txt

# Permutation/alteration scanning
gotator -sub all_passive_subs.txt -perm ~/wordlists/permutations.txt -depth 2 \
  -prefixes -md -o gotator_perms.txt
puredns resolve gotator_perms.txt -r ~/wordlists/resolvers/trusted-resolvers.txt \
  -w puredns_resolved_perms.txt

# Merge passive and active results
cat all_passive_subs.txt puredns_bruteforce.txt \
    puredns_resolved_perms.txt 2>/dev/null | sort -u > all_subdomains.txt

# Scope filtering
cat all_subdomains.txt | grep -E "$(cat wildcard_domains.txt specific_targets.txt | \
  sed 's/\./\\./g' | paste -sd '|')" > inscope_subdomains.txt
```

### Horizontal Asset Correlation — ASN, CIDR, Reverse Whois

**Critical for expanding scope. Companies often own multiple domains, CIDR ranges, and sibling assets that aren't in the initial scope list. Finding these widens your attack surface significantly.**

```bash
# ASN Discovery via Amass
amass intel -org "Company Name" -o recon/asn_discovery.txt
# Returns ASN numbers owned by the organization

# CIDR ranges from ASN
whois -h whois.radb.net -- '-i origin AS12345' | grep -Eo "([0-9.]+){4}/[0-9]+" | sort -u > recon/cidr_ranges.txt

# Domains on ASN (reverse IP)
amass intel -asn AS12345 -o recon/asn_domains.txt

# Domains on CIDR range
amass intel -cidr 192.0.2.0/24 -o recon/cidr_domains.txt

# Reverse Whois — find domains registered by same email/org
amass intel -whois -d example.com -o recon/reverse_whois.txt

# Reverse DNS — correlate domains via shared NS/MX/A records
# If domains share the same name server or mail server, they're likely same owner
dig +short NS example.com | while read ns; do
  curl -sk "https://domaineye.com/reverse-ns/$ns" 2>/dev/null | grep -oP '[a-z0-9-]+\.[a-z]+' >> recon/reverse_ns_domains.txt
done

# Copyright text correlation — unique footer text links sister domains
# Search: intext:"© 2024 Target Inc. All rights reserved."
# Any domain containing that exact copyright string is likely same org
```

### Subdomain Permutation Engine

```bash
# Generate permutations from discovered subdomains
# Input: dev.example.com, api.example.com
# With words: dev, staging, prod, admin, internal, test
# Output: dev-api.example.com, staging-api.example.com, prod-admin.example.com, etc.

echo -e "dev\nstaging\nprod\nadmin\ninternal\ntest\napi\napp\nwww\nportal\nvpn\nmail\nremote" > recon/perm_words.txt

# Altdns — classic permutation tool
altdns -i inscope_subdomains.txt -o recon/permutations.txt -w recon/perm_words.txt -r -s recon/permutations_resolved.txt

# Gotator — modern, faster
gotator -sub inscope_subdomains.txt -perm recon/perm_words.txt -depth 2 -prefixes -md -o recon/gotator_perms.txt
puredns resolve recon/gotator_perms.txt -r ~/wordlists/resolvers/trusted-resolvers.txt -w recon/perms_live.txt

# Subdomain-of-subdomain chaining
# dev.example.com discovered → brute force *.dev.example.com
subfinder -d dev.example.com -o recon/sub_of_sub.txt
```

### Step 4: DNS Resolution and CDN/Origin Discovery

**Critical step — origin server discovery is a key attack vector. Disclosed reports show SSRF and origin bypasses frequently lead to AWS metadata access and internal network pivoting ($500-$10K bounties).**

```bash
# DNS resolution — identify A records, CNAMEs, and cloud providers
cat inscope_subdomains.txt | dnsx -a -cname -resp -o dnsx_resolved.txt

# Extract CNAME records to identify CDN providers
# Akamai → edgesuite.net / akamaiedge.net
# CloudFront → cloudfront.net
# Cloudflare → cloudflare-dns.com (NS records)
# Fastly → fastly.net
grep -E 'edgesuite|akamaiedge|cloudfront|fastly|cdn' dnsx_resolved.txt > cdn_mapped.txt

# Extract origin IPs from A records (bypass CDN targets)
awk '{print $2}' dnsx_resolved.txt | grep -v '\.$' | sort -u > resolved_ips.txt

# Check IP ownership and cloud provider (Shodan free API)
for ip in $(head -20 resolved_ips.txt); do
  curl -s "https://internetdb.shodan.io/${ip}" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"{d.get('ip','')} | org: {d.get('org','')} | ports: {d.get('ports',[])} | hostnames: {d.get('hostnames',[])}\")" 2>/dev/null
done > ip_intel.txt

# Port scanning top 1000 ports for non-standard services
naabu -list inscope_subdomains.txt -top-ports 1000 -rate 1000 -o naabu_ports.txt
```

### Step 5: Live Host Probing and Technology Fingerprinting

Determine which subdomains are live, identify technology stacks, and map WAF presence:

```bash
# httpx probing — identify live hosts and their characteristics
cat inscope_subdomains.txt | httpx \
  -ports 80,443,8080,8443,3000,4443,8000,8008,8081,8443,9000,9090,9443 \
  -status-code -title -tech-detect -server -content-length \
  -follow-redirects -http-probe -no-color \
  -o httpx_live_hosts.csv

# Extract live URLs
awk -F',' '{print $1}' httpx_live_hosts.csv > live_urls.txt

# Technology fingerprinting with webanalyze
cat live_urls.txt | webanalyze -apps ~/wappalyzer/apps.json -output csv \
  -o wappalyzer_results.csv

# WAF detection
cat live_urls.txt | wafw00f -i - -o waf_detection.txt

# Combine port scan results with HTTP probing
cat naabu_ports.txt | httpx -status-code -title -o naabu_http_services.txt
```

### Step 6: Origin Server Bypass Discovery

**When CDN/WAF returns 403 (Akamai) or blocks requests, the origin servers may still be directly reachable. Proven in real-world assessments (sonymax1.com with Akamai, Microsoft IIS backends). This technique has proven critical in practice.**

```bash
# For each IP found to host the application, attempt direct origin access
for ip in $(cat resolved_ips.txt); do
  echo "=== Testing origin: $ip ==="
  # Try HTTPS with Host header
  code=$(curl -sk -o /dev/null -w "%{http_code}" -H "Host: www.example.com" "https://${ip}/" 2>/dev/null)
  echo "  HTTPS + Host header: $code"
  # Try HTTP with Host header
  code=$(curl -sk -o /dev/null -w "%{http_code}" -H "Host: www.example.com" "http://${ip}/" 2>/dev/null)
  echo "  HTTP + Host header: $code"
  # Try direct IP without Host header
  code=$(curl -sk -o /dev/null -w "%{http_code}" "https://${ip}/" 2>/dev/null)
  echo "  HTTPS direct: $code"
done | tee origin_probe_results.txt

# CRITICAL: When origin responds with 200 but CDN returns 403 → Origin bypass confirmed
# Test AJAX endpoints through origin (may require X-Requested-With header)
curl -sk -H "Host: www.example.com" \
  -H "X-Requested-With: XMLHttpRequest" \
  -X POST -d "expected_params" \
  "https://${origin_ip}/api/endpoint"

# Origin server fingerprinting via headers (sonymax1 pattern):
# Look for: Server: Apache, Set-Cookie: AWSALB, Set-Cookie: PHPSESSID
# These headers are typically stripped by CDN but visible at origin
curl -sk -I -H "Host: www.example.com" "https://${origin_ip}/" 2>/dev/null | grep -iE 'server|x-powered-by|set-cookie|awsalb|x-forwarded'

# Origin path traversal check (Microsoft IIS pattern):
# IIS apps may have parent directory access blocked but allow listing via system commands
# Test: ls works, ls ../ returns 403 → IIS handler restriction pattern

# Cookie injection surface detection (PortSwigger blind SQLi pattern):
# Tracking cookies like TrackingId, sessionId, uid are often injected into SQL
# or other backend queries. Flag ALL custom cookies for injection testing.
echo "=== Cookie Injection Candidates ===" >> ../cookie_injection_targets.txt
curl -sk -I "https://target.com/" 2>/dev/null | grep -i 'set-cookie' | grep -oP '[A-Za-z0-9_-]+=' | tr -d '=' | while read cookie; do
  case "$cookie" in
    session|PHPSESSID|JSESSIONID|ASP.NET_SessionId|cf_clearance|__cf_bm|_ga|_gid) continue ;;
    *) echo "  INJECTION CANDIDATE: $cookie" >> ../cookie_injection_targets.txt ;;
  esac
done

# Verify cookie value reflected in response or used in SQL
# PortSwigger pattern: TrackingId cookie value renders in response body on 200,
# throws 500 on syntax error (') → confirms SQL injection surface
for target in $(cat live_urls.txt); do
  curl -sk -w "\n%{http_code}" "$target" -b "test='; session=dummy" 2>/dev/null \
    | grep -q '500\|Internal Server Error\|SQL\|DB Error' \
    && echo "  SQLi candidate (500 on '): $target" >> ../cookie_injection_targets.txt
done

# Database fingerprint from cookie/parameter errors (no UNION needed):
# PortSwigger pattern — inject database-specific concat to identify backend:
# Oracle:   test'||'test → 200 (|| concat from dual is unique to Oracle)
# MySQL:    test'+'test → 200 (+ concat in numeric context, # comment)
# PostgreSQL: test'||'test → 200 but no FROM dual requirement
# MSSQL:    test'+'test → 200 (+ concat, -- comment)
echo "=== Database Fingerprint (via cookie/param injection) ===" >> ../cookie_injection_targets.txt
for target in $(cat ../cookie_injection_targets.txt | grep -E '^https?://'); do
  # Oracle test (|| concat)
  oracle=$(curl -sk -w "%{http_code}" -o /dev/null "$target" -b "test'||(SELECT 1 FROM dual)||'; session=d" 2>/dev/null)
  [ "$oracle" = "200" ] && echo "  ORACLE: $target" >> ../cookie_injection_targets.txt
done
```

### Step 7: URL Discovery and Crawling

Discover all reachable URLs, endpoints, and parameters. **Information disclosure (907 H1 reports) and IDOR (216 reports) frequently originate from undocumented API endpoints found through historical URL archives.**

```bash
# Katana crawling (JavaScript-aware, headless)
cat live_urls.txt | katana \
  -depth 3 \
  -js-crawl -jsluice \
  -known-files all \
  -automatic-form-fill \
  -field-scope fqdn \
  -output katana_crawled.txt

# Wayback Machine URL discovery (critical for finding legacy endpoints)
for domain in $(cat wildcard_domains.txt); do
  gau --subs $domain >> gau_urls.txt 2>/dev/null
  waybackurls $domain >> wayback_urls.txt 2>/dev/null
done

# Additional URL sources
for domain in $(cat wildcard_domains.txt); do
  # AlienVault OTX
  curl -s "https://otx.alienvault.com/api/v1/indicators/domain/${domain}/url_list?limit=500" | \
    jq -r '.url_list[].url' 2>/dev/null >> alienvault_urls.txt
  # URLScan.io
  curl -s "https://urlscan.io/api/v1/search/?q=domain:${domain}" | \
    jq -r '.results[].page.url' 2>/dev/null >> urlscan_urls.txt
done

# Merge, deduplicate, and filter URLs
cat gau_urls.txt wayback_urls.txt katana_crawled.txt \
    alienvault_urls.txt urlscan_urls.txt 2>/dev/null | \
    sort -u | uro > unique_urls.txt

# Categorize URLs by type
cat unique_urls.txt | grep -E '\?.*=' > endpoints_with_params.txt
cat unique_urls.txt | grep -E '\.(js|json|xml|yaml|yml|env|config|bak|backup|old)$' > interesting_files.txt
cat unique_urls.txt | grep -iE 'api|graphql|v1|v2|v3|internal|admin|dev|staging' > api_related_urls.txt
cat unique_urls.txt | grep -iE 'login|signin|signup|register|auth|oauth|saml|sso|password|reset' > auth_endpoints.txt
cat unique_urls.txt | grep -iE 'upload|import|export|download|file|attachment|avatar|image' > file_operations.txt
cat unique_urls.txt | grep -iE 'webhook|callback|notify|hook|integration' > webhook_endpoints.txt
```

### Step 8: JavaScript Analysis and Hidden Endpoint Discovery

**Stored XSS (357 H1 reports) and IDOR (216 reports) frequently stem from JavaScript-accessible endpoints. JS analysis has revealed AWS keys, internal API routes, admin panels, and Stripe tokens in disclosed reports (bounties up to $25K).**

```bash
mkdir -p js_analysis && cd js_analysis

# Download JavaScript files
cat ../interesting_files.txt | grep '\.js$' | httpx -mc 200 -sr -srd js_downloads/

# Extract endpoints from JavaScript
for jsfile in $(find js_downloads/ -name "*.js" -type f); do
  python3 linkfinder -i "$jsfile" -o cli >> ../js_endpoints.txt 2>/dev/null
done

# Extract secrets and API keys
for jsfile in $(find js_downloads/ -name "*.js" -type f); do
  python3 SecretFinder -i "$jsfile" -o cli >> ../js_secrets.txt 2>/dev/null
done

# Manual grep for common patterns
grep -rE 'apiKey|api_key|secret|token|password|credential|authorization|Bearer|aws_access|AKIA[0-9A-Z]{16}' \
  js_downloads/ >> ../js_hardcoded_secrets.txt 2>/dev/null

# Categorize discovered endpoints
cat ../js_endpoints.txt | grep -iE 'api|graphql|v1|v2|internal|admin' | sort -u > ../api_endpoints.txt
cat ../js_endpoints.txt | grep -iE 'auth|login|oauth|token|session' | sort -u > ../auth_endpoints_from_js.txt

# XML/SOAP endpoint discovery (critical for WAF bypass attacks)
# PortSwigger lab pattern: /product/stock accepts XML POST, JS builds XML payloads
grep -rE 'stockCheck|contentType.*xml|application/xml|Content-Type.*xml|\"xml\"' js_downloads/ 2>/dev/null >> ../xml_endpoints.txt
```

### Step 9: XML, SOAP, and Non-JSON API Endpoint Discovery

**XML and SOAP endpoints are prime targets for WAF/filter bypass via encoding. The PortSwigger SQLi filter bypass lab (XML encoding) demonstrates that XML endpoints use encoding layers not present in JSON APIs. Detecting them early surfaces bypass opportunities.**

```bash
# Detect XML/SOAP content type usage in JavaScript
grep -rE "application/xml|text/xml|soap" js_downloads/ --include="*.js" 2>/dev/null

# Check for XML payload construction in JS (template literal pattern)
# window.contentType = 'application/xml'; → XML endpoint confirmed
grep -rE "contentType.*xml|\\.xml|xml.*payload|buildXml|toXml" js_downloads/ --include="*.js" 2>/dev/null

# Pattern from PortSwigger lab: JS builds XML string from FormData
# function payload(data) { var xml = '<stockCheck>'; ... xml += '</stockCheck>'; return xml; }
grep -rE "xml\s*\+=\s*'<|var xml = '<" js_downloads/ --include="*.js" 2>/dev/null

# Check for non-JSON Content-Type in fetch/AJAX calls
# Content-Type: application/xml bypasses JSON-only WAF rules
grep -rE "headers.*Content-Type.*(xml|form-urlencoded|multipart)" js_downloads/ --include="*.js" 2>/dev/null

# After discovering XML endpoints, add them to the attack surface:
cat ../xml_endpoints.txt | while read ep; do
  echo "XML endpoint: $ep — test for XML entity encoding, XXE, XPath injection"
done >> ../priority_targets.txt
```

### Step 9: API Schema and GraphQL Discovery

**GraphQL introspection and API schema exposure are common findings. GraphQL endpoints frequently leak schema details, internal field names, and deprecated queries that bypass authorization checks.**

```bash
# GraphQL endpoint detection
cat live_urls.txt | httpx -path "/graphql,/gql,/api/graphql,/query,/graphiql,/playground,/v1/graphql,/v2/graphql" \
  -mc 200,400 -o graphql_endpoints.txt

# GraphQL introspection test
while IFS= read -r url; do
  # Test introspection query
  response=$(curl -sk -X POST -H "Content-Type: application/json" \
    -d '{"query":"{__schema{types{name,fields{name,type{name,kind,ofType{name,kind}}}}}}"}' \
    "$url" 2>/dev/null)
  if echo "$response" | grep -q '"data"'; then
    echo "[INTROSPECTION ENABLED] $url"
    echo "$response" > "graphql_introspection_$(echo $url | md5sum | cut -d' ' -f1).json"
  fi
done < graphql_endpoints.txt > graphql_results.txt

# REST API schema discovery
# Check for OpenAPI/Swagger documentation
cat live_urls.txt | httpx -path "/swagger.json,/swagger.yaml,/api-docs,/openapi.json,/v2/api-docs,/v3/api-docs,/api/swagger.json" \
  -mc 200 -o api_docs_endpoints.txt

# Check for common API patterns
cat live_urls.txt | httpx -path "/api/,/api/v1/,/api/v2/,/v1/,/v2/,/rest/" \
  -mc 200,301,302 -o api_base_paths.txt
```

### Step 10: Cloud Asset Discovery

**S3 bucket misconfigurations and exposed cloud assets have produced many critical bounties ($500-$15K). The Shopify GitHub token disclosure ($50K) and Snapchat JFrog Artifactory leak ($15K) are top examples.**

```bash
# S3 bucket enumeration
for domain in $(cat wildcard_domains.txt); do
  base=$(echo $domain | cut -d'.' -f1)
  # Common S3 bucket naming patterns
  for bucket in "${base}-prod" "${base}-dev" "${base}-staging" "${base}-assets" "${base}-static" "${base}-cdn" "${base}-media" "prod-${base}" "dev-${base}"; do
    code=$(curl -sk -o /dev/null -w "%{http_code}" "https://${bucket}.s3.amazonaws.com" 2>/dev/null)
    if [ "$code" != "404" ]; then
      echo "[${code}] s3://${bucket}"
    fi
  done
  # Check discovered bucket names from JS/crawling
done > s3_buckets.txt

# Test S3 bucket permissions
while IFS= read -r bucket_line; do
  bucket=$(echo "$bucket_line" | sed 's/.*s3:\/\///')
  # List objects (if listing enabled)
  curl -sk "https://${bucket}.s3.amazonaws.com/?max-keys=10" 2>/dev/null | head -20
  # Check for public ACL
  aws s3api get-bucket-acl --bucket "$bucket" --no-sign-request 2>/dev/null
done < <(grep -E '\[200\]|\[403\]' s3_buckets.txt)

# Google Cloud Storage buckets
for domain in $(cat wildcard_domains.txt); do
  base=$(echo $domain | cut -d'.' -f1)
  curl -sk "https://storage.googleapis.com/${base}-prod" 2>/dev/null | head -5
done > gcs_buckets.txt 2>/dev/null

# S3 Bucket Google Dork (find exposed buckets belonging to target)
# site:s3.amazonaws.com "target"
# site:amazonaws.com inurl:target
# site:storage.googleapis.com "target"

# If bucket is found writable, full takeover possible:
aws s3 ls s3://bucket-name --no-sign-request
aws s3 cp exploit.html s3://bucket-name/ --acl public-read
```

### Step 11: Source Code and Credential Leak Discovery

**Credential leaks in public repositories are among the highest-paid findings. PHP source code recovery via highlight_file(), .htpasswd file discovery, and phpinfo exposure are also high-value reconnaissance targets. The vulnweb.rootbrain.com lab demonstrated: .htpasswd with 3 APR1 hashes found via directory traversal, phpinfo page revealing disable_functions and DOCUMENT_ROOT.**

```bash
# PHP source code recovery techniques (from vulnweb lab):
# 1. highlight_file() — if you can upload PHP, use it to dump source
# echo '<?php header("Content-Type: text/plain"); highlight_file($_GET["f"]);' > source.php

# 2. php://filter — if LFI is available
# ?file=php://filter/convert.base64-encode/resource=target.php

# 3. shell_exec() injection — if RCE is found
# ?cmd=cat /var/www/html/vulnweb/target.php

# .htpasswd discovery (Apache APR1/MD5-crypt hashes):
find / -name ".htpasswd" -type f 2>/dev/null
find /var/www -name ".*pass*" -type f 2>/dev/null

# phpinfo exposure (CRITICAL — reveals disable_functions, DOCUMENT_ROOT, open_basedir):
cat live_urls.txt | httpx -path "/phpinfo.php,/info.php,/php_info.php,/test.php" -mc 200 -o phpinfo_endpoints.txt

# From phpinfo, extract:
# - disable_functions → which exec functions are blocked
# - DOCUMENT_ROOT → app location on disk
# - open_basedir → which directories are accessible
# - Server API → CGI/FPM/mod_php (affects exploitation strategy)
# - loaded extensions → informs payload crafting
```

```bash
# GitHub code search for sensitive patterns
domain_short=$(cat wildcard_domains.txt | head -1 | cut -d'.' -f1)
github_search_queries=(
  "\"${domain_short}\" password"
  "\"${domain_short}\" secret"
  "\"${domain_short}\" api_key"
  "\"${domain_short}\" AWS_ACCESS"
  "\"${domain_short}\" token"
  "\"${domain_short}\" .env"
  "\"${domain_short}\" config"
  "\"${domain_short}\" credentials"
  "\"${domain_short}\" jdbc:"
  "\"${domain_short}\" mongodb://"
  "\"${domain_short}\" redis://"
)

for query in "${github_search_queries[@]}"; do
  encoded=$(echo "$query" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))")
  curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/search/code?q=${encoded}&per_page=10" | \
    jq -r '.items[] | "\(.repository.full_name) — \(.html_url)"' >> github_leaks.txt 2>/dev/null
done

# GitLab code search
glab search code --query "${domain_short}" 2>/dev/null >> gitlab_leaks.txt

# Check for exposed .git directories (source code disclosure)
cat live_urls.txt | httpx -path "/.git/HEAD,/.git/config" -mc 200 -o git_exposure.txt

# GitHub Dork Patterns (manual — often more effective than API)
# "target.com" password                     → plaintext credentials
# "target.com" api_key                      → API keys
# "target.com" AWS_ACCESS_KEY_ID            → AWS credentials
# "target.com" secret                       → generic secrets
# "target.com" .env                         → .env files with all secrets
# "dev.target.com"                          → developer repos
# "api.target.com"                          → API endpoint references
# "target.com" jdbc:                        → database connection strings
# "target.com" mongodb://                   → MongoDB URIs with credentials
# "target.com" redis://                     → Redis URIs
# "target.com" ftp://                       → FTP credentials

# Automated GitHub secret scanning tools
trufflehog git https://github.com/target/repo --json > recon/trufflehog_findings.json
gitleaks detect -s https://github.com/target/repo -f json -r recon/gitleaks_report.json
```

### IP Range Scanning and Infrastructure Discovery

**Recon like a Boss technique: scanning a company's entire IP range for exposed services. One researcher found phpinfo.php across Yahoo's 260,000 IP range. Massive scale, automation required.**

```bash
# 1. Get IP ranges from whois
whois -h whois.arin.net "n Target Corp" | grep -Eo "([0-9.]+){4}/[0-9]+" | sort -u > recon/ip_ranges.txt

# 2. Convert CIDR to IP list for targeted scanning
nmap -sL -n 192.0.2.0/24 | grep 'Nmap scan' | awk '{print $NF}' > recon/target_ips.txt

# 3. Fast scan for common web ports across entire range
# Pattern: look for phpinfo, phpmyadmin, backup files, exposed configs
cat recon/ip_ranges.txt | naabu -p 80,443,8080,8443,8000,8888 -o recon/live_ips.txt

# 4. HTTP probe with path discovery
cat recon/live_ips.txt | httpx -path "/phpinfo.php,/info.php,/php_info.php,/test.php,/backup/,.env,/admin/" \
  -mc 200 -o recon/ip_endpoints.txt

# 5. High-value file hunt across IPs (automated)
while read ip; do
  for path in "phpinfo.php" ".env" "backup.zip" "wp-config.php.bak" ".git/HEAD"; do
    code=$(curl -sk -o /dev/null -w "%{http_code}" -m 5 "http://$ip/$path" 2>/dev/null)
    [ "$code" = "200" ] && echo "FOUND: http://$ip/$path" >> recon/ip_hits.txt
  done
done < recon/live_ips.txt
```

### Step 12: OAuth/SAML/SSO Endpoint Mapping

**OAuth and SAML misconfigurations are common — authentication bypass via SAML ($8.5K Uber), OAuth token theft, and SSO bypass regularly earn $500-$10K.**

```bash
# Identify OAuth/SAML endpoints from URLs
cat unique_urls.txt | grep -iE 'oauth|saml|sso|openid|authorize|callback|redirect_uri' > oauth_saml_endpoints.txt

# Check for common OAuth metadata endpoints
cat live_urls.txt | httpx -path \
  "/.well-known/openid-configuration,\
/.well-known/oauth-authorization-server,\
/.well-known/jwks.json,\
/saml/metadata,\
/sso/metadata,\
/FederationMetadata.xml" \
  -mc 200 -o oauth_metadata_endpoints.txt
```

### Step 13: Robots.txt, Sitemap, and Sensitive Disclosure File Discovery

**Hundreds of HackerOne access control reports ($35K GitLab, $20K Valve, $10K GitHub) trace back to robots.txt-disclosed admin panels, sitemap leaks, and forced browsing of unprotected endpoints. This is the single highest-ROI recon step.**

```bash
# Fetch robots.txt from every live host
mkdir -p recon/sensitive_disclosure
while IFS= read -r url; do
  domain=$(echo "$url" | sed 's|https\?://||')
  robots=$(curl -sk -m 5 "$url/robots.txt" 2>/dev/null)
  if echo "$robots" | grep -qi "disallow"; then
    echo "=== $url/robots.txt ===" >> recon/sensitive_disclosure/robots_txt_all.txt
    echo "$robots" >> recon/sensitive_disclosure/robots_txt_all.txt
    # Extract Disallow paths for forced browsing
    echo "$robots" | grep -i "disallow:" | awk '{print $2}' | while read path; do
      echo "$url$path" >> recon/sensitive_disclosure/robots_disclosed_paths.txt
    done
  fi
done < live_urls.txt

# Fetch sitemap.xml from every live host
while IFS= read -r url; do
  for sitemap_path in "/sitemap.xml" "/sitemap_index.xml" "/sitemap" "/sitemap.txt"; do
    code=$(curl -sk -o /dev/null -w "%{http_code}" -m 5 "$url$sitemap_path" 2>/dev/null)
    if [ "$code" = "200" ]; then
      echo "[SITEMAP] $url$sitemap_path" >> recon/sensitive_disclosure/sitemaps_found.txt
      curl -sk "$url$sitemap_path" 2>/dev/null | grep -oP 'https?://[^<>\"]+' >> recon/sensitive_disclosure/sitemap_urls.txt
    fi
  done
done < live_urls.txt

# Check standard sensitive paths — high hit rate in bug bounty
while IFS= read -r url; do
  for path in \
    "/.well-known/security.txt" \
    "/.well-known/change-password" \
    "/admin" "/administrator" "/admin-panel" "/administrator-panel" \
    "/panel" "/console" "/dashboard" "/manage" "/management" \
    "/backup" "/backups" "/db" "/database" "/dump" \
    "/debug" "/dev" "/staging" "/test" "/qa" \
    "/api/admin" "/api/internal" "/api/debug" \
    "/phpmyadmin" "/phpinfo.php" "/info.php" \
    "/status" "/server-status" "/actuator" "/metrics" \
    "/swagger" "/swagger-ui.html" "/api-docs" "/openapi.json" \
    "/.env" "/.git/config" "/.svn/entries" "/.DS_Store" \
    "/config" "/configuration" "/settings" "/setup" \
    "/wp-admin" "/wp-login.php" "/user/login"; do
    code=$(curl -sk -o /dev/null -w "%{http_code}" -m 5 "$url$path" 2>/dev/null)
    if [ "$code" = "200" -o "$code" = "302" -o "$code" = "301" -o "$code" = "403" ]; then
      echo "[$code] $url$path" >> recon/sensitive_disclosure/interesting_paths.txt
    fi
  done
done < live_urls.txt

# Highlight high-value hits
echo "=== High-Value Paths Found ===" > recon/sensitive_disclosure/high_value_hits.txt
grep -E "admin|administrator|panel|console|dashboard|debug" recon/sensitive_disclosure/interesting_paths.txt | \
  grep -v "403" >> recon/sensitive_disclosure/high_value_hits.txt
grep -E "\[200\].*admin|\[302\].*admin" recon/sensitive_disclosure/interesting_paths.txt | \
  tee -a recon/sensitive_disclosure/high_value_hits.txt

# robots.txt disclosed paths — immediate priority testing
echo "=== robots.txt Disclosed Paths (immediate forced browsing targets) ===" >> recon/sensitive_disclosure/high_value_hits.txt
cat recon/sensitive_disclosure/robots_disclosed_paths.txt 2>/dev/null >> recon/sensitive_disclosure/high_value_hits.txt

echo "[+] Robots.txt files found: $(grep -c '===' recon/sensitive_disclosure/robots_txt_all.txt 2>/dev/null)"
echo "[+] Sitemaps found: $(wc -l < recon/sensitive_disclosure/sitemaps_found.txt 2>/dev/null)"
echo "[+] Interesting paths total: $(wc -l < recon/sensitive_disclosure/interesting_paths.txt 2>/dev/null)"
echo "[+] Unprotected admin panels (200): $(grep -cE '\[200\].*admin' recon/sensitive_disclosure/interesting_paths.txt 2>/dev/null)"

# === JavaScript Source Code Admin URL Extraction ===
# Key insight: PortSwigger "Unpredictable URL" labs — admin panel URL is disclosed
# in the page's inline JavaScript, visible to any visitor who views page source.
# These URLs are NOT in robots.txt or sitemap.xml — only in client-side source.

echo "=== JavaScript-Disclosed Admin URLs ===" > recon/sensitive_disclosure/js_admin_urls.txt
while IFS= read -r url; do
  html=$(curl -sk -m 5 "$url" 2>/dev/null)
  # Pattern 1: setAttribute('href', '/admin-xxxx')
  echo "$html" | grep -oP "setAttribute\s*\(\s*['\"]href['\"]\s*,\s*['\"]\K/admin-[a-z0-9]+" | \
    while read admin_path; do
      echo "$url$admin_path" >> recon/sensitive_disclosure/js_admin_urls.txt
      echo "[JS ADMIN URL] $url$admin_path"
    done
  # Pattern 2: href="/admin-xxxx" in <script> blocks
  echo "$html" | grep -oP 'href\s*=\s*[\x27\x22]\K/admin-[a-z0-9]+' | \
    while read admin_path; do
      echo "$url$admin_path" >> recon/sensitive_disclosure/js_admin_urls.txt
      echo "[JS ADMIN URL (href)] $url$admin_path"
    done
  # Pattern 3: innerHTML with admin URL
  echo "$html" | grep -oP 'innerHTML\s*=\s*[\x27\x22]\K/admin-[a-z0-9]+' | \
    while read admin_path; do
      echo "$url$admin_path" >> recon/sensitive_disclosure/js_admin_urls.txt
      echo "[JS ADMIN URL (innerHTML)] $url$admin_path"
    done
  # Pattern 4: Generic admin/panel paths in script src/href attributes
  echo "$html" | grep -oP '(?:src|href)\s*=\s*[\x27\x22]\K/(?:admin[a-z0-9-]*|panel[a-z0-9-]*|dashboard[a-z0-9-]*)[\x27\x22]' | \
    while read admin_path; do
      echo "$url$admin_path" >> recon/sensitive_disclosure/js_admin_urls.txt
    done
done < live_urls.txt

sort -u recon/sensitive_disclosure/js_admin_urls.txt -o recon/sensitive_disclosure/js_admin_urls.txt
echo "[+] JS-disclosed admin URLs: $(wc -l < recon/sensitive_disclosure/js_admin_urls.txt)"

# Merge JS-discovered URLs into high-value hits
cat recon/sensitive_disclosure/js_admin_urls.txt 2>/dev/null >> recon/sensitive_disclosure/high_value_hits.txt
```

### Step 14: Asset Inventory and Prioritization

Build the final inventory prioritizing by exploitability and bounty potential:

```bash
cat > recon_summary.txt << EOF
=== Reconnaissance Summary ===
Program: {program_name}
Date: $(date)
Scope: $(cat wildcard_domains.txt | tr '\n' ', ')

## Asset Inventory
In-Scope Subdomains: $(wc -l < inscope_subdomains.txt)
Live HTTP Hosts: $(wc -l < live_urls.txt)
Unique URLs: $(wc -l < unique_urls.txt)
Endpoints with Parameters: $(wc -l < endpoints_with_params.txt)
JavaScript Files: $(wc -l < interesting_files.txt)
GraphQL Endpoints: $(wc -l < graphql_endpoints.txt)
API Endpoints (from JS): $(wc -l < api_endpoints.txt)
Auth Endpoints: $(wc -l < auth_endpoints.txt)
File Upload Endpoints: $(wc -l < file_operations.txt)
Webhook Endpoints: $(wc -l < webhook_endpoints.txt)
Origin IPs Bypassing CDN: $(grep -c '200' origin_probe_results.txt 2>/dev/null)
S3 Buckets Discovered: $(wc -l < s3_buckets.txt 2>/dev/null)
GitHub Leaks Found: $(wc -l < github_leaks.txt 2>/dev/null)

## Priority Targets (by bounty potential)
1. Origin servers bypassing CDN — test for SSRF, direct exploitation, internal access
2. Auth endpoints — test OAuth flows, SAML bypass, 2FA bypass, password reset
3. API endpoints with parameters — IDOR, SQLi, mass assignment, parameter pollution
4. GraphQL endpoints — introspection, query depth, batching attacks, authorization gaps
5. File upload endpoints — upload bypass, XSS, RCE
6. Webhook endpoints — SSRF, blind XSS
7. Source code leaks — credential extraction, hardcoded secrets
8. S3 buckets — bucket takeover, public read/write enumeration
EOF
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Wildcard Scope** | A bug bounty scope defined as `*.example.com` — the hunter must enumerate all subdomains matching this pattern |
| **Passive Enumeration** | Gathering subdomains from third-party sources (crt.sh, search engines, DNS databases) without querying target infrastructure |
| **Active Enumeration** | Directly querying target DNS servers, performing brute-force subdomain guessing — generates visible traffic |
| **CDN/Origin Mapping** | Identifying CDN providers (Akamai, CloudFront, Cloudflare) and discovering the origin servers behind them. Origin bypass is a critical finding |
| **Technology Fingerprinting** | Identifying web server, framework, CMS, and JavaScript libraries on each host to guide vulnerability assessment |
| **JavaScript Crawling** | Parsing client-side JS bundles to extract hidden API endpoints, internal routes, and hardcoded secrets |
| **GraphQL Introspection** | Querying `__schema` to enumerate all types, fields, and mutations exposed by a GraphQL API |
| **Source Code Leak Hunting** | Searching GitHub/GitLab for credentials, API keys, configs, and .env files related to the target domain |
| **Cloud Asset Discovery** | Finding S3 buckets, GCP storage, Azure blobs hosting target assets and testing for misconfiguration |

## Tools & Systems

| Tool | Purpose |
|------|---------|
| **Subfinder** | Passive subdomain enumeration from 50+ sources |
| **Amass** | Comprehensive subdomain enumeration with passive/active modes |
| **crt.sh / CertSpotter** | Certificate Transparency log search — highest-yield passive source |
| **PureDNS** | High-performance DNS brute-forcer with wildcard detection |
| **Gotator** | Subdomain permutation generator (dev → dev-api, api-dev, etc.) |
| **Httpx** | HTTP probing with status codes, titles, technologies, and response headers |
| **Katana** | Modern crawling with JavaScript parsing, form filling, scope awareness |
| **GAU / waybackurls** | Fetch historical URLs from Wayback Machine and URL aggregators |
| **Naabu** | Fast port scanner optimized for large-scale subdomain lists |
| **Dnsx** | DNS toolkit for resolving subdomains, CNAME records, reverse lookups |
| **Wafw00f** | WAF detection tool that fingerprints popular WAF products |
| **LinkFinder** | JavaScript endpoint discovery extracting URLs and API routes |
| **SecretFinder** | Extract API keys, tokens, and secrets from JavaScript files |
| **URO** | URL deduplication tool preserving unique parameter combinations |
| **GitHub API** | Code search for leaked credentials, API keys, and configuration files |

## Common Scenarios

### Scenario 1: CDN-Protected Application with Origin Bypass

**Context**: The target uses Akamai CDN which returns 403 for most requests. Reconnaissance reveals origin IPs from DNS history.

**Approach**:
1. Resolve DNS A records and CNAMEs — identify Akamai edgesuite.net
2. Direct-connect to resolved A record IPs with Host header
3. Successful 200 response from origin confirms CDN bypass
4. Test AJAX endpoints through origin (may need X-Requested-With header)
5. Full application accessible — CDN WAF, rate limiting, and geolocation bypassed
6. Priority targets: internal API endpoints, admin panels, debug pages

**Pitfalls**: Not checking all IPs (use both old and current DNS records), not trying HTTP as well as HTTPS, forgetting to set the correct Host header for vhost routing.

### Scenario 2: Single-Page Application (React/Vue/Angular)

**Context**: The target is a SPA with a REST/GraphQL API backend. All content loads dynamically via XHR/fetch.

**Approach**:
1. Skip broad subdomain enumeration if single-target scope
2. Use Katana with JS crawling enabled to capture all API calls
3. Proxy the SPA through Burp Suite to map all XHR/fetch requests
4. Extract API routes from JavaScript bundles with LinkFinder
5. Check for GraphQL endpoint and test introspection
6. Look for `window.base_url`, `window.api_url` variables in JS
7. Map all API routes, methods, and parameters — these are primary IDOR/injection targets

### Scenario 3: Large Program with Cloud Infrastructure

**Context**: The target runs on AWS with S3 buckets, CloudFront distributions, and multiple microservices.

**Approach**:
1. From SPA JavaScript, extract S3 bucket URLs (commonly hardcoded)
2. Test bucket permissions: listing, public read, public write
3. Enumerate bucket naming patterns discovered in JS
4. Check CloudFront behaviors for path-based origin routing flaws
5. Test for subdomain takeover on CloudFront distributions with missing origins
6. Check for exposed AWS credentials in source code and GitHub
7. Map internal service communication patterns from API responses

## Output Format

```
=== Bug Bounty Reconnaissance Report ===
Program: {program_name}
Date: {date}

## Scope Summary
- Wildcard Domains: {count}
- Specific Targets: {count}
- In-Scope Subdomains: {count}
- Live HTTP Hosts: {count}

## CDN/Origin Mapping
| Subdomain | CDN | Origin IP | Bypass | Notes |
|-----------|-----|-----------|--------|-------|
| www.example.com | Akamai | 15.x.x.x | Yes | Direct origin access confirmed |

## Live Host Inventory
| Subdomain | Status | Technology | WAF | Priority |
|-----------|--------|------------|-----|----------|
| api.example.com | 200 | Node.js, Express | None | HIGH |
| admin.example.com | 403 | Nginx | AWS WAF | MEDIUM |

## URL Statistics
- Total Unique URLs: {count}
- URLs with Parameters: {count}
- JavaScript Files: {count}
- API Endpoints (from JS): {count}
- GraphQL Endpoints: {count}
- Auth Endpoints: {count}
- File Upload Endpoints: {count}

## Cloud Assets
- S3 Buckets: {list}
- GitHub Leaks: {count}

## Reconnaissance Checklist
- [x] Scope parsed and validated
- [x] Passive subdomain enumeration (6 sources)
- [x] Active DNS brute-force
- [x] CDN/Origin mapping and bypass testing
- [x] Live host probing (11 ports)
- [x] Technology fingerprinting
- [x] URL crawling and discovery (Katana + GAU + waybackurls)
- [x] JavaScript analysis (LinkFinder + SecretFinder)
- [x] GraphQL detection and introspection testing
- [x] API schema discovery
- [x] Business logic surface mapping (multi-step flows, client-side secrets)
- [x] Cloud asset enumeration (S3, GCS, GitHub)
- [x] OAuth/SAML endpoint mapping
```

### Auto-Generate Reconnaissance Phase Report

After completing reconnaissance, run this script to produce `reports/{date}/RECON_REPORT.md`:

```python
#!/usr/bin/env python3
"""Generate reconnaissance phase report from output files."""

import os, datetime, subprocess

def generate_recon_report(program_name, recon_dir, output_dir="./reports"):
    """Read recon output files and produce a structured recon report."""
    
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    out = f"{output_dir}/{date}"
    os.makedirs(out, exist_ok=True)
    
    # Read all recon output files
    def count_lines(filepath):
        try:
            with open(f"{recon_dir}/{filepath}") as f:
                return sum(1 for _ in f)
        except: return 0
    
    def read_file(filepath):
        try:
            with open(f"{recon_dir}/{filepath}") as f:
                return f.read().strip()
        except: return "N/A"
    
    # Gather stats
    subs = count_lines("inscope_subdomains.txt")
    live = count_lines("live_urls.txt")
    urls = count_lines("unique_urls.txt")
    params = count_lines("endpoints_with_params.txt")
    js_files = count_lines("interesting_files.txt")
    graphql = count_lines("graphql_endpoints.txt")
    api_eps = count_lines("api_endpoints.txt")
    robots = count_lines("sensitive_disclosure/robots_disclosed_paths.txt")
    js_admins = count_lines("sensitive_disclosure/js_admin_urls.txt")
    s3 = count_lines("s3_buckets.txt")
    github = count_lines("github_leaks.txt")
    
    # Generate report
    report = f"""# Reconnaissance Phase Report — {program_name}
**Date**: {date}

## Scope Summary
| Metric | Count |
|--------|-------|
| In-Scope Subdomains | {subs} |
| Live HTTP Hosts | {live} |
| Unique URLs Discovered | {urls} |
| Parameterized Endpoints | {params} |
| JavaScript Files | {js_files} |
| API Endpoints (from JS) | {api_eps} |
| GraphQL Endpoints | {graphql} |
| Robots.txt Disclosed Paths | {robots} |
| JS-Disclosed Admin URLs | {js_admins} |
| S3 Buckets Found | {s3} |
| GitHub Leaks Found | {github} |

## High-Priority Targets
{read_file("sensitive_disclosure/high_value_hits.txt")[:3000]}

## Discovery Methods Used
- [x] Passive subdomain enumeration (SSL certificates, DNS databases, search engines)
- [x] Active DNS brute-force with permutation scanning
- [x] CDN/origin server identification and bypass testing
- [x] Live host probing (HTTP/HTTPS on 11 common ports)
- [x] Technology fingerprinting (Wappalyzer, WAF detection)
- [x] URL crawling and historical discovery (Katana, GAU, waybackurls)
- [x] JavaScript analysis for hidden endpoints and secrets
- [x] GraphQL introspection and field suggestion testing
- [x] Cloud asset enumeration (S3 buckets, GitHub code search)
- [x] OAuth/SAML/SSO endpoint mapping
- [x] robots.txt and sitemap.xml discovery
- [x] JavaScript source code admin URL extraction

## Next Phase
Feed `live_urls.txt`, `endpoints_with_params.txt`, and `js_admin_urls.txt` to **bug-bounty-vulnerability-assessment**.
"""

    report_path = f"{out}/RECON_REPORT_{program_name}.md"
    with open(report_path, "w") as f:
        f.write(report)
    
    print(f"[+] Recon report generated: {report_path}")
    return report_path

# Usage:
# generate_recon_report("shijicloud", "./recon", "./reports")
```

```bash
# Bash one-liner for quick recon report
cat > reports/$(date +%Y-%m-%d)/RECON_REPORT.md << 'RECONEOF'
# Reconnaissance Report — {program_name}
Date: $(date)

## Stats
- Subdomains: $(wc -l < recon/inscope_subdomains.txt)
- Live hosts: $(wc -l < recon/live_urls.txt)  
- URLs: $(wc -l < recon/unique_urls.txt)
- JS files: $(wc -l < recon/interesting_files.txt)
- Admin panels found: $(wc -l < recon/sensitive_disclosure/high_value_hits.txt)

## Priority Targets
$(cat recon/sensitive_disclosure/high_value_hits.txt | head -20)

## Full Data Files
- recon/inscope_subdomains.txt
- recon/live_urls.txt
- recon/unique_urls.txt
- recon/endpoints_with_params.txt
RECONEOF
```
