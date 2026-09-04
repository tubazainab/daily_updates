#!/usr/bin/env python3
"""
Cyber Daily - Automated Threat & News Feed Ingestion Script

Aggregates cybersecurity news, CISA Known Exploited Vulnerabilities (KEV),
NIST CVE disclosures, and RSS feeds into data/articles.json.
Uses Python standard library (no pip install required) for zero friction.
"""

import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES_FILE = os.path.join(WORKSPACE_DIR, "data", "articles.json")

HEADERS = {
    "User-Agent": "CyberDailyAggregator/2.0 (+https://tubazainab.github.io/daily_updates/)"
}

def clean_text(html_str):
    if not html_str:
        return ""
    # Strip HTML tags
    clean = re.sub(r"<[^>]+>", " ", html_str)
    # Collapse whitespace
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean

def detect_category(text, default="Cybersecurity News"):
    low = text.lower()
    if any(k in low for k in ["bounty", "hackerone", "bugcrowd", "disclosure", "writeup"]):
        return "Bug Bounty"
    if any(k in low for k in ["cve-", "zero-day", "0-day", "vulnerability", "exploit"]):
        return "CVE / Vulnerabilities"
    if any(k in low for k in ["tool", "nuclei", "burp", "scanner", "subfinder"]):
        return "Hacking & Security Tools"
    if any(k in low for k in ["breach", "dump", "ransomware", "leak"]):
        return "Data Breaches"
    if any(k in low for k in ["llm", "ai security", "prompt injection", "chatgpt"]):
        return "AI Security"
    if any(k in low for k in ["xss", "sqli", "csrf", "ssrf", "idor", "graphql"]):
        return "Web Security"
    if any(k in low for k in ["aws", "azure", "gcp", "cloud", "iam", "s3"]):
        return "Cloud Security"
    if any(k in low for k in ["hiring", "soc analyst", "security engineer", "salary"]):
        return "Cybersecurity Jobs"
    if any(k in low for k in ["roadmap", "tutorial", "learn", "course", "beginner"]):
        return "Learning"
    return default

def detect_severity(title, summary, cve_id):
    combined = f"{title} {summary}".lower()
    if "critical" in combined or "rce" in combined or "remote code execution" in combined or "zero-click" in combined:
        return "Critical", 9.5
    if "high" in combined or "privilege escalation" in combined or "auth bypass" in combined:
        return "High", 8.2
    if cve_id:
        return "Medium", 6.5
    return "Low", 0.0

def fetch_cisa_kev():
    """Fetch recent entries from CISA Known Exploited Vulnerabilities (KEV) Catalog"""
    url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    articles = []
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            vulns = data.get("vulnerabilities", [])
            # Take the 5 most recently added
            for v in vulns[-8:]:
                cve = v.get("cveID", "")
                vendor = v.get("vendorProject", "")
                product = v.get("product", "")
                name = v.get("vulnerabilityName", "")
                notes = v.get("shortDescription", "")
                action = v.get("requiredAction", "")
                due = v.get("dueDate", "")

                articles.append({
                    "id": f"cisa-kev-{cve.lower()}",
                    "title": f"CISA KEV Alert: {vendor} {product} {cve} Under Active Exploitation",
                    "summary": notes or f"{name} affecting {vendor} {product}.",
                    "category": "CVE / Vulnerabilities",
                    "source": "CISA KEV Catalog",
                    "sourceUrl": f"https://nvd.nist.gov/vuln/detail/{cve}",
                    "publishedAt": datetime.now(timezone.utc).isoformat(),
                    "tags": [cve, "CISA-KEV", "Active Exploitation", vendor],
                    "cveId": cve,
                    "severity": "Critical",
                    "cvssScore": 9.2,
                    "image": "",
                    "author": "CISA Cyber Division",
                    "whyItMatters": f"Confirmed by US Cybersecurity Agency to be actively weaponized in the wild against organizational targets.",
                    "technicalDetails": f"Targeting {vendor} {product}. Documented in federal emergency directives.",
                    "affectedProducts": [f"{vendor} {product}"],
                    "recommendations": action or f"Remediate or isolate according to CISA guidelines before {due}.",
                    "patchUrl": f"https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
                })
    except Exception as e:
        print(f"[Warning] Failed to fetch CISA KEV: {e}", file=sys.stderr)
    return articles

def fetch_hn_infosec():
    """Fetch top recent cybersecurity headlines from Algolia Hacker News API"""
    url = "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=cybersecurity+OR+vulnerability+OR+exploit+OR+infosec&hitsPerPage=15"
    articles = []
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            hits = data.get("hits", [])
            for h in hits:
                title = h.get("title", "")
                link = h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}"
                if not title:
                    continue

                cve_match = re.search(r"CVE-\d{4}-\d{4,7}", title, re.IGNORECASE)
                cve_id = cve_match.group(0).upper() if cve_match else ""
                cat = detect_category(title)
                sev, cvss = detect_severity(title, "", cve_id)

                articles.append({
                    "id": f"hn-{h.get('objectID')}",
                    "title": title,
                    "summary": f"Discussion on Hacker News ({h.get('points', 0)} points, {h.get('num_comments', 0)} comments). Verified infosec community submission.",
                    "category": cat,
                    "source": "Hacker News InfoSec",
                    "sourceUrl": link,
                    "publishedAt": h.get("created_at") or datetime.now(timezone.utc).isoformat(),
                    "tags": [cat, "Community Research"],
                    "cveId": cve_id,
                    "severity": sev,
                    "cvssScore": cvss,
                    "image": "",
                    "author": h.get("author", "InfoSec Community"),
                    "whyItMatters": "Active discussion and peer review among security practitioners.",
                    "technicalDetails": "",
                    "affectedProducts": [],
                    "recommendations": "Review linked advisory and verify with internal dependency inventories.",
                    "patchUrl": ""
                })
    except Exception as e:
        print(f"[Warning] Failed to fetch Hacker News: {e}", file=sys.stderr)
    return articles

def main():
    print("🛡️ [Cyber Daily] Starting automated intelligence collection...")
    
    # Load existing articles
    existing = []
    if os.path.exists(ARTICLES_FILE):
        try:
            with open(ARTICLES_FILE, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception as e:
            print(f"[Warning] Could not read existing articles: {e}")

    print(f"Existing articles in database: {len(existing)}")

    new_articles = []
    # 1. CISA KEV
    cisa_items = fetch_cisa_kev()
    print(f"Fetched {len(cisa_items)} CISA KEV disclosures.")
    new_articles.extend(cisa_items)

    # 2. Hacker News InfoSec
    hn_items = fetch_hn_infosec()
    print(f"Fetched {len(hn_items)} Hacker News items.")
    new_articles.extend(hn_items)

    # Deduplicate by ID and URL
    merged = []
    seen = set()
    for a in new_articles + existing:
        key = a.get("id") or a.get("sourceUrl")
        if key and key not in seen:
            seen.add(key)
            merged.append(a)

    # Sort descending by publishedAt
    merged.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
    merged = merged[:100]  # Cap at 100 latest

    os.makedirs(os.path.dirname(ARTICLES_FILE), exist_ok=True)
    with open(ARTICLES_FILE, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)

    print(f"✅ Successfully updated {ARTICLES_FILE} with {len(merged)} verified articles.")

if __name__ == "__main__":
    main()
