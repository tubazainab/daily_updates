# 🛡️ Cyber Security & Hacking News Aggregator

A clean, fast, lightweight, and mobile-first news dashboard built exclusively with **HTML5**, **CSS3**, and **Vanilla JavaScript**. It aggregates the latest cybersecurity, ethical hacking, bug bounty, vulnerability disclosures, and infosec articles from multiple trusted sources into a single, unified, chronological feed.

Designed specifically to run seamlessly on **GitHub Pages** with zero build steps, zero external frameworks, and offline resilience.

---

## 📱 Mobile-First Experience

* **Single-Column Feed**: Optimized for mobile phones with large readable headlines and comfortable touch targets.
* **Instant Client-Side Search**: Debounced, zero-delay search filtering across titles, summaries, categories, and sources.
* **Dynamic Category Pills**: One-tap filtering for *Cyber Security*, *Hacking*, *Bug Bounty*, *Vulnerabilities*, *Cloud Security*, *AI Security*, and more.
* **Source Filter**: Isolate articles by specific publications or view all aggregated together.
* **Auto-Deduplication**: Automatically removes duplicate stories across feeds by normalizing URLs and query parameters.
* **Dark / Light Mode**: System-aware theme toggle with instant persistence in `localStorage`.
* **Daily 9:00 AM Notification**: Morning reminder when new security briefings are ready.
* **Offline Ready**: Automatically caches the latest stories so you can read previously loaded news even on intermittent mobile connections.

---

## 📂 Project Structure

```text
Daily Updates/
├── index.html            # Semantic HTML5 layout and mobile structure
├── style.css             # Vanilla CSS design system, dark/light themes & skeleton cards
├── script.js             # Core engine (fetch, deduplicate, filter, search, notify, cache)
├── manifest.json         # Web App Manifest for mobile "Add to Home Screen"
├── service-worker.js     # Service Worker for offline asset caching and push notifications
├── README.md             # Complete user and developer guide
├── assets/
│   └── icon.svg          # Cyber shield vector icon
└── data/
    └── sources.js        # Easy-to-edit configuration file for feeds and settings
```

---

## ⚙️ How to Add or Remove News Sources

All news sources are managed in [`data/sources.js`](data/sources.js). The main application code (`script.js`) dynamically reads this file and does **not** need to be touched.

### Adding a New Source

Open `data/sources.js` and add an object to the `newsSources` array:

```javascript
{
  id: "krebs-on-security",
  name: "Krebs on Security",
  feed: "https://krebsonsecurity.com/feed/",
  type: "rss",
  category: "Cyber Security",
  enabled: true
}
```

#### Fields Explained:
* `id`: A unique string identifier (e.g., `"krebs-on-security"`).
* `name`: The name displayed on news cards and in the source filter dropdown.
* `feed`: The URL of the public RSS/Atom XML feed or JSON API endpoint.
* `type`: `"rss"` for standard XML feeds or `"api_hn"` for native Algolia Hacker News endpoints.
* `category`: Default category tag assigned to articles from this source.
* `enabled`: Set to `true` to fetch; set to `false` to temporarily mute the source without deleting it.

### Removing a Source

Simply delete its entry from the `newsSources` array, or set `enabled: false`:

```javascript
{
  id: "tldr-sec",
  name: "TL;DR Sec",
  feed: "https://tldrsec.com/feed.xml",
  type: "rss",
  category: "Cyber Security",
  enabled: false // <--- Disabled
}
```

---

## 🏷️ How to Change Categories

To add, edit, or reorder categories, modify the `newsCategories` array in [`data/sources.js`](data/sources.js):

```javascript
const newsCategories = [
  "All",
  "Cyber Security",
  "Hacking",
  "Bug Bounty",
  "Vulnerabilities",
  "Web Security",
  "Cloud Security",
  "Malware",
  "Privacy",
  "AI Security",
  "Tools",
  "Research"
];
```

The app will automatically generate category buttons in the horizontal scrolling navigation bar. Articles are intelligently tagged based on keywords or their source's default category.

---

## ⏱️ How to Change the Refresh Interval

In `data/sources.js`, edit `appConfig.refreshIntervalMinutes`:

```javascript
const appConfig = {
  refreshIntervalMinutes: 15, // Change from default 30 to 15 minutes
  dailyNotificationHour: 9,   // 9:00 AM
  dailyNotificationMinute: 0
};
```

You can also manually click the **🔄 Refresh** button in the header at any time.

---

## 🌐 How RSS & API Sources Work + CORS Limitations

### What is CORS?
Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts web pages from making HTTP requests to a different domain unless that server explicitly responds with the header `Access-Control-Allow-Origin: *`.

