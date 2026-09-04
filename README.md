# 🛡️ CYBER DAILY - Cybersecurity & Bug Bounty Hub

> **"Your Daily Cybersecurity & Bug Bounty Updates"**  
> Live URL: [https://tubazainab.github.io/daily_updates/](https://tubazainab.github.io/daily_updates/)

A modern, fast, lightweight, and automation-ready cybersecurity intelligence platform built for **ethical hackers**, **bug bounty hunters**, **SOC analysts**, and **cybersecurity students**. 

Runs 100% client-side on **GitHub Pages** with zero build steps, zero external npm frameworks, and offline resilience.

---

## 🚀 Key Features

* **Guaranteed Content (Never 0 Articles)**: Bundled with verified cybersecurity disclosures (`data/articles.json`) so the dashboard is populated immediately even on first visits, offline, or when third-party proxies are throttled.
* **Infosec Dashboard & Real-Time Stats**: Dynamic counters computing **Total Reports**, **Critical CVEs**, **Bug Bounty Scopes**, and **Security Tools** on the fly.
* **Dedicated CVE Tracker**: Clear severity badges (`Critical`, `High`, `Medium`, `Low`), **CVSS v3.1 score meters** (e.g. `9.8 / 10.0`), monospaced CVE tags (`CVE-2024-XXXX`), affected software packages, and direct links to NVD/MSRC/vendor patch advisories.
* **Dedicated Bug Bounty Hub**: Scope expansions, high-payout programs, recon methodology tips, and strict **Responsible Disclosure & Ethics** safe-harbor standards.
* **Deep-Dive Article Reader Modal**: In-depth intelligence drawer with URL hash routing (`#/article/:id`) for sharing and back-button history navigation. Includes:
  * Executive Summary
  * **"Why It Matters to Defenders & Hunters"** callout
  * Technical Deep-Dive & Root-Cause Analysis
  * Affected Software & Configurations
  * Security Recommendations & Fix Guidance
  * Official Source & Patch Links
  * Related Disclosures
* **Instant Multi-Field Search**: Client-side, debounced searching across Title, Summary, Tags, Category, and CVE IDs with quick-clear and intelligent empty states.
* **10 Granular InfoSec Categories**:
  * Cybersecurity News
  * CVE / Vulnerabilities
  * Bug Bounty
  * Hacking & Security Tools
  * Data Breaches
  * AI Security
  * Web Security
  * Cloud Security
  * Cybersecurity Jobs
  * Learning & Roadmaps
* **Trust & Transparency**: Built-in modal dialogues for **About Cyber Daily**, **Verified Sources**, **Contact & Submissions**, **Privacy Policy**, **Terms of Use**, and **Anti-Cybercrime Policy**.
* **Monetization-Ready**: Non-intrusive, clean placement for sponsored infosec tools, certification affiliate links, and commented Google AdSense placeholder slots.
* **Automated Data Pipelines**: Comes pre-configured with a Python ingestion script (`scripts/fetch_feeds.py`), GitHub Actions cron (`.github/workflows/update_feeds.yml`), and an n8n workflow (`n8n/cyber_daily_workflow.json`).

---

## 📂 Project Structure

```text
Daily Updates/
├── index.html                   # Modern cybersecurity dashboard layout & modals
├── style.css                    # Slate/Obsidian infosec theme, CVSS meters & responsive grid
├── script.js                    # Core engine (guaranteed loader, search, stats, modal reader)
├── manifest.json                # PWA manifest for Add to Home Screen
├── service-worker.js            # Offline asset caching & notifications
├── robots.txt                   # Search crawler directives
├── sitemap.xml                  # SEO search engine sitemap
├── README.md                    # Platform documentation & deployment guide
├── assets/
│   └── icon.svg                 # Vector shield logo
├── data/
│   ├── articles.json            # Structured dataset of cybersecurity articles & CVEs
│   └── sources.js               # Feed sources, categories, and proxy config
├── scripts/
│   └── fetch_feeds.py           # Automated Python script to pull CISA KEV, HN, and CVEs
├── n8n/
│   └── cyber_daily_workflow.json# Importable n8n workflow template
└── .github/
    └── workflows/
        └── update_feeds.yml     # Automated GitHub Actions scheduled updater (every 6 hours)
```

---

## 📝 Article Data Schema (`data/articles.json`)

All articles adhere to this standard, automation-ready JSON schema:

```json
{
  "id": "cve-2024-38077-rdl-rce",
  "title": "Critical Windows Remote Desktop Licensing Service RCE Vulnerability",
  "summary": "A critical remote code execution vulnerability (CVE-2024-38077) in Windows Remote Desktop Licensing...",
  "category": "CVE / Vulnerabilities",
  "source": "MSRC & NIST NVD",
  "sourceUrl": "https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-38077",
  "publishedAt": "2024-07-09T18:00:00Z",
  "tags": ["CVE-2024-38077", "RCE", "Windows", "Critical", "Zero-Click"],
  "cveId": "CVE-2024-38077",
  "severity": "Critical",
  "cvssScore": 9.8,
  "image": "",
  "author": "Threat Intelligence Unit",
  "whyItMatters": "Unauthenticated zero-click RCE allowing complete domain compromise.",
  "technicalDetails": "Heap overflow in RPC packet decoding.",
  "affectedProducts": ["Windows Server 2008-2022"],
  "recommendations": "Install Microsoft July 2024 KB5040437 patch or disable RDL service.",
  "patchUrl": "https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-38077"
}
```

---

## ✍️ How to Add New Articles Manually

1. Open [`data/articles.json`](data/articles.json) in your code editor.
2. Insert your new article object at the top of the array:
   ```json
   [
     {
       "id": "my-new-tool-release",
       "title": "New Open-Source Recon Tool Released",
       "summary": "Fast reconnaissance tool designed for bug bounty hunters.",
       "category": "Hacking & Security Tools",
       "source": "GitHub Community",
       "sourceUrl": "https://github.com/example/tool",
       "publishedAt": "2026-09-04T12:00:00Z",
       "tags": ["Tools", "Recon", "Bug Bounty"],
       "cveId": "",
       "severity": "Low",
       "cvssScore": 0.0,
       "author": "Security Team",
       "whyItMatters": "Speeds up domain asset enumeration by 5x.",
       "technicalDetails": "Written in Go with async DNS resolution.",
       "affectedProducts": [],
       "recommendations": "Run in your automated recon pipeline.",
       "patchUrl": ""
     },
     ...
   ]
   ```
3. Save the file. When you push to GitHub, the new article appears instantly!

---

## 🤖 Automated Updates Pipeline (3 Options)

### Option 1: GitHub Actions (Recommended • 100% Free & Automatic)
A GitHub Actions workflow is included at [`.github/workflows/update_feeds.yml`](.github/workflows/update_feeds.yml).
* **How it works**: Runs every 6 hours via GitHub's free servers. It executes `scripts/fetch_feeds.py` to pull the latest **CISA KEV** exploits and Hacker News infosec reports, updates `data/articles.json`, and commits back to your repository.
* **Setup**: No setup needed! Once pushed to GitHub, navigate to your repository's **Actions** tab to enable workflows.

### Option 2: Run Python Script Locally
Run the Python ingestion script on your machine anytime:
```bash
python scripts/fetch_feeds.py
```
This updates `data/articles.json` with fresh CVEs and headlines.

### Option 3: n8n Workflow
If you use [n8n](https://n8n.io/):
1. In n8n, click **Add Workflow** -> **Import from File**.
2. Select [`n8n/cyber_daily_workflow.json`](n8n/cyber_daily_workflow.json).
3. Connect your GitHub credential so n8n can automatically commit updated articles to your repository on schedule.

---

## ⚖️ Browser CORS & Technical Limitations

* **Client-Side CORS**: Browsers block direct XML/RSS fetching from domains without CORS headers (like `krebsonsecurity.com` or `thehackersnews.com`).
* **Solution Implemented**: 
  1. The website immediately displays `data/articles.json` (guaranteeing it is never empty).
  2. The Algolia Hacker News API is queried live (it supports native CORS).
  3. Public CORS proxies (`rss2json`, `allorigins`) are used as graceful background fallbacks.
  4. The automated **GitHub Actions** script (`scripts/fetch_feeds.py`) runs in a Python environment where CORS does not apply, providing a 100% reliable feed pipeline.

---

## 🚢 How to Deploy to GitHub Pages

1. Open your terminal in this repository directory.
2. Check your git status and stage all files:
   ```bash
   git status
   git add .
   ```
3. Commit the changes:
   ```bash
   git commit -m "feat: upgrade Cyber Daily with CVE tracker, bug bounty hub, reader modal, and automated feed pipeline"
   ```
4. Push to GitHub:
   ```bash
   git push origin main
   ```
   *(Or `git push origin master` if your default branch is named `master`)*
5. Open your repository on GitHub:
   * Go to **Settings** -> **Pages**.
   * Under **Build and deployment**, ensure **Source** is set to `Deploy from a branch`.
   * Ensure **Branch** is `main` (or `master`) and folder is `/(root)`.
   * Click **Save**.
6. Within 1-2 minutes, your upgraded platform will be live at:
   **[https://tubazainab.github.io/daily_updates/](https://tubazainab.github.io/daily_updates/)**
