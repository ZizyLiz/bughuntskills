---
name: bug-bounty-js-analysis
description: >-
  Deep JavaScript analysis pipeline for bug bounty reconnaissance. Iterative
  workflow: Read (download all JS bundles) → Discover (extract endpoints,
  secrets, API patterns) → Get Patterns (categorize by framework, auth model,
  parameter types) → Extend (use discovered patterns to find more endpoints
  through path fuzzing, parameter mutation, and URL construction) → Repeat
  (re-run against newly discovered JS files and API endpoints). Covers
  source map restoration, webpack chunk analysis, SPA route extraction,
  obfuscated JS deobfuscation, hidden admin panel discovery, hardcoded
  credential extraction, and framework-specific pattern recognition
  (React/Angular/Vue/Next.js). Activates for JavaScript analysis, JS
  endpoint discovery, source map, webpack, SPA routes, or API extraction.
domain: cybersecurity
subdomain: web-application-security
tags:
  - bug-bounty
  - javascript-analysis
  - endpoint-discovery
  - source-map
  - webpack
  - spa-routes
  - api-extraction
  - secret-scanning
  - js-deobfuscation
  - parameter-discovery
  - iterative-recon
  - framework-detection
version: "1.0"
author: mahipal
license: Apache-2.0
nist_csf:
  - ID.RA-01
  - ID.AM-01
  - DE.CM-01
mitre_attack:
  - T1595
  - T1592
  - T1590
---

# Bug Bounty JavaScript Analysis — Iterative Deep Discovery

The most common recon mistake: downloading JS files once, running a link extractor, and moving on. The top 1% of bug bounty hunters iterate — each discovered endpoint reveals new JS bundles, which reveal more endpoints, which reveal more bundles. This skill implements that feedback loop.

---

## Iterative Loop Overview

```
                                ┌──────────────────────┐
                                │  1. READ              │
                                │  Download ALL JS      │
                                │  bundles + source maps │
                                └──────────┬───────────┘
                                           │
                                ┌──────────▼───────────┐
                                │  2. DISCOVER          │
                                │  Extract endpoints,   │
              ┌─────────────────│  secrets, API calls,  │
              │                 │  route patterns       │
              │                 └──────────┬───────────┘
              │                            │
              │                 ┌──────────▼───────────┐
              │                 │  3. GET PATTERNS      │
              │                 │  Categorize:          │
              │                 │  - Framework type     │
              │                 │  - Auth model         │
              │                 │  - URL structure      │
              │                 │  - Parameter patterns  │
              │                 │  - Naming conventions  │
              │                 └──────────┬───────────┘
              │                            │
              │                 ┌──────────▼───────────┐
              │                 │  4. EXTEND            │
              │                 │  Fuzz paths using     │
              │   ┌─────────────│  discovered patterns  │
              │   │             │  Mutate parameters    │
              │   │             │  Build URL dictionary │
              │   │             └──────────┬───────────┘
              │   │                        │
              │   │              ┌─────────▼──────────┐
              │   │              │ 5. REPEAT           │◄──────┐
              │   │              │ Hit discovered       │       │
              │   └──────────────│ endpoints → find     │───────┘
              │                  │ new JS + new patterns│  Loop until
              └──────────────────│                      │  no new JS
                                 └──────────────────────┘
```

---

## When to Use

- Starting reconnaissance on a modern SPA (React, Vue, Angular, Next.js)
- After finding webpack chunks but not finding API endpoints
- When the target has minified/obfuscated JS that needs source map restoration
- Hunting for hidden admin panels, internal APIs, or undocumented endpoints
- When automated crawlers miss JS-only routes (SPAs with no href links)
- Before vulnerability assessment — JS analysis reveals the COMPLETE API surface

**Skip when**: the target is a traditional server-rendered app with no JS bundles (use standard link crawling instead).

## Prerequisites

- Node.js 18+ for source map parsing and JS beautification
- Tools: `source-map-unpack`, `js-beautify`, `jsluice`, `getJS`, `xnLinkFinder`
- Target URL(s) with JavaScript-heavy frontend
- Directory structure: `recon/js_analysis/{iteration_1,iteration_2,...}`

---

## Workflow

### Iteration 1: READ — Download All JavaScript