Because this website runs as a **static site on GitHub Pages without a backend server**:
1. **Public CORS APIs (Native)**: Sources like Hacker News (via the Algolia API) natively support CORS. Browser JavaScript can fetch them directly without intermediaries.
2. **Standard External RSS Feeds**: Most publishers (e.g., The Hacker News, TL;DR Sec, Bugcrowd) do not attach CORS headers to their XML feeds. If a static web page attempts to `fetch('https://thehackernews.com/rss')` directly, the browser blocks it.
3. **The Solution**:
   * We route XML requests through CORS-friendly converters configured in `appConfig.rssProxies` (such as `https://api.rss2json.com/v1/api.json?rss_url=` or `https://api.allorigins.win/raw?url=`).
   * If you prefer self-hosting your own free gateway, you can deploy a lightweight Cloudflare Worker (5 lines of JavaScript) that proxies requests with CORS headers, and paste its URL in `appConfig.rssProxies`.
4. **Fault Tolerance**: Each source is handled independently via `Promise.allSettled()`. If any single source experiences a network timeout or CORS restriction, the rest of your feed will continue to load smoothly.

---

## 🔍 How to Configure the Google Search / News Source

Scraping raw Google search HTML pages violates Google's Terms of Service and is blocked by CAPTCHAs. 

Instead, we use the official **Google News RSS Feed**, which is designed for RSS readers:

```javascript
{
  id: "google-security",
  name: "Google Security Articles",
  feed: "https://news.google.com/rss/search?q=cybersecurity+OR+hacking+OR+%22bug+bounty%22+OR+vulnerability&hl=en-US&gl=US&ceid=US:en",
  type: "rss",
  category: "Hacking",
  enabled: true
}
```

To customize the search query, modify the `q=` parameter in the feed URL (e.g., change `cybersecurity` to `reverse+engineering` or `iot+security`).

---

## 🔔 Daily 9:00 AM Notifications & Browser Limitations

### How Notifications Work
1. When you first open the site, a prompt will ask:
   > *"Enable daily 9 AM news notifications?"*
   > Buttons: **[Enable]** | **[Not Now]**
2. When enabled, your preference is saved in `localStorage`, and the browser requests permission via the official `Notification` API.
3. While the web page is open (in an active or background tab), an automated timer checks the local time every 60 seconds. At 9:00 AM, it triggers:
   > *"🔔 Your daily cyber security news is ready."*
4. Additionally, when you open the site around or after 9 AM, a **Daily Update Banner** appears:
   > *"Today's update: 24 new articles"*
   New stories fetched since your last visit are marked with a subtle blue indicator.

### Important Static Hosting Limitation:
Because GitHub Pages is a purely static hosting provider with no backend server:
* **Client-side JavaScript cannot execute when your browser or phone screen is completely closed and the tab is unloaded.**
* Browsers deliberately prevent static web pages from running background wake-ups without a registered Web Push service.
* If the page is open in a background tab or reopened in the morning, the notification and 9 AM update logic will fire reliably.

---

## 🚀 Converting to a Full PWA (Progressive Web App)

The repository already includes the foundations for full PWA support:
* [`manifest.json`](manifest.json): Allows you to tap **"Add to Home Screen"** on Chrome (Android) or Safari (iOS). The dashboard will open full-screen like a native mobile app without URL bars.
* [`service-worker.js`](service-worker.js): Caches HTML, CSS, JavaScript, and fonts locally for instant offline loading.
* **To upgrade to background Web Push notifications** (when the phone is completely asleep):
  1. Set up a free Push Service (e.g. Firebase Cloud Messaging or web-push on a free serverless function).
  2. Subscribe the Service Worker with `registration.pushManager.subscribe()`.
  3. Send a scheduled daily trigger at 9:00 AM UTC/local to dispatch a push message to your subscription.

---

## 🚢 How to Deploy to GitHub Pages (Step-by-Step)

Deploying takes less than 2 minutes:

1. **Create a GitHub Repository**:
   - Go to [github.com/new](https://github.com/new).
   - Name your repository (e.g. `cyber-news-aggregator`).
   - Choose **Public**.
2. **Upload Project Files**:
   - Upload all files (`index.html`, `style.css`, `script.js`, `manifest.json`, `service-worker.js`, `assets/`, `data/`) directly to the `main` branch.
3. **Enable GitHub Pages**:
   - In your repository, click **Settings** > **Pages** (in the left sidebar).
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/ (root)`.
   - Click **Save**.
4. **Open Your Live Dashboard**:
   - Within 30 seconds, GitHub will generate your live URL:
     `https://<your-username>.github.io/<repo-name>/`
   - Open this URL on your mobile phone and bookmark or tap **"Add to Home Screen"**!
