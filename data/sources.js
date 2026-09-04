/**
 * Cyber Daily - Cybersecurity & Bug Bounty Aggregator - Sources & Config
 * 
 * Configured with reliable infosec sources, categories, and API endpoints.
 */

const newsCategories = [
  "All",
  "Cybersecurity News",
  "CVE / Vulnerabilities",
  "Bug Bounty",
  "Hacking & Security Tools",
  "Data Breaches",
  "AI Security",
  "Web Security",
  "Cloud Security",
  "Cybersecurity Jobs",
  "Learning"
];

const newsSources = [
  {
    id: "cyber-daily-curated",
    name: "Cyber Daily Hub",
    feed: "./data/articles.json",
    type: "local_json",
    category: "Cybersecurity News",
    enabled: true
  },
  {
    id: "hacker-news",
    name: "Hacker News InfoSec",
    // Algolia API has native open CORS headers - works client-side on GitHub Pages
    feed: "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=cybersecurity+OR+vulnerability+OR+exploit+OR+infosec+OR+zero-day",
    type: "api_hn",
    category: "Cybersecurity News",
    enabled: true
  },
  {
    id: "tldr-sec",
    name: "TL;DR Sec",
    feed: "https://tldrsec.com/feed.xml",
    type: "rss",
    category: "Cybersecurity News",
    enabled: true
  },
  {
    id: "the-hacker-news",
    name: "The Hacker News",
    feed: "https://feeds.feedburner.com/TheHackersNews",
    type: "rss",
    category: "Cybersecurity News",
    enabled: true
  },
  {
    id: "hackerone",
    name: "HackerOne Blog",
    feed: "https://www.hackerone.com/blog.rss",
    type: "rss",
    category: "Bug Bounty",
    enabled: true
  },
  {
    id: "bugcrowd",
    name: "Bugcrowd Research",
    feed: "https://www.bugcrowd.com/feed/",
    type: "rss",
    category: "Bug Bounty",
    enabled: true
  },
  {
    id: "projectdiscovery",
    name: "ProjectDiscovery",
    feed: "https://blog.projectdiscovery.io/rss/",
    type: "rss",
    category: "Hacking & Security Tools",
    enabled: true
  },
  {
    id: "cisa-alerts",
    name: "CISA Cybersecurity Advisories",
    feed: "https://www.cisa.gov/cybersecurity-advisories.xml",
    type: "rss",
    category: "CVE / Vulnerabilities",
    enabled: true
  }
];

const appConfig = {
  // Auto-refresh interval in minutes
  refreshIntervalMinutes: 30,
  // Bundled fallback JSON dataset to ensure 0-empty-feed guarantee
  fallbackDataset: "./data/articles.json",
  // Daily notification scheduled hour (24-hour format: 9 = 9:00 AM)
  dailyNotificationHour: 9,
  dailyNotificationMinute: 0,
  // Fallback CORS gateways for RSS feeds
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