```bash
ITER=1
mkdir -p recon/js_analysis/iteration_${ITER}/{bundles,sourcemaps,output}
cd recon/js_analysis/iteration_${ITER}

# Method 1: getJS — pulls all JS from a URL
getJS --url https://target.com --complete --output bundles/

# Method 2: Wayback Machine JS collection
# Extract JS files from wayback machine
waybackurls target.com | grep '\.js$' | sort -u > bundles/wayback_js_urls.txt
cat bundles/wayback_js_urls.txt | httpx -mc 200 -sr -srd bundles/wayback/

# Method 3: Manual extraction from page source
curl -sk "https://target.com/" | grep -oP 'src="([^"]+\.js)"' | \
  sed 's/src="//' | sed 's/"$//' | while read js; do
    url="https://target.com${js}"
    curl -sk "$url" -o "bundles/$(basename $js)"
  done

# Method 4: Extract from all subdomain pages (recursive)
cat ../../live_urls.txt | while read url; do
  domain=$(echo "$url" | sed 's|https\?://||')
  curl -sk "$url" | grep -oP '(?:src|href)="([^"]+\.js)"' | \
    sed 's/.*="//;s/"$//' | while read js; do
      full_js="${js}"
      [[ "$js" != http* ]] && full_js="${url}/${js#/}"
      curl -sk "$full_js" -o "bundles/${domain}_$(basename $js)" 2>/dev/null
    done
done

# Deobfuscate and beautify all downloaded JS
mkdir -p beautified
for jsfile in bundles/*.js; do
  js-beautify "$jsfile" > "beautified/$(basename $jsfile)" 2>/dev/null
done

echo "[Iteration ${ITER}] Downloaded $(ls bundles/*.js 2>/dev/null | wc -l) JS files"
echo "[Iteration ${ITER}] Beautified files in beautified/"
```

### Iteration 1: DISCOVER — Extract Everything

```bash
ITER=1
cd recon/js_analysis/iteration_${ITER}

# === DISCOVERY PHASE ===

# 1. Extract ALL URL-like strings from beautified JS
echo "=== Extract Endpoints ==="
for jsfile in beautified/*.js; do
  # API paths: /api/v1/users, /v2/items, /graphql
  grep -oP '"([/](?:api|v[0-9]|graphql|rest|rpc|ws)/[a-zA-Z0-9/_\-.]+)"' "$jsfile" | \
    tr -d '"' >> output/all_endpoints.txt
  
  # Generic paths: /users, /items, /admin
  grep -oP '"([/][a-z][a-z0-9/_\-.]+)"' "$jsfile" | \
    tr -d '"' >> output/all_endpoints.txt
  
  # Path template patterns: /users/{id}, /items/:id
  grep -oP "'([/][a-z][a-z0-9/_{}:]+)'" "$jsfile" | \
    tr -d "'" >> output/all_endpoints.txt
  
  # Template literal paths: `/api/${version}/users`
  grep -oP '`([/][a-z][a-zA-Z0-9/\${}]+)`' "$jsfile" | \
    sed 's/`//g' >> output/all_endpoints.txt
done

sort -u output/all_endpoints.txt -o output/all_endpoints.txt

# 2. Extract API base URLs and service configurations
echo "=== Extract Base URLs ==="
grep -rE "(baseURL|BASE_URL|apiUrl|API_URL|apiHost|serviceUrl|endpoint|API_BASE)" \
  beautified/ --include="*.js" | grep -oP '["\x27`][^"\x27`]{3,}["\x27`]' | \
  sort -u > output/base_urls.txt

# 3. Extract HTTP method calls (GET, POST, PUT, PATCH, DELETE)
echo "=== Extract API Calls ==="
grep -rE "(\.get\(|\.post\(|\.put\(|\.patch\(|\.delete\(|fetch\()" \
  beautified/ --include="*.js" | while read line; do
    # Extract the URL argument
    echo "$line" | grep -oP '(?:get|post|put|patch|delete|fetch)\s*\(\s*["\x27`]([^"\x27`]{3,})' | \
      sed 's/.*("//;s/("/(/;s/`//g' >> output/api_calls.txt
  done

