/**
 * Cyber Security & Hacking News Aggregator - Sources Configuration
 * 
 * You can easily add, remove, disable, or adjust sources here.
 * The core application will automatically load and apply these changes.
 * 
 * Fields per source:
 * - id: Unique string identifier
 * - name: Display name of the source
 * - feed: URL to the RSS XML feed, Atom feed, or public API endpoint
 * - type: "rss" (standard XML feed parsed via proxy or direct) or "api_hn" (direct Algolia Hacker News JSON API)
 * - category: Default category tag (from available categories)
 * - enabled: boolean (true to fetch, false to ignore)
 */

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

const newsSources = [
  {
    id: "tldr-sec",
    name: "TL;DR Sec",
    feed: "https://tldrsec.com/feed.xml",
    type: "rss",
    category: "Cyber Security",
    enabled: true
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    // Hacker News Algolia API has native CORS enabled - directly fetchable from any static browser page!
    feed: "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=cybersecurity+OR+vulnerability+OR+exploit+OR+infosec+OR+zero-day",
    type: "api_hn",
    category: "Hacking",
    enabled: true
  },
  {
    id: "the-hacker-news",
    name: "The Hacker News",
    feed: "https://feeds.feedburner.com/TheHackersNews",
    type: "rss",
    category: "Cyber Security",
    enabled: true
  },
  {
    id: "cyber-security-news",
    name: "Cyber Security News",
    feed: "https://cybersecuritynews.com/feed/",
    type: "rss",
    category: "Cyber Security",
    enabled: true
  },
  {
    id: "google-security",
    name: "Google Security Articles",
    // Official Google News RSS feed for cybersecurity & hacking keywords
    feed: "https://news.google.com/rss/search?q=cybersecurity+OR+hacking+OR+%22bug+bounty%22+OR+vulnerability&hl=en-US&gl=US&ceid=US:en",
    type: "rss",
    category: "Hacking",
    enabled: true
  },
  {
    id: "bug-bounty-reports",
    name: "Bug Bounty",
    feed: "https://www.bugcrowd.com/feed/",
    type: "rss",
    category: "Bug Bounty",
    enabled: true
  },
  {
    id: "medium-security",
    name: "Medium",
    feed: "https://medium.com/feed/tag/cybersecurity",
    type: "rss",
    category: "Research",
    enabled: true
  },
  {
    id: "hackerone",
    name: "HackerOne",
    feed: "https://www.hackerone.com/blog.rss",
    type: "rss",
    category: "Bug Bounty",
    enabled: true
  }
];

/**
 * Global App Settings
 */
const appConfig = {
  // Auto-refresh interval in minutes
  refreshIntervalMinutes: 30,
  // Daily notification scheduled hour (24-hour format: 9 = 9:00 AM)
  dailyNotificationHour: 9,
  dailyNotificationMinute: 0,
  // Static GitHub Pages CORS-friendly gateways for RSS feeds
  rssProxies: [
    "https://api.rss2json.com/v1/api.json?rss_url=",
    "https://api.allorigins.win/raw?url="
  ]
};

// Export to window for browser script usage
if (typeof window !== "undefined") {
  window.newsSources = newsSources;
  window.newsCategories = newsCategories;
  window.appConfig = appConfig;
}