# 4. Extract query parameters from API calls
echo "=== Extract Parameters ==="
grep -oP '[\?&]([a-zA-Z][a-zA-Z0-9_]+)=' beautified/*.js | \
  sed 's/[?&]//;s/=//' | sort -u > output/parameter_names.txt

# 5. Secret scanning
echo "=== Extract Secrets ==="
# API keys
grep -rE "(apiKey|api_key|API_KEY|apikey)\s*[:=]\s*['\"]([^'\"]{8,})" beautified/ | \
  grep -oP "['\"][^'\"]{8,}['\"]$" | tr -d "'\"" >> output/secrets.txt

# AWS keys
grep -rE "AKIA[0-9A-Z]{16}" beautified/ >> output/secrets.txt

# JWT tokens
grep -rE "eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+" beautified/ >> output/secrets.txt

# Internal URLs
grep -rE "(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.1[6-9]|172\.2[0-9]|172\.3[0-1]|192\.168\.)" \
  beautified/ >> output/internal_ips.txt

# 6. Hidden form fields / input names
grep -rE "(input|param|field|name)\s*[:=]\s*['\"]([a-z][a-zA-Z0-9_]{2,})['\"]" beautified/ | \
  grep -oP "['\"][a-z][a-zA-Z0-9_]{2,}['\"]" | sort -u | tr -d "'\"" >> output/hidden_params.txt

echo "[DISCOVERY] Extracted:"
echo "  Endpoints: $(wc -l < output/all_endpoints.txt)"
echo "  Base URLs: $(wc -l < output/base_urls.txt)"
echo "  API calls: $(wc -l < output/api_calls.txt)"
echo "  Parameters: $(wc -l < output/parameter_names.txt)"
echo "  Secrets: $(wc -l < output/secrets.txt)"
```

### Iteration 1: GET PATTERNS — Categorize What You Found

```bash
ITER=1
cd recon/js_analysis/iteration_${ITER}

# === PATTERN ANALYSIS ===

# 1. Framework Detection
echo "=== Framework Detection ==="
for jsfile in beautified/*.js; do
  if grep -q "createElement\|React\.\|_react\|jsx(" "$jsfile" 2>/dev/null; then
    echo "  [React] $jsfile"
  fi
  if grep -q "defineComponent\|createApp\|Vue\.\|_vue\|ref(" "$jsfile" 2>/dev/null; then
    echo "  [Vue] $jsfile"
  fi
  if grep -q "NgModule\|Component\|Injectable\|@angular" "$jsfile" 2>/dev/null; then
    echo "  [Angular] $jsfile"
  fi
  if grep -q "getServerSideProps\|getStaticProps\|useRouter\|__NEXT" "$jsfile" 2>/dev/null; then
    echo "  [Next.js] $jsfile"
  fi
  if grep -q "lodash\|underscore\|jquery\|axios" "$jsfile" 2>/dev/null; then
    echo "  [Lib: $jsfile]" | head -5
  fi
done > output/framework_detection.txt

# 2. Auth Model Detection
echo "=== Auth Model Detection ==="
grep -rE "(Bearer|Authorization|JWT|OAuth|access_token|id_token|refresh_token)" \
  beautified/ --include="*.js" | head -20 > output/auth_patterns.txt

grep -rE "(session|cookie|csrf|x-csrf|xsrf|x-xsrf)" \
  beautified/ --include="*.js" | head -10 >> output/auth_patterns.txt

# 3. URL Structure Pattern Analysis
echo "=== URL Pattern Analysis ==="
# Extract the structure: count path segments, identify variable parts
cat output/all_endpoints.txt | while read path; do
  # Count segments
  segments=$(echo "$path" | tr '/' '\n' | grep -c .)
  # Identify pattern: /static vs /{variable}
  pattern=$(echo "$path" | sed 's/[0-9a-f]{8,}/{id}/g;s/[0-9]+/{id}/g')
  echo "$segments $pattern"
done | sort | uniq -c | sort -rn | head -30 > output/url_patterns.txt

# 4. Naming Convention Detection
echo "=== Naming Conventions ==="
# Detect: camelCase vs snake_case vs kebab-case
camel=$(grep -oP '[a-z]+[A-Z][a-zA-Z]+' output/all_endpoints.txt | wc -l)
snake=$(grep -oP '[a-z]+_[a-z]+' output/all_endpoints.txt | wc -l)
kebab=$(grep -oP '[a-z]+-[a-z]+' output/all_endpoints.txt | wc -l)
echo "  camelCase paths: $camel"
echo "  snake_case paths: $snake" 
echo "  kebab-case paths: $kebab"

# 5. Version detection — API versioning scheme
cat output/all_endpoints.txt | grep -oP '/v[0-9]+/' | sort -u > output/api_versions.txt
echo "  API versions: $(cat output/api_versions.txt)"

# 6. Build URL fuzzing wordlist from patterns
cat output/all_endpoints.txt | sed 's|/[^/]*$|/|' | sort -u | while read prefix; do
  # Get the last segment variations for this prefix
  grep "^${prefix}" output/all_endpoints.txt | \
    grep -oP '[^/]+$' >> "output/wordlist_$(echo $prefix | md5sum | cut -c1-8).txt"
done

echo "[PATTERNS] Generated:"
echo "  URL patterns: $(wc -l < output/url_patterns.txt)"
echo "  Framework: $(cat output/framework_detection.txt | head -5)"
echo "  Auth model: $(cat output/auth_patterns.txt | head -5)"
```

### Iteration 1: EXTEND — Use Patterns to Find More

```bash
ITER=1
cd recon/js_analysis/iteration_${ITER}

# === EXTENDED DISCOVERY ===

# 1. Fuzz discovered API prefixes with parameter mutation
# Pattern discovered: /api/v1/users/{id}/profile
# Extend: /api/v1/users/{id}/settings, /api/v1/users/{id}/orders, etc.
cat output/all_endpoints.txt | sed 's|/[^/]*$||' | sort -u > output/api_prefixes.txt

known_suffixes=(
  "list" "detail" "create" "update" "delete" "search" "filter"
  "info" "profile" "settings" "preferences" "config" "history"
  "status" "export" "import" "report" "dashboard" "summary"
  "all" "active" "inactive" "pending" "archived" "draft"
  "by-id" "by-name" "by-date" "by-status"
)

while IFS= read -r prefix; do
  for suffix in "${known_suffixes[@]}"; do
    echo "${prefix}/${suffix}" >> output/extended_endpoints.txt
    echo "${prefix}/${suffix}?page=1&size=10" >> output/extended_params.txt
  done
done < output/api_prefixes.txt

# 2. Path parameter mutation: /users/1 → /users/2, /users/3
grep -oP '/[a-z]+/\d+' output/all_endpoints.txt | while read path; do
  base=$(echo "$path" | grep -oP '/[a-z]+/')
  for id in 1 2 3 100 1000; do
    echo "${base}${id}" >> output/extended_endpoints.txt
  done
done

# 3. Version fuzzing: /v1/users → /v2/users, /v3/users
cat output/api_versions.txt | while read version; do
  current=$(echo $version | grep -oP '\d+')
  for next in $(seq $((current+1)) $((current+3))); do
    grep "/v${current}/" output/all_endpoints.txt | \
      sed "s/v${current}/v${next}/g" >> output/extended_endpoints.txt
  done
done

# 4. Auth endpoint construction from patterns
# If login is POST /api/auth/login, test:
# POST /api/auth/register, POST /api/auth/forgot, POST /api/auth/reset
grep "auth\|login\|oauth" output/all_endpoints.txt | while read auth_path; do
  for action in "register" "forgot" "reset" "verify" "refresh" "logout" "signup" "activate"; do
    dir=$(echo "$auth_path" | sed 's|/[^/]*$|/|')
    echo "${dir}${action}" >> output/extended_endpoints.txt
  done
done

# 5. Content-type mutation: generate JSON/XML/form variants
grep -v '^$' output/all_endpoints.txt | while read ep; do
  echo "$ep (JSON)" >> output/extended_content_types.txt
  echo "$ep (XML)" >> output/extended_content_types.txt
  echo "$ep (form-urlencoded)" >> output/extended_content_types.txt
done

sort -u output/extended_endpoints.txt -o output/extended_endpoints.txt
echo "[EXTEND] Generated $(wc -l < output/extended_endpoints.txt) extended endpoint candidates"
```

### Iteration 1: REPEAT — Test Extensions, Find New JS

```bash
ITER=1
cd recon/js_analysis/iteration_${ITER}

# === TEST EXTENDED ENDPOINTS ===

# 1. Probe extended endpoints to find live ones
cat output/extended_endpoints.txt | head -200 | httpx \
  -mc 200,401,403 \
  -status-code -title -content-length \
  -o output/live_extended_endpoints.txt 2>/dev/null

# 2. Any new JS bundles from hit endpoints?
grep "200" output/live_extended_endpoints.txt | awk '{print $1}' | while read url; do
  # Check if this HTML page loads new JS files
  curl -sk "$url" | grep -oP 'src="([^"]+\.js)"' | sed 's/src="//;s/"$//' | \
    while read js; do
      echo "$js" >> output/new_js_discovered.txt
    done
done

# 3. If new JS found → GO TO ITERATION 2
# This is the recursive loop — each new JS file may contain more endpoints

if [ -s output/new_js_discovered.txt ]; then
  NEW_JS_COUNT=$(wc -l < output/new_js_discovered.txt)
  echo "[REPEAT] Found ${NEW_JS_COUNT} new JS files. Triggering Iteration 2..."
  
  # Save for next iteration
  sort -u output/new_js_discovered.txt -o output/new_js_discovered.txt
  
  # GO TO ITERATION 2 — but first, strip duplicates from iteration 1
  grep -v -f bundles/known_js.txt output/new_js_discovered.txt > output/truly_new_js.txt 2>/dev/null || \
    cp output/new_js_discovered.txt output/truly_new_js.txt
else
  echo "[REPEAT] No new JS discovered. Analysis complete."
fi
```

---

### Iteration 2+ — READ from New JS, Repeat Pattern Extraction

```bash
# === ITERATION 2: READ new JS from iteration 1 ===
ITER=2
mkdir -p recon/js_analysis/iteration_${ITER}/{bundles,beautified,output}
cd recon/js_analysis/iteration_${ITER}

# Download newly discovered JS files
cat ../iteration_1/output/truly_new_js.txt | while read js_url; do
  full_url="${js_url}"
  [[ "$js_url" != http* ]] && full_url="https://target.com${js_url}"
  curl -sk "$full_url" -o "bundles/$(basename $js_url | sed 's/[?&=]/_/g')" 2>/dev/null
done

# Beautify
for jsfile in bundles/*.js; do
  js-beautify "$jsfile" > "beautified/$(basename $jsfile)" 2>/dev/null
done

echo "[Iteration ${ITER}] Downloaded $(ls bundles/*.js 2>/dev/null | wc -l) new JS files"

# === ITERATION 2: Source Map Restoration (New in this iteration) ===

# Check for source map references
grep -r "sourceMappingURL" bundles/ --include="*.js" | while read line; do
  map_url=$(echo "$line" | grep -oP 'sourceMappingURL=([^\s]+)' | sed 's/sourceMappingURL=//')
  echo "[SOURCE MAP] $map_url"
  
  # Download the source map
  curl -sk "$map_url" -o "sourcemaps/$(basename $map_url)" 2>/dev/null
  
  # Unpack source map to restore original source
  if [ -f "sourcemaps/$(basename $map_url)" ]; then
    mkdir -p "sourcemaps/unpacked_$(basename $map_url)"
    source-map-unpack "sourcemaps/$(basename $map_url)" \
      --output-dir "sourcemaps/unpacked_$(basename $map_url)/" 2>/dev/null
  fi
done

# If source maps were restored, analyze the unminified source
if ls sourcemaps/unpacked_* 2>/dev/null | grep -q .; then
  echo "[SOURCE MAPS] Restored original source — analyzing..."
  
  # Extract endpoints from unminified source (much richer than minified)
  grep -rE "['\"](/[a-zA-Z][a-zA-Z0-9/_\-.]+)['\"]" sourcemaps/unpacked_*/ | \
    grep -oP "['\"][/][a-zA-Z][a-zA-Z0-9/_\-.]+['\"]" | \
    tr -d "'\"" | sort -u > output/sourcemap_endpoints.txt
  
  # Extract commented-out endpoints
  grep -rE "//\s*(GET|POST|PUT|DELETE|PATCH)\s+[/]" sourcemaps/unpacked_*/ | \
    sort -u > output/commented_endpoints.txt
  
  # Extract route definitions (React Router, Vue Router, Angular Router)
  grep -rE "(path|route)\s*:\s*['\"](/[a-zA-Z][^'\"]+)['\"]" sourcemaps/unpacked_*/ | \
    grep -oP "['\"][/][a-zA-Z][^'\"]+['\"]" | tr -d "'\"" | sort -u > output/router_paths.txt
  
  echo "  Source map endpoints: $(wc -l < output/sourcemap_endpoints.txt)"
  echo "  Commented endpoints: $(wc -l < output/commented_endpoints.txt)"
  echo "  Router paths: $(wc -l < output/router_paths.txt)"
fi

# === ITERATION 2: DISCOVER (Richer regex patterns) ===

cat ../iteration_1/output/api_prefixes.txt ../iteration_1/output/api_calls.txt | sort -u > output/known_endpoints.txt

# Framework-specific patterns
cat output/known_endpoints.txt | while read ep; do
  # React/Vue: try ?query= params for search/list endpoints
  echo "${ep}?q=test" >> output/extended.txt
  echo "${ep}?search=test" >> output/extended.txt
  echo "${ep}?filter=test" >> output/extended.txt
  
  # REST resource expansion: /users → /users/{id}/posts, /users/{id}/comments
  if echo "$ep" | grep -qP '/[a-z]+$'; then
    resource=$(echo "$ep" | grep -oP '[a-z]+$')
    echo "${ep}/{id}/posts" >> output/extended.txt
    echo "${ep}/{id}/comments" >> output/extended.txt
    echo "${ep}/{id}/files" >> output/extended.txt
  fi
done

sort -u output/extended.txt -o output/extended.txt
echo "[Iteration ${ITER}] Extended to $(wc -l < output/extended.txt) endpoint candidates"

# === ITERATION 2: Repeat check ===
cat output/extended.txt | head -300 | httpx -mc 200,401 -o output/live_iter2.txt 2>/dev/null
echo "  Live from iteration 2: $(wc -l < output/live_iter2.txt)"

# Check for MORE new JS
grep "200" output/live_iter2.txt | awk '{print $1}' | while read url; do
  curl -sk "$url" | grep -oP 'src="([^"]+\.js)"' | sed 's/src="//;s/"$//' >> output/new_js_iter2.txt
done

NEW=$(wc -l < output/new_js_iter2.txt 2>/dev/null)
echo "  New JS from iteration 2: $NEW"

if [ "$NEW" -gt 0 ]; then
  echo "  → Continue to Iteration 3..."
else
  echo "  → JS analysis converged. Pipeline complete."
fi
```

---

## Pattern Libraries

### Framework Pattern Matchers

| Framework | Detection Signatures | Route Patterns | API Pattern |
|-----------|---------------------|----------------|-------------|
| **React** | `createElement`, `_react`, `.jsx` | `<Route path="/x">`, `useNavigate` | `fetch(` or `axios.get(` in useEffect |
| **Vue** | `defineComponent`, `createApp`, `_vue` | `{ path: '/x' }` in router | `this.$http.get(` or `axios.get(` |
| **Angular** | `NgModule`, `Injectable`, `@angular` | `{ path: 'x' }` in Routes | `this.http.get(` with HttpClient |
| **Next.js** | `getServerSideProps`, `__NEXT` | File-based: `/pages/x.js` | `getServerSideProps` → backend API |
| **jQuery** | `$(` or `jQuery(` | N/A | `$.ajax({ url: '/x' })` or `$.get(` |

### URL Pattern → Extension Rules

| Discovered Pattern | Extension Candidates |
|-------------------|---------------------|
| `/api/users` | `/api/users/list`, `/api/users/create`, `/api/users/{id}`, `/api/users/{id}/profile`, `/api/users/{id}/settings`, `/api/users/search` |
| `/api/auth/login` | `/api/auth/register`, `/api/auth/forgot`, `/api/auth/reset`, `/api/auth/refresh`, `/api/auth/verify`, `/api/auth/logout` |
| `/api/v1/x` | `/api/v2/x`, `/api/v3/x`, `/api/latest/x`, `/api/internal/x` |
| `/api/x` | `/api/x/{id}`, `/api/x/all`, `/api/x/active`, `/api/x/count`, `/api/x/export` |
| `/graphql` | `/graphql?query={__schema{types{name}}}` — introspection first |
| `/api/x?page=1` | `?page=2`, `?size=100`, `?offset=0`, `?limit=50`, `?sort=name`, `?order=asc` |

### Secret Pattern Library

| Pattern | Regex | Context |
|---------|-------|---------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` | JS bundles, config files |
| Google API Key | `AIza[0-9A-Za-z\-_]{35}` | SPA config, env injection |
| Stripe Publishable | `pk_(live|test)_[0-9a-zA-Z]{24,}` | Payment integrations |
| JWT Token | `eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+` | localStorage, cookies |
| Generic API Key | `(apiKey\|api_key\|API_KEY)\s*[:=]\s*['"]([^'"]{8,})['"]` | Config objects |
| Firebase Config | `apiKey.*AIza` | Firebase SDK init |
| GitHub Token | `gh[pousr]_[A-Za-z0-9_]{36,}` | CI/CD configs |
| Slack Webhook | `hooks\.slack\.com/services/T[a-zA-Z0-9_]+` | Notification configs |
| Internal URL | `https?://(10\.\d{1,3}\.\d{1,3}\.\d{1,3}\|192\.168\.)` | API base URLs |

---

## Automation Script — Full Pipeline

```python
#!/usr/bin/env python3
"""JavaScript Deep Analysis — Iterative Endpoint Discovery Pipeline."""

import os, re, json, subprocess, urllib3
urllib3.disable_warnings()
import requests

class JSAnalyzer:
    def __init__(self, target_url, output_dir="./recon/js_analysis"):
        self.target = target_url
        self.base = output_dir
        self.iteration = 1
        self.known_js = set()
        self.all_endpoints = set()
        self.all_secrets = set()
        self.patterns = {
            "framework": None,
            "auth_model": None,
            "api_versions": set(),
            "url_structure": {},
            "naming": None,
        }
    
    def read(self):
        """Download all JS bundles from the target."""
        out = f"{self.base}/iteration_{self.iteration}/bundles"
        os.makedirs(out, exist_ok=True)
        
        # Get main page JS
        r = requests.get(self.target, verify=False, timeout=15)
        js_urls = set(re.findall(r'src="([^"]+\.js[^"]*)"', r.text))
        
        for js in js_urls:
            url = js if js.startswith('http') else f"{self.target.rstrip('/')}/{js.lstrip('/')}"
            filename = url.split('/')[-1].split('?')[0]
            if url not in self.known_js:
                try:
                    r2 = requests.get(url, verify=False, timeout=15)
                    if r2.status_code == 200:
                        with open(f"{out}/{filename}", "w") as f:
                            f.write(r2.text)
                        self.known_js.add(url)
                        print(f"  Downloaded: {filename}")
                except:
                    pass
        
        return len(js_urls)
    
    def discover(self):
        """Extract endpoints, secrets, and patterns from downloaded JS."""
        bundles = f"{self.base}/iteration_{self.iteration}/bundles"
        out = f"{self.base}/iteration_{self.iteration}/output"
        os.makedirs(out, exist_ok=True)
        
        new_endpoints = set()
        new_secrets = set()
        
        for jsfile in os.listdir(bundles):
            with open(f"{bundles}/{jsfile}", errors='ignore') as f:
                content = f.read()
            
            # Endpoints
            paths = set(re.findall(r'["\x27`](/[a-zA-Z][a-zA-Z0-9/_\-.]+)["\x27`]', content))
            paths.update(re.findall(r'["\x27`](/api/[a-zA-Z][a-zA-Z0-9/_\-.]+)["\x27`]', content))
            paths.update(re.findall(r'["\x27`](/v[0-9]+/[a-zA-Z][a-zA-Z0-9/_\-.]+)["\x27`]', content))
            new_endpoints.update(p for p in paths if len(p) > 3)
            
            # Secrets
            secrets = set(re.findall(r'AKIA[0-9A-Z]{16}', content))
            secrets.update(re.findall(r'(?:apiKey|api_key|API_KEY)\s*[:=]\s*["\x27]([^"\x27]{8,})["\x27]', content))
            secrets.update(re.findall(r'client_secret\s*[:=]\s*["\x27]([^"\x27]+)["\x27]', content))
            new_secrets.update(secrets)
        
        self.all_endpoints.update(new_endpoints)
        self.all_secrets.update(new_secrets)
        
        # Save to files
        with open(f"{out}/endpoints.txt", "w") as f:
            f.write('\n'.join(sorted(new_endpoints)))
        with open(f"{out}/secrets.txt", "w") as f:
            for s in new_secrets:
                f.write(f"{s}\n")
        
        print(f"  Endpoints found: {len(new_endpoints)}")
        print(f"  Secrets found: {len(new_secrets)}")
        return len(new_endpoints)
    
    def get_patterns(self):
        """Categorize discovered patterns."""
        out = f"{self.base}/iteration_{self.iteration}/output"
        
        frameworks = {"react": 0, "vue": 0, "angular": 0, "nextjs": 0, "jquery": 0}
        bundles = f"{self.base}/iteration_{self.iteration}/bundles"
        
        for jsfile in os.listdir(bundles):
            with open(f"{bundles}/{jsfile}", errors='ignore') as f:
                content = f.read()
            if 'createElement' in content or '_react' in content: frameworks['react'] += 1
            if 'defineComponent' in content or 'createApp' in content: frameworks['vue'] += 1
            if 'NgModule' in content or '@angular' in content: frameworks['angular'] += 1
            if 'getServerSideProps' in content or '__NEXT' in content: frameworks['nextjs'] += 1
            if '$(' in content or 'jQuery' in content: frameworks['jquery'] += 1
        
        self.patterns['framework'] = [k for k, v in frameworks.items() if v > 0]
        print(f"  Framework: {self.patterns['framework']}")
        
        # API versions
        versions = set()
        for ep in self.all_endpoints:
            v = re.search(r'/v(\d+)/', ep)
            if v: versions.add(int(v.group(1)))
        self.patterns['api_versions'] = sorted(versions)
        print(f"  API versions: {self.patterns['api_versions']}")
        
        return self.patterns
    
    def extend(self):
        """Use discovered patterns to generate new endpoint candidates."""
        out = f"{self.base}/iteration_{self.iteration}/output"
        extended = set()
        
        suffixes = ["list", "detail", "create", "update", "delete", "search",
                    "filter", "export", "report", "settings", "config", "status"]
        
        for ep in self.all_endpoints:
            # Version mutation
            for v in self.patterns['api_versions']:
                for nv in [v+1, v+2, v+3]:
                    extended.add(re.sub(r'/v\d+/', f'/v{nv}/', ep))
            
            # Suffix addition
            base = ep.rstrip('/')
            for suffix in suffixes:
                extended.add(f"{base}/{suffix}")
            
            # Parameter addition
            extended.add(f"{ep}?page=1&size=100")
            extended.add(f"{ep}?q=test")
        
        # Filter out endpoints we already know
        extended -= self.all_endpoints
        
        with open(f"{out}/extended_endpoints.txt", "w") as f:
            f.write('\n'.join(sorted(extended)))
        
        print(f"  Extended candidates: {len(extended)}")
        return len(extended)
    
    def repeat(self):
        """Test extended endpoints, discover new JS, decide if another iteration is needed."""
        out = f"{self.base}/iteration_{self.iteration}/output"
        ext_file = f"{out}/extended_endpoints.txt"
        
        if not os.path.exists(ext_file):
            return False
        
        new_js_found = set()
        with open(ext_file) as f:
            endpoints = [line.strip() for line in f if line.strip()]
        
        for ep in endpoints[:200]:  # Limit to avoid overwhelming
            try:
                url = ep if ep.startswith('http') else f"{self.target.rstrip('/')}{ep}"
                r = requests.get(url, verify=False, timeout=10)
                if r.status_code == 200:
                    js_in_page = set(re.findall(r'src="([^"]+\.js[^"]*)"', r.text))
                    for js in js_in_page:
                        full_js = js if js.startswith('http') else f"{self.target.rstrip('/')}/{js.lstrip('/')}"
                        if full_js not in self.known_js:
                            new_js_found.add(full_js)
            except:
                pass
        
        if new_js_found:
            print(f"  [REPEAT] Found {len(new_js_found)} new JS files. Continue to iteration {self.iteration + 1}.")
            self.iteration += 1
            return True
        else:
            print(f"  Analysis converged after {self.iteration} iterations.")
            print(f"  Total endpoints: {len(self.all_endpoints)}")
            print(f"  Total secrets: {len(self.all_secrets)}")
            return False
    
    def run(self, max_iterations=5):
        """Execute the full iterative pipeline."""
        print(f"=== JavaScript Deep Analysis — {self.target} ===\n")
        
        while self.iteration <= max_iterations:
            print(f"\n--- Iteration {self.iteration} ---")
            
            self.read()
            found = self.discover()
            self.get_patterns()
            self.extend()
            
            if not self.repeat():
                break
        
        return {
            "iterations": self.iteration,
            "total_endpoints": len(self.all_endpoints),
            "total_secrets": len(self.all_secrets),
            "framework": self.patterns['framework'],
            "api_versions": self.patterns['api_versions'],
        }

# Usage:
# analyzer = JSAnalyzer("https://op-web-uat-ap1.shijicloud.com")
# results = analyzer.run()
# print(json.dumps(results, indent=2))
```

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Iterative Reconnaissance** | The process of repeatedly discovering, extending, and re-discovering endpoints — each cycle yields new JS and new endpoints until the attack surface converges |
| **Source Map Restoration** | Using `.map` files referenced in minified JS (via `//# sourceMappingURL=`) to reconstruct the original unminified source, revealing commented-out code, route definitions, and full class names |
| **Webpack Chunk Analysis** | Webpack splits apps into chunks (e.g., `chunk-vendors.js`, `chunk-common.js`). Each chunk contains different portions of the application — analyzing ALL chunks is required for complete coverage |
| **Framework-Aware Pattern Matching** | Different frameworks (React, Vue, Angular, Next.js) have different route definition syntax, API call conventions, and state management patterns — using framework-specific regex improves extraction quality |
| **Pattern Extension** | Using discovered URL structure patterns (e.g., `/api/v1/users/{id}`) to generate candidate paths (e.g., `/api/v1/users/{id}/settings`) that may not appear in source code but follow the same schema |
| **Convergence** | The point at which no new JS files or endpoints are discovered — the attack surface is fully mapped |

## Tools & Systems

| Tool | Purpose |
|------|---------|
| **getJS** | Pulls ALL JavaScript files loaded by a URL — including dynamically loaded chunks |
| **js-beautify** | Deobfuscates and formats minified JS for human-readable analysis |
| **source-map-unpack** | Unpacks `.map` files to reconstruct original TypeScript/ES6 source |
| **LinkFinder / xnLinkFinder** | Extracts URL-like strings from JavaScript with context |
| **SecretFinder / trufflehog** | Scans JS for hardcoded credentials, API keys, and tokens |
| **httpx** | Probes discovered endpoints to identify live ones |
| **jsluice** | Structured extraction of URLs, secrets, and data from JavaScript |
| **waybackurls / gau** | Historical URL discovery from Wayback Machine archives |

## Output Format

```
=== JavaScript Analysis Report ===
Target: https://target.com
Iterations: 3 (converged)
Total Endpoints: 487
Total Secrets: 12

## Framework Detection
- React (3 bundles): main.chunk.js, vendors.chunk.js, app.chunk.js
- Axios HTTP client detected

## API Structure
- Base URL: https://api.target.com
- Versions: v1, v2 (both active)
- Auth: Bearer JWT token in Authorization header
- Parameter pattern: snake_case query parameters

## High-Value Discoveries
### Endpoints
- /api/v1/internal/users (200 — undocumented admin endpoint)
- /api/v2/admin/settings (200 — no auth required)
- /graphql (200 — introspection ENABLED)

### Secrets
- AWS Access Key: AKIAIOSFODNN7EXAMPLE
- Stripe publishable: pk_test_51ExampleKey123
- Internal IP: 10.93.48.151 — API backend hostname

## Section Headers
1. Endpoint Inventory (all 487 paths)
2. Secret Inventory (all 12 findings)
3. Pattern Analysis (framework, auth, versioning)
4. Extended Candidates (187 untested paths)
5. Iteration Log (3 rounds of discovery)
```
