/**
 * Cyber Daily - Core Engine
 * 
 * Lightweight, Mobile-First, Vanilla JavaScript.
 * Hosted on GitHub Pages with zero external dependencies.
 */

'use strict';

(function () {
  // Application State
  const state = {
    sources: [],
    categories: [],
    articles: [],
    filteredArticles: [],
    activeCategory: 'All',
    activeView: 'all',
    activeSource: 'all',
    searchQuery: '',
    lastUpdated: null,
    seenArticleIds: new Set(),
    isRefreshing: false,
    theme: 'dark',
    notificationEnabled: false,
    dailyUpdateCount: 0,
    currentModalArticleId: null
  };

  // Local Storage Keys
  const STORAGE_KEYS = {
    THEME: 'cyber_daily_theme',
    NOTIFICATIONS: 'cyber_daily_notifications_enabled',
    NOTIFY_PROMPT_SHOWN: 'cyber_daily_notify_prompt_shown',
    SELECTED_CATEGORY: 'cyber_daily_selected_category',
    SELECTED_VIEW: 'cyber_daily_selected_view',
    SELECTED_SOURCE: 'cyber_daily_selected_source',
    CACHED_ARTICLES: 'cyber_daily_cached_articles',
    SEEN_IDS: 'cyber_daily_seen_ids',
    LAST_UPDATED: 'cyber_daily_last_updated',
    LAST_9AM_NOTIFIED: 'cyber_daily_last_9am_notified'
  };

  // Content for Trust & Transparency Modals
  const TRUST_PAGES = {
    about: {
      title: 'About Cyber Daily',
      html: `
        <p><strong>Cyber Daily</strong> is an independent, fast, and community-driven cybersecurity intelligence aggregator and bug bounty hub. Designed for security researchers, ethical hackers, SOC analysts, and university students, our mission is to deliver actionable, noise-free infosec intelligence in a single lightweight dashboard.</p>
        <br>
        <h4>Who We Serve</h4>
        <ul style="margin-left: 20px; margin-top: 8px; margin-bottom: 16px;">
          <li><strong>Bug Bounty Hunters:</strong> Rapid alerts on expanding program scopes, attack surface discoveries, and disclosure reports.</li>
          <li><strong>Security Engineers &amp; Blue Teams:</strong> Zero-day alerts, critical CVE advisories, and immediate vendor patch links.</li>
          <li><strong>Students &amp; Beginners:</strong> Free curated roadmaps, CTF practice portals, and ethical hacking methodology breakdowns.</li>
        </ul>
        <p>This project is 100% open, lightweight, and engineered to host on GitHub Pages without proprietary tracking or intrusive advertisements.</p>
      `
    },
    sources: {
      title: 'Verified Sources & Data Architecture',
      html: `
        <p>We believe in absolute transparency regarding information provenance. Cyber Daily aggregates headlines and summaries from vetted public security organizations, vendor security response centers, and established researcher communities:</p>
        <ul style="margin-left: 20px; margin-top: 10px; margin-bottom: 16px;">
          <li><strong>MSRC &amp; NIST NVD:</strong> Microsoft Security Response Center and the National Vulnerability Database for official CVE metrics.</li>
          <li><strong>CISA Cybersecurity Advisories:</strong> Federal binding operational directives and Known Exploited Vulnerabilities (KEV).</li>
          <li><strong>HackerOne &amp; Bugcrowd:</strong> Official program launches, scope adjustments, and annual researcher reports.</li>
          <li><strong>ProjectDiscovery &amp; Open Source Security:</strong> New vulnerability scanners, Nuclei templates, and recon utilities.</li>
          <li><strong>Hacker News &amp; Infosec Research:</strong> Community peer-reviewed technical deep-dives and root-cause analyses.</li>
        </ul>
        <p><em>Notice:</em> We only index short summaries, metadata, and attribution links pointing back to original publishers.</p>
      `
    },
    contact: {
      title: 'Contact & Security Submissions',
      html: `
        <p>Have an interesting bug bounty writeup, open-source security tool, or critical zero-day disclosure you would like featured on Cyber Daily?</p>
        <br>
        <p><strong>GitHub Repository:</strong> <a href="https://github.com/tubazainab/daily_updates" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan);">github.com/tubazainab/daily_updates</a></p>
        <p><strong>Submit a Tool or Advisory:</strong> Open an Issue or Pull Request on GitHub to contribute directly to our feed configuration.</p>
        <br>
        <p>For urgent responsible disclosure notices, please open a GitHub Issue tagged <code>[Advisory]</code>.</p>
      `
    },
    privacy: {
      title: 'Privacy Policy',
      html: `
        <p><strong>Your privacy is paramount.</strong> Cyber Daily is built with a privacy-by-design architecture:</p>
        <ul style="margin-left: 20px; margin-top: 10px; margin-bottom: 16px;">
          <li><strong>Zero Personal Data Collection:</strong> We do not ask for your name, email, credentials, or personal identifiers to read news.</li>
          <li><strong>No Invasive Trackers:</strong> No third-party behavioral profiling pixels or biometric tracking.</li>
          <li><strong>Local Storage:</strong> Your theme preference (dark/light), read article history, and filter selections are kept strictly inside your own browser's <code>localStorage</code>.</li>
          <li><strong>Push Notifications:</strong> Notification permissions are handled client-side via standard browser APIs and never tied to a remote tracking ID.</li>
        </ul>
      `
    },
    terms: {
      title: 'Terms of Use',
      html: `
        <p>By accessing and utilizing Cyber Daily, you acknowledge and agree to the following terms:</p>
        <ul style="margin-left: 20px; margin-top: 10px; margin-bottom: 16px;">
          <li>All content, advisories, CVE scores, and links are provided for informational and defensive education purposes.</li>
          <li>You agree not to use information obtained from this platform to engage in unauthorized port scanning, vulnerability exploitation, denial-of-service, or network attacks against any third party.</li>
          <li>We strive for maximum accuracy in vulnerability metrics and CVSS scores, but organizations must verify details against primary vendor advisories before taking production downtime.</li>
        </ul>
      `
    },
    disclaimer: {
      title: 'Responsible Disclosure & Anti-Cybercrime Stance',
      html: `
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--accent-red); padding: 12px; margin-bottom: 16px; border-radius: 4px;">
          <strong>STRICT ETHICAL REQUIREMENT:</strong>
          <p style="margin-top: 6px;">Cyber Daily unconditionally condemns unauthorized computer intrusion, malware distribution, data theft, and black-hat activities.</p>
        </div>
        <p>All bug bounty guides, recon methodologies, and vulnerability technical analyses published on this hub are intended solely to assist:</p>
        <ul style="margin-left: 20px; margin-top: 8px; margin-bottom: 16px;">
          <li>Defenders in patching and securing organizational infrastructure.</li>
          <li>Authorized ethical researchers operating under explicit, documented Bug Bounty Safe Harbor agreements.</li>
          <li>Students studying offensive and defensive security in isolated lab environments.</li>
        </ul>
        <p>Never test, probe, or interact with any target infrastructure without explicit, written authorization from the system owner.</p>
      `
    }
  };

  // DOM Elements Cache
  const elements = {
    newsContainer: document.getElementById('news-container'),
    categoryPills: document.getElementById('category-pills'),
    sourceSelect: document.getElementById('source-select'),
    searchInput: document.getElementById('search-input'),
    searchClear: document.getElementById('search-clear'),
    btnRefresh: document.getElementById('btn-refresh'),
    btnNotification: document.getElementById('btn-notification'),
    btnTheme: document.getElementById('btn-theme'),
    themeMoon: document.getElementById('theme-moon'),
    themeSun: document.getElementById('theme-sun'),
    bannerOffline: document.getElementById('banner-offline'),
    bannerDaily: document.getElementById('banner-daily'),
    bannerDailyText: document.getElementById('banner-daily-text'),
    notificationPrompt: document.getElementById('notification-prompt'),
    btnNotifyEnable: document.getElementById('btn-notify-enable'),
    btnNotifyDismiss: document.getElementById('btn-notify-dismiss'),
    articleCount: document.getElementById('article-count'),
    lastUpdatedText: document.getElementById('last-updated'),
    toastContainer: document.getElementById('toast-container'),
    cveBanner: document.getElementById('cve-view-banner'),
    bugbountyBanner: document.getElementById('bugbounty-view-banner'),
    // Stats
    statTotalArticles: document.getElementById('stat-total-articles'),
    statCriticalCve: document.getElementById('stat-critical-cve'),
    statBountyCount: document.getElementById('stat-bounty-count'),
    statToolsCount: document.getElementById('stat-tools-count'),
    // Article Modal
    articleModal: document.getElementById('article-modal'),
    modalArticleTitle: document.getElementById('modal-article-title'),
    modalArticleBadges: document.getElementById('modal-article-badges'),
    modalArticleClose: document.getElementById('modal-article-close'),
    modalArticleSource: document.getElementById('modal-article-source'),
    modalArticleDate: document.getElementById('modal-article-date'),
    modalArticleAuthor: document.getElementById('modal-article-author'),
    modalCveBox: document.getElementById('modal-cve-box'),
    modalCveId: document.getElementById('modal-cve-id'),
    modalCveCvss: document.getElementById('modal-cve-cvss'),
    modalCveSeverity: document.getElementById('modal-cve-severity'),
    modalCveAffectedList: document.getElementById('modal-cve-affected-list'),
    modalArticleSummary: document.getElementById('modal-article-summary'),
    modalWhySection: document.getElementById('modal-why-section'),
    modalArticleWhy: document.getElementById('modal-article-why'),
    modalTechSection: document.getElementById('modal-tech-section'),
    modalArticleTechnical: document.getElementById('modal-article-technical'),
    modalRecSection: document.getElementById('modal-rec-section'),
    modalArticleRecommendations: document.getElementById('modal-article-recommendations'),
    modalArticleTags: document.getElementById('modal-article-tags'),
    modalSourceLink: document.getElementById('modal-source-link'),
    modalPatchLink: document.getElementById('modal-patch-link'),
    modalShareBtn: document.getElementById('modal-share-btn'),
    modalRelatedContainer: document.getElementById('modal-related-container'),
    // Trust Info Modal
    infoModal: document.getElementById('info-modal'),
    infoModalTitle: document.getElementById('info-modal-title'),
    infoModalBody: document.getElementById('info-modal-body'),
    infoModalClose: document.getElementById('info-modal-close')
  };

  /**
   * 1. Initialize Application
   */
  async function init() {
    loadTheme();
    loadSources();
    setupUIControls();
    setupHashRouting();

    // STEP 1: Load pre-bundled dataset or local cache immediately to guarantee NO 0-articles screen!
    await loadInitialDataset();

    checkOfflineStatus();
    checkDailyNotificationPrompt();
    scheduleDaily9AMCheck();

    // STEP 2: Concurrently fetch live online feeds (Hacker News Algolia, RSS fallbacks)
    refreshNews(false, true);

    // Auto-refresh timer (default 30 minutes)
    const refreshMs = (window.appConfig?.refreshIntervalMinutes || 30) * 60 * 1000;
    setInterval(() => {
      refreshNews(true, false);
    }, refreshMs);

    // Register Service Worker for offline PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch((err) => {
          console.warn('Service Worker info:', err.message);
        });
      });
    }

    // Set current year in footer
    const yr = document.getElementById('current-year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /**
   * 2. Guaranteed Dataset Loader (Guarantees Site Never Looks Empty)
   */
  async function loadInitialDataset() {
    // 1. Try local cache first for instant display
    const hasCache = loadCache();

    // 2. Fetch bundled high-value JSON data
    try {
      const response = await fetch('./data/articles.json', { cache: 'no-cache' });
      if (response.ok) {
        const bundled = await response.json();
        if (Array.isArray(bundled) && bundled.length > 0) {
          const normalized = bundled.map((item) => normalizeArticle(item));
          // Merge with any cached items
          const merged = removeDuplicates([...normalized, ...state.articles]);
          state.articles = sortArticles(merged);
          state.lastUpdated = state.lastUpdated || new Date();
          saveCache();
        }
      }
    } catch (e) {
      console.warn('Could not load local bundled articles.json:', e);
    }

    // Render immediately
    filterAndRender();
    updateDashboardStats();
  }

  /**
   * 3. Load Sources & Category Filters
   */
  function loadSources() {
    state.sources = Array.isArray(window.newsSources) ? window.newsSources : [];
    state.categories = Array.isArray(window.newsCategories) ? window.newsCategories : ['All'];

    // Render Category Pills
    renderCategoryPills();

    // Render Source Select Options
    renderSourceOptions();
  }

  function renderCategoryPills() {
    if (!elements.categoryPills) return;
    elements.categoryPills.innerHTML = '';

    state.categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = `category-pill ${cat === state.activeCategory ? 'active' : ''}`;
      btn.textContent = cat;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', cat === state.activeCategory ? 'true' : 'false');
      btn.addEventListener('click', () => {
        setCategory(cat);
      });
      elements.categoryPills.appendChild(btn);
    });
  }

  function renderSourceOptions() {
    if (!elements.sourceSelect) return;
    elements.sourceSelect.innerHTML = '<option value="all">All Intelligence Feeds</option>';

    state.sources.forEach((source) => {
      const option = document.createElement('option');
      option.value = source.id;
      option.textContent = source.name;
      elements.sourceSelect.appendChild(option);
    });

    const savedSource = localStorage.getItem(STORAGE_KEYS.SELECTED_SOURCE);
    if (savedSource && (savedSource === 'all' || state.sources.some(s => s.id === savedSource))) {
      state.activeSource = savedSource;
      elements.sourceSelect.value = savedSource;
    }
  }

  /**
   * 4. Fetch Live News Concurrently (Error Resilient)
   */
  async function fetchLiveNews() {
    const enabledSources = state.sources.filter((s) => s.enabled && s.type !== 'local_json');
    if (enabledSources.length === 0) return [];

    const fetchPromises = enabledSources.map(async (source) => {
      try {
        if (source.type === 'api_hn') {
          return await fetchHackerNewsSource(source);
        } else if (source.type === 'rss') {
          return await fetchRSSSource(source);
        }
        return [];
      } catch (err) {
        console.warn(`[Cyber Daily] Source "${source.name}" warning:`, err.message);
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    const collectedArticles = [];

    results.forEach((res) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        collectedArticles.push(...res.value);
      }
    });

    return collectedArticles;
  }

  async function fetchHackerNewsSource(source) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(source.feed, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const hits = Array.isArray(data.hits) ? data.hits : [];

    return hits
      .filter((hit) => hit.title && (hit.url || hit.story_text || hit.objectID))
      .map((hit) => {
        const articleUrl = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
        const description = hit.story_text ? cleanPlainText(hit.story_text) : `Hacker News infosec discussion (${hit.points || 0} points, ${hit.num_comments || 0} comments)`;

        return normalizeArticle({
          id: `hn-${hit.objectID}`,
          source: source.name,
          sourceUrl: articleUrl,
          title: hit.title,
          summary: description,
          publishedAt: hit.created_at || new Date().toISOString(),
          category: detectCategory(hit.title, source.category),
          tags: ["Hacker News", "InfoSec", "Discussion"],
          severity: hit.title.toLowerCase().includes('zero-day') || hit.title.toLowerCase().includes('critical') ? 'High' : 'Low'
        });
      });
  }

  async function fetchRSSSource(source) {
    const proxies = window.appConfig?.rssProxies || [
      'https://api.rss2json.com/v1/api.json?rss_url='
    ];

    for (const proxyUrl of proxies) {
      try {
        const targetUrl = proxyUrl ? `${proxyUrl}${encodeURIComponent(source.feed)}` : source.feed;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const response = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json') || proxyUrl.includes('rss2json')) {
          const data = await response.json();
          if (data.status === 'ok' && Array.isArray(data.items)) {
            return data.items.map((item) => {
              return normalizeArticle({
                id: normalizeUrlForDeduplication(item.link || item.guid),
                source: source.name,
                sourceUrl: item.link || item.guid,
                title: item.title,
                summary: cleanPlainText(item.description),
                publishedAt: item.pubDate || new Date().toISOString(),
                category: detectCategory(item.title + ' ' + (item.categories?.join(' ') || ''), source.category),
                tags: item.categories || ["Security Update"]
              });
            });
          }
        }
      } catch (err) {
        // Try next proxy
      }
    }

    return [];
  }

  /**
   * 5. Normalize Article Structure
   */
  function normalizeArticle(item) {
    const safeUrl = sanitizeUrl(item.sourceUrl || item.url);
    const cleanTitle = sanitizeText(item.title) || 'Untitled Security Intelligence';
    const cleanSummary = sanitizeText(item.summary || item.description) || 'Summary not available.';

    let parsedDate = new Date(item.publishedAt);
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }

    const normalizedId = item.id || normalizeUrlForDeduplication(safeUrl) || `art-${Math.random().toString(36).substring(2, 9)}`;

    // Infer CVE if not explicitly set
    let cveId = item.cveId || '';
    if (!cveId) {
      const match = cleanTitle.match(/CVE-\d{4}-\d{4,7}/i) || cleanSummary.match(/CVE-\d{4}-\d{4,7}/i);
      if (match) cveId = match[0].toUpperCase();
    }

    let severity = item.severity || 'Medium';
    if (!['Critical', 'High', 'Medium', 'Low'].includes(severity)) {
      if (item.cvssScore >= 9.0) severity = 'Critical';
      else if (item.cvssScore >= 7.0) severity = 'High';
      else if (item.cvssScore >= 4.0) severity = 'Medium';
      else severity = 'Low';
    }

    return {
      id: normalizedId,
      title: cleanTitle,
      summary: cleanSummary,
      category: item.category || 'Cybersecurity News',
      source: item.source || item.sourceName || 'InfoSec Source',
      sourceUrl: safeUrl,
      publishedAt: parsedDate.toISOString(),
      timestamp: parsedDate.getTime(),
      tags: Array.isArray(item.tags) ? item.tags : [],
      cveId: cveId,
      severity: severity,
      cvssScore: typeof item.cvssScore === 'number' ? item.cvssScore : (cveId ? 7.5 : 0),
      image: sanitizeUrl(item.image || item.thumbnail),
      author: sanitizeText(item.author) || 'Cyber Daily Intel',
      whyItMatters: sanitizeText(item.whyItMatters) || '',
      technicalDetails: sanitizeText(item.technicalDetails) || '',
      affectedProducts: Array.isArray(item.affectedProducts) ? item.affectedProducts : [],
      recommendations: sanitizeText(item.recommendations) || '',
      patchUrl: sanitizeUrl(item.patchUrl)
    };
  }

  function removeDuplicates(articles) {
    const seen = new Set();
    const unique = [];

    for (const article of articles) {
      const key = article.id || article.sourceUrl;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(article);
      }
    }
    return unique;
  }

  function sortArticles(articles) {
    return [...articles].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 6. Refresh News Workflow
   */
  async function refreshNews(isBackground = false, isInitial = false) {
    if (state.isRefreshing) return;
    state.isRefreshing = true;

    if (!isBackground) {
      setRefreshSpinning(true);
    }

    try {
      const liveFetched = await fetchLiveNews();

      if (liveFetched.length > 0) {
        const merged = removeDuplicates([...liveFetched, ...state.articles]);
        state.articles = sortArticles(merged);
        state.lastUpdated = new Date();

        calculateNewArticles(liveFetched);
        saveCache();
        updateLastUpdatedDisplay();
        filterAndRender();
        updateDashboardStats();

        if (!isBackground && !isInitial) {
          showToast(`⚡ Synchronized: ${liveFetched.length} fresh intelligence reports added.`);
        }
      } else {
        // Keep existing articles, update display
        updateDashboardStats();
      }
    } catch (err) {
      console.warn('Live refresh note:', err);
    } finally {
      state.isRefreshing = false;
      setRefreshSpinning(false);
      checkOfflineStatus();
    }
  }

  /**
   * 7. Compute & Update Dashboard Statistics Dynamically
   */
  function updateDashboardStats() {
    const total = state.articles.length;
    let criticalCount = 0;
    let bountyCount = 0;
    let toolsCount = 0;

    state.articles.forEach((a) => {
      // Critical CVE
      if (a.severity === 'Critical' || (a.cveId && a.cvssScore >= 9.0)) {
        criticalCount++;
      }
      // Bug Bounty
      if (a.category === 'Bug Bounty' || a.tags.some(t => t.toLowerCase().includes('bounty'))) {
        bountyCount++;
      }
      // Security Tools
      if (a.category === 'Hacking & Security Tools' || a.tags.some(t => t.toLowerCase().includes('tool'))) {
        toolsCount++;
      }
    });

    if (elements.statTotalArticles) elements.statTotalArticles.textContent = total;
    if (elements.statCriticalCve) elements.statCriticalCve.textContent = criticalCount;
    if (elements.statBountyCount) elements.statBountyCount.textContent = bountyCount;
    if (elements.statToolsCount) elements.statToolsCount.textContent = toolsCount;
  }

  /**
   * 8. Filter & Search Logic
   */
  function filterAndRender() {
    let result = state.articles;

    // Filter by Hub View Tab
    if (state.activeView === 'trending') {
      result = result.filter((a) => a.severity === 'Critical' || a.severity === 'High' || a.tags.includes('Zero-Day') || a.tags.includes('CISA-KEV'));
    } else if (state.activeView === 'cve') {
      result = result.filter((a) => a.cveId || a.category === 'CVE / Vulnerabilities');
    } else if (state.activeView === 'bugbounty') {
      result = result.filter((a) => a.category === 'Bug Bounty' || a.tags.some(t => t.toLowerCase().includes('bounty')));
    } else if (state.activeView === 'tools') {
      result = result.filter((a) => a.category === 'Hacking & Security Tools' || a.tags.some(t => t.toLowerCase().includes('tool')));
    } else if (state.activeView === 'jobs') {
      result = result.filter((a) => a.category === 'Cybersecurity Jobs' || a.tags.some(t => t.toLowerCase().includes('job')));
    } else if (state.activeView === 'learning') {
      result = result.filter((a) => a.category === 'Learning' || a.tags.some(t => t.toLowerCase().includes('learning') || t.toLowerCase().includes('roadmap')));
    }

    // Toggle Section Banners
    if (elements.cveBanner) {
      elements.cveBanner.style.display = (state.activeView === 'cve' || state.activeCategory === 'CVE / Vulnerabilities') ? 'block' : 'none';
    }
    if (elements.bugbountyBanner) {
      elements.bugbountyBanner.style.display = (state.activeView === 'bugbounty' || state.activeCategory === 'Bug Bounty') ? 'block' : 'none';
    }

    // Filter by Source Dropdown
    if (state.activeSource !== 'all') {
      result = result.filter((a) => a.source.toLowerCase().includes(state.activeSource.toLowerCase()) || a.source === state.activeSource);
    }

    // Filter by Category Pills
    if (state.activeCategory !== 'All') {
      result = result.filter((a) => a.category.toLowerCase() === state.activeCategory.toLowerCase());
    }

    // Search Query Matching across Title, Summary, Tags, Category, CVE ID
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const inTitle = a.title.toLowerCase().includes(q);
        const inSummary = a.summary.toLowerCase().includes(q);
        const inCategory = a.category.toLowerCase().includes(q);
        const inSource = a.source.toLowerCase().includes(q);
        const inCve = a.cveId ? a.cveId.toLowerCase().includes(q) : false;
        const inTags = a.tags.some((t) => t.toLowerCase().includes(q));
        return inTitle || inSummary || inCategory || inSource || inCve || inTags;
      });
    }

    state.filteredArticles = result;
    renderNews(result);
    updateStatsDisplay(result.length);
  }

  /**
   * 9. Render News Cards (Safe DOM Construction)
   */
  function renderNews(articles) {
    if (!elements.newsContainer) return;
    elements.newsContainer.innerHTML = '';

    if (!articles || articles.length === 0) {
      renderEmptyState(
        state.searchQuery
          ? `No intelligence reports match "${state.searchQuery}". Try a broader term like "CVE", "Cloud", or "API".`
          : 'No articles currently found in this category view.'
      );
      return;
    }

    const fragment = document.createDocumentFragment();

    articles.forEach((article) => {
      const card = document.createElement('article');
      card.className = 'news-card';

      if (article.severity === 'Critical') {
        card.classList.add('critical-item');
      } else if (article.category === 'Bug Bounty') {
        card.classList.add('bounty-item');
      }

      // Top Meta: Source + Category + Severity + CVSS
      const topMeta = document.createElement('div');
      topMeta.className = 'card-top-meta';

      const sourceSpan = document.createElement('span');
      sourceSpan.className = 'card-source-pill';
      sourceSpan.textContent = article.source;
      topMeta.appendChild(sourceSpan);

      const badgesWrap = document.createElement('div');
      badgesWrap.className = 'card-badges';

      // Category Pill
      const catSpan = document.createElement('span');
      catSpan.className = 'card-category-pill';
      catSpan.textContent = article.category;
      badgesWrap.appendChild(catSpan);

      // Severity Pill (if Critical / High / Medium)
      if (article.severity) {
        const sevSpan = document.createElement('span');
        sevSpan.className = `severity-pill severity-${article.severity}`;
        sevSpan.textContent = article.severity;
        badgesWrap.appendChild(sevSpan);
      }

      // CVSS Pill (if score > 0)
      if (article.cvssScore && article.cvssScore > 0) {
        const cvssSpan = document.createElement('span');
        cvssSpan.className = 'cvss-score-pill';
        cvssSpan.textContent = `CVSS ${article.cvssScore.toFixed(1)}`;
        badgesWrap.appendChild(cvssSpan);
      }

      topMeta.appendChild(badgesWrap);
      card.appendChild(topMeta);

      // Dedicated CVE ID Badge if present
      if (article.cveId) {
        const cveBadge = document.createElement('span');
        cveBadge.className = 'cve-id-badge';
        cveBadge.textContent = article.cveId;
        card.appendChild(cveBadge);
      }

      // Card Title
      const titleEl = document.createElement('h2');
      titleEl.className = 'card-title';
      const titleLink = document.createElement('a');
      titleLink.href = `#/article/${encodeURIComponent(article.id)}`;
      titleLink.textContent = article.title;
      titleLink.addEventListener('click', (e) => {
        e.preventDefault();
        openArticleModal(article);
      });
      titleEl.appendChild(titleLink);
      card.appendChild(titleEl);

      // Summary
      const summaryEl = document.createElement('p');
      summaryEl.className = 'card-summary';
      summaryEl.textContent = article.summary;
      card.appendChild(summaryEl);

      // Tags
      if (article.tags && article.tags.length > 0) {
        const tagsWrap = document.createElement('div');
        tagsWrap.className = 'card-tags';
        article.tags.slice(0, 4).forEach((tag) => {
          const chip = document.createElement('span');
          chip.className = 'tag-chip';
          chip.textContent = `#${tag}`;
          tagsWrap.appendChild(chip);
        });
        card.appendChild(tagsWrap);
      }

      // Card Footer: Relative Time + Read Details Button + Source Link
      const footer = document.createElement('div');
      footer.className = 'card-footer';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'card-time';
      timeSpan.title = new Date(article.publishedAt).toLocaleString();
      timeSpan.textContent = formatRelativeTime(article.publishedAt);
      footer.appendChild(timeSpan);

      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'card-actions';

      const readBtn = document.createElement('button');
      readBtn.className = 'btn-read-modal';
      readBtn.innerHTML = `Read Intel <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
      readBtn.addEventListener('click', () => {
        openArticleModal(article);
      });
      actionsWrap.appendChild(readBtn);

      if (article.sourceUrl && article.sourceUrl !== '#') {
        const extLink = document.createElement('a');
        extLink.className = 'btn-source-ext';
        extLink.href = article.sourceUrl;
        extLink.target = '_blank';
        extLink.rel = 'noopener noreferrer';
        extLink.title = 'Open original source';
        extLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
        actionsWrap.appendChild(extLink);
      }

      footer.appendChild(actionsWrap);
      card.appendChild(footer);

      fragment.appendChild(card);
    });

    elements.newsContainer.appendChild(fragment);
  }

  /**
   * 10. Article Detail Reader Modal & Hash Routing
   */
  function openArticleModal(article) {
    if (!elements.articleModal || !article) return;
    state.currentModalArticleId = article.id;
    markArticleAsSeen(article.id);

    // Update URL hash for clean deep linking without full reload
    window.location.hash = `/article/${encodeURIComponent(article.id)}`;

    // Populate Modal Fields
    elements.modalArticleTitle.textContent = article.title;
    elements.modalArticleSource.textContent = article.source;
    elements.modalArticleDate.textContent = `Published ${new Date(article.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    elements.modalArticleAuthor.textContent = `Report by ${article.author}`;

    // Badges
    elements.modalArticleBadges.innerHTML = '';
    const catBadge = document.createElement('span');
    catBadge.className = 'card-category-pill';
    catBadge.textContent = article.category;
    elements.modalArticleBadges.appendChild(catBadge);

    if (article.severity) {
      const sevBadge = document.createElement('span');
      sevBadge.className = `severity-pill severity-${article.severity}`;
      sevBadge.textContent = article.severity;
      elements.modalArticleBadges.appendChild(sevBadge);
    }

    // CVE Box
    if (article.cveId) {
      elements.modalCveBox.style.display = 'block';
      elements.modalCveId.textContent = article.cveId;
      elements.modalCveCvss.textContent = article.cvssScore ? `CVSS ${article.cvssScore.toFixed(1)} / 10.0` : 'CVSS N/A';
      elements.modalCveSeverity.textContent = article.severity || 'Vulnerability';
      elements.modalCveSeverity.className = `severity-pill severity-${article.severity}`;

      elements.modalCveAffectedList.innerHTML = '';
      if (article.affectedProducts && article.affectedProducts.length > 0) {
        article.affectedProducts.forEach((p) => {
          const li = document.createElement('li');
          li.textContent = p;
          elements.modalCveAffectedList.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'Refer to primary vendor advisory for specific build versions.';
        elements.modalCveAffectedList.appendChild(li);
      }
    } else {
      elements.modalCveBox.style.display = 'none';
    }

    // Summary
    elements.modalArticleSummary.textContent = article.summary;

    // Why It Matters
    if (article.whyItMatters) {
      elements.modalWhySection.style.display = 'block';
      elements.modalArticleWhy.textContent = article.whyItMatters;
    } else {
      elements.modalWhySection.style.display = 'none';
    }

    // Technical Details
    if (article.technicalDetails) {
      elements.modalTechSection.style.display = 'block';
      elements.modalArticleTechnical.textContent = article.technicalDetails;
    } else {
      elements.modalTechSection.style.display = 'none';
    }

    // Security Recommendations & Remediation
    if (article.recommendations) {
      elements.modalRecSection.style.display = 'block';
      elements.modalArticleRecommendations.textContent = article.recommendations;
    } else {
      elements.modalRecSection.style.display = 'none';
    }

    // Tags
    elements.modalArticleTags.innerHTML = '';
    if (article.tags && article.tags.length > 0) {
      article.tags.forEach((tag) => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.textContent = `#${tag}`;
        elements.modalArticleTags.appendChild(chip);
      });
    }

    // Action Buttons
    elements.modalSourceLink.href = article.sourceUrl || '#';
    if (article.patchUrl) {
      elements.modalPatchLink.style.display = 'inline-flex';
      elements.modalPatchLink.href = article.patchUrl;
    } else {
      elements.modalPatchLink.style.display = 'none';
    }

    // Related Intelligence Cards
    renderRelatedArticles(article);

    // Show Modal
    elements.articleModal.classList.add('open');
    elements.articleModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
  }

  function renderRelatedArticles(currentArticle) {
    if (!elements.modalRelatedContainer) return;
    elements.modalRelatedContainer.innerHTML = '';

    const related = state.articles
      .filter((a) => a.id !== currentArticle.id && (a.category === currentArticle.category || a.tags.some(t => currentArticle.tags.includes(t))))
      .slice(0, 2);

    if (related.length === 0) {
      elements.modalRelatedContainer.innerHTML = '<p style="font-size: 0.84rem; color: var(--text-muted);">No additional related disclosures in this category.</p>';
      return;
    }

    related.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'related-card';
      card.innerHTML = `
        <div class="related-card-category">${sanitizeText(item.category)} • ${sanitizeText(item.source)}</div>
        <div class="related-card-title">${sanitizeText(item.title)}</div>
      `;
      card.addEventListener('click', () => {
        openArticleModal(item);
      });
      elements.modalRelatedContainer.appendChild(card);
    });
  }

  function closeArticleModal() {
    if (!elements.articleModal) return;
    elements.articleModal.classList.remove('open');
    elements.articleModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.currentModalArticleId = null;

    // Reset hash if currently on an article
    if (window.location.hash.startsWith('#/article/')) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }

  /**
   * 11. Hash Routing (Support Deep-Linking like #/article/:id)
   */
  function setupHashRouting() {
    window.addEventListener('hashchange', checkHashRoute);
    // Initial check on page load
    setTimeout(checkHashRoute, 200);
  }

  function checkHashRoute() {
    const hash = window.location.hash;
    if (hash.startsWith('#/article/')) {
      const articleId = decodeURIComponent(hash.replace('#/article/', ''));
      const found = state.articles.find((a) => a.id === articleId);
      if (found) {
        openArticleModal(found);
      }
    } else if (hash === '' || hash === '#' || hash === '#/') {
      if (elements.articleModal?.classList.contains('open')) {
        closeArticleModal();
      }
    }
  }

  /**
   * 12. Trust & Transparency Info Modals
   */
  function openInfoModal(pageKey) {
    const page = TRUST_PAGES[pageKey];
    if (!page || !elements.infoModal) return;

    elements.infoModalTitle.textContent = page.title;
    elements.infoModalBody.innerHTML = page.html;
    elements.infoModal.classList.add('open');
    elements.infoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeInfoModal() {
    if (!elements.infoModal) return;
    elements.infoModal.classList.remove('open');
    elements.infoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /**
   * 13. Empty State
   */
  function renderEmptyState(message) {
    if (!elements.newsContainer) return;
    elements.newsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛡️</div>
        <div class="empty-title">No Intelligence Reports Found</div>
        <p class="empty-subtitle">${sanitizeText(message)}</p>
        <button id="btn-reset-filters" class="btn-reset-filter">Reset Filters &amp; Search</button>
      </div>
    `;

    document.getElementById('btn-reset-filters')?.addEventListener('click', resetFilters);
  }

  function resetFilters() {
    state.searchQuery = '';
    state.activeCategory = 'All';
    state.activeView = 'all';
    state.activeSource = 'all';

    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.searchClear) elements.searchClear.classList.remove('visible');
    if (elements.sourceSelect) elements.sourceSelect.value = 'all';

    // Reset Hub Tabs
    document.querySelectorAll('.hub-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.view === 'all');
    });

    // Reset Category Pills
    elements.categoryPills?.querySelectorAll('.category-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.textContent === 'All');
    });

    filterAndRender();
  }

  /**
   * 14. UI Controls & Listeners
   */
  function setupUIControls() {
    // Refresh Button
    elements.btnRefresh?.addEventListener('click', () => {
      refreshNews(false, false);
    });

    // Theme Toggle
    elements.btnTheme?.addEventListener('click', toggleTheme);

    // Notification Button
    elements.btnNotification?.addEventListener('click', () => {
      if (!state.notificationEnabled) {
        requestNotificationPermission();
      } else {
        showToast('🔔 Daily 9:00 AM security briefing is active.');
      }
    });

    elements.btnNotifyEnable?.addEventListener('click', requestNotificationPermission);
    elements.btnNotifyDismiss?.addEventListener('click', () => {
      elements.notificationPrompt?.classList.remove('visible');
      localStorage.setItem(STORAGE_KEYS.NOTIFY_PROMPT_SHOWN, 'true');
    });

    // Hub View Tabs
    document.querySelectorAll('.hub-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeView = tab.dataset.view || 'all';
        filterAndRender();
      });
    });

    // Source Filter Change
    elements.sourceSelect?.addEventListener('change', (e) => {
      state.activeSource = e.target.value;
      localStorage.setItem(STORAGE_KEYS.SELECTED_SOURCE, state.activeSource);
      filterAndRender();
    });

    // Debounced Search Input
    let debounceTimer;
    elements.searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value;
      if (elements.searchClear) {
        elements.searchClear.classList.toggle('visible', val.length > 0);
      }
      debounceTimer = setTimeout(() => {
        state.searchQuery = val;
        filterAndRender();
      }, 150);
    });

    // Clear Search Button
    elements.searchClear?.addEventListener('click', () => {
      if (elements.searchInput) {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.searchClear.classList.remove('visible');
        filterAndRender();
        elements.searchInput.focus();
      }
    });

    // Article Modal Close
    elements.modalArticleClose?.addEventListener('click', closeArticleModal);
    elements.articleModal?.addEventListener('click', (e) => {
      if (e.target === elements.articleModal) closeArticleModal();
    });

    // Info Modal Close
    elements.infoModalClose?.addEventListener('click', closeInfoModal);
    elements.infoModal?.addEventListener('click', (e) => {
      if (e.target === elements.infoModal) closeInfoModal();
    });

    // Trust / Info Modal Triggers
    document.querySelectorAll('.js-open-modal').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const key = trigger.getAttribute('data-modal');
        if (key) openInfoModal(key);
      });
    });

    // Share Button
    elements.modalShareBtn?.addEventListener('click', () => {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('📋 Link copied to clipboard!');
        }).catch(() => {
          showToast('Link: ' + url);
        });
      } else {
        showToast('Link: ' + url);
      }
    });

    // Keyboard ESC to close modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (elements.articleModal?.classList.contains('open')) closeArticleModal();
        if (elements.infoModal?.classList.contains('open')) closeInfoModal();
      }
    });

    // Online / Offline Listeners
    window.addEventListener('online', () => {
      checkOfflineStatus();
      showToast('⚡ Network connection restored. Syncing feeds...');
      refreshNews(true, false);
    });

    window.addEventListener('offline', () => {
      checkOfflineStatus();
      showToast('📡 You are offline. Serving cached intelligence.');
    });
  }

  function setCategory(category) {
    state.activeCategory = category;
    localStorage.setItem(STORAGE_KEYS.SELECTED_CATEGORY, category);

    const pills = elements.categoryPills?.querySelectorAll('.category-pill');
    pills?.forEach((pill) => {
      const isCurrent = pill.textContent === category;
      pill.classList.toggle('active', isCurrent);
      pill.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    filterAndRender();
  }

  /**
   * 15. Theme Handling
   */
  function loadTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    setTheme(savedTheme);
  }

  function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    if (theme === 'light') {
      if (elements.themeMoon) elements.themeMoon.style.display = 'none';
      if (elements.themeSun) elements.themeSun.style.display = 'block';
    } else {
      if (elements.themeMoon) elements.themeMoon.style.display = 'block';
      if (elements.themeSun) elements.themeSun.style.display = 'none';
    }
  }

  /**
   * 16. Daily 9 AM Notification Workflow
   */
  function checkDailyNotificationPrompt() {
    const isGranted = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) === 'true';
    const promptShown = localStorage.getItem(STORAGE_KEYS.NOTIFY_PROMPT_SHOWN) === 'true';

    state.notificationEnabled = isGranted && ('Notification' in window && Notification.permission === 'granted');
    updateNotificationIconState();

    if (!isGranted && !promptShown && 'Notification' in window && Notification.permission !== 'denied') {
      setTimeout(() => {
        elements.notificationPrompt?.classList.add('visible');
      }, 3000);
    }
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      showToast('Notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, 'true');
        state.notificationEnabled = true;
        updateNotificationIconState();
        showToast('🔔 Daily 9:00 AM notifications enabled!');
        
        new Notification('🛡️ Cyber Daily Briefing Active', {
          body: 'Morning security briefings will notify you when fresh CVEs and bug bounties drop.',
          icon: 'assets/icon.svg'
        });
      } else {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, 'false');
        state.notificationEnabled = false;
        updateNotificationIconState();
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    } finally {
      elements.notificationPrompt?.classList.remove('visible');
      localStorage.setItem(STORAGE_KEYS.NOTIFY_PROMPT_SHOWN, 'true');
    }
  }

  function updateNotificationIconState() {
    if (!elements.btnNotification) return;
    elements.btnNotification.classList.toggle('active', state.notificationEnabled);
  }

  function scheduleDaily9AMCheck() {
    setInterval(checkDailyNotification, 60 * 1000);
    checkDailyNotification();
  }

  function checkDailyNotification() {
    const now = new Date();
    const todayStr = now.toDateString();
    const targetHour = window.appConfig?.dailyNotificationHour ?? 9;
    const targetMinute = window.appConfig?.dailyNotificationMinute ?? 0;
    const lastNotified = localStorage.getItem(STORAGE_KEYS.LAST_9AM_NOTIFIED);

    if (now.getHours() === targetHour && now.getMinutes() >= targetMinute && lastNotified !== todayStr) {
      localStorage.setItem(STORAGE_KEYS.LAST_9AM_NOTIFIED, todayStr);

      if (state.notificationEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 Cyber Daily Morning Briefing', {
          body: 'Today’s critical vulnerability disclosures and bug bounty updates are live.',
          icon: 'assets/icon.svg'
        });
      }

      refreshNews(true, false);
    }

    updateDailyUpdateBanner();
  }

  function updateDailyUpdateBanner() {
    if (!elements.bannerDaily) return;
    const now = new Date();
    const isMorning = now.getHours() >= 8 && now.getHours() <= 12;

    if (isMorning) {
      elements.bannerDaily.classList.add('visible');
      elements.bannerDailyText.textContent = `Today's Morning Briefing: ${state.articles.length} verified intelligence reports ready.`;
    } else {
      elements.bannerDaily.classList.remove('visible');
    }
  }

  function calculateNewArticles(fetchedArticles) {
    let unreadCount = 0;
    fetchedArticles.forEach((a) => {
      if (!state.seenArticleIds.has(a.id)) {
        unreadCount++;
      }
    });
    state.dailyUpdateCount = unreadCount;
    updateDailyUpdateBanner();
  }

  function markArticleAsSeen(articleId) {
    if (!articleId) return;
    state.seenArticleIds.add(articleId);
    saveSeenIds();
  }

  /**
   * 17. Cache & Storage Helpers
   */
  function saveCache() {
    try {
      const toCache = state.articles.slice(0, 100);
      localStorage.setItem(STORAGE_KEYS.CACHED_ARTICLES, JSON.stringify(toCache));
      if (state.lastUpdated) {
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, state.lastUpdated.toISOString());
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function loadCache() {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_ARTICLES);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.articles = parsed;
          return true;
        }
      }

      const savedTime = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
      if (savedTime) {
        state.lastUpdated = new Date(savedTime);
        updateLastUpdatedDisplay();
      }

      const savedSeen = localStorage.getItem(STORAGE_KEYS.SEEN_IDS);
      if (savedSeen) {
        state.seenArticleIds = new Set(JSON.parse(savedSeen));
      }
    } catch (e) {
      console.warn('Cache loading note:', e);
    }
    return false;
  }

  function saveSeenIds() {
    try {
      const idsArray = Array.from(state.seenArticleIds).slice(-300);
      localStorage.setItem(STORAGE_KEYS.SEEN_IDS, JSON.stringify(idsArray));
    } catch (e) {}
  }

  function checkOfflineStatus() {
    const isOffline = !navigator.onLine;
    if (elements.bannerOffline) {
      elements.bannerOffline.classList.toggle('visible', isOffline);
    }
  }

  function setRefreshSpinning(isSpinning) {
    const svg = elements.btnRefresh?.querySelector('svg');
    if (svg) {
      svg.classList.toggle('spin', isSpinning);
    }
  }

  function updateLastUpdatedDisplay() {
    if (!elements.lastUpdatedText) return;
    if (!state.lastUpdated) {
      elements.lastUpdatedText.textContent = 'Last sync: --';
      return;
    }
    const timeStr = state.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.lastUpdatedText.textContent = `Last sync: ${timeStr}`;
  }

  function updateStatsDisplay(count) {
    if (elements.articleCount) {
      elements.articleCount.textContent = `${count} ${count === 1 ? 'Report' : 'Reports'}`;
    }
  }

  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) {
      const min = Math.floor(diffSeconds / 60);
      return `${min}m ago`;
    }
    if (diffSeconds < 86400) {
      const hr = Math.floor(diffSeconds / 3600);
      return `${hr}h ago`;
    }
    if (diffSeconds < 172800) return 'Yesterday';
    const days = Math.floor(diffSeconds / 86400);
    if (days <= 30) return `${days}d ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function detectCategory(text, defaultCat = 'Cybersecurity News') {
    if (!text) return defaultCat;
    const lower = text.toLowerCase();

    if (lower.includes('bounty') || lower.includes('hackerone') || lower.includes('bugcrowd') || lower.includes('writeup')) {
      return 'Bug Bounty';
    }
    if (lower.includes('cve-') || lower.includes('zero-day') || lower.includes('0-day') || lower.includes('vulnerability')) {
      return 'CVE / Vulnerabilities';
    }
    if (lower.includes('tool') || lower.includes('nuclei') || lower.includes('burp') || lower.includes('scanner') || lower.includes('subfinder')) {
      return 'Hacking & Security Tools';
    }
    if (lower.includes('breach') || lower.includes('leaked') || lower.includes('database dump') || lower.includes('ransomware')) {
      return 'Data Breaches';
    }
    if (lower.includes('llm') || lower.includes('ai security') || lower.includes('prompt injection') || lower.includes('gpt')) {
      return 'AI Security';
    }
    if (lower.includes('xss') || lower.includes('sqli') || lower.includes('ssrf') || lower.includes('idor') || lower.includes('csrf')) {
      return 'Web Security';
    }
    if (lower.includes('aws') || lower.includes('azure') || lower.includes('gcp') || lower.includes('cloud') || lower.includes('s3') || lower.includes('iam')) {
      return 'Cloud Security';
    }
    if (lower.includes('job') || lower.includes('hiring') || lower.includes('analyst') || lower.includes('engineer') || lower.includes('career')) {
      return 'Cybersecurity Jobs';
    }
    if (lower.includes('roadmap') || lower.includes('learn') || lower.includes('tutorial') || lower.includes('guide') || lower.includes('ctf')) {
      return 'Learning';
    }

    return defaultCat;
  }

  function normalizeUrlForDeduplication(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      parsed.searchParams.delete('utm_source');
      parsed.searchParams.delete('utm_medium');
      parsed.searchParams.delete('utm_campaign');
      parsed.searchParams.delete('utm_term');
      parsed.searchParams.delete('utm_content');
      parsed.hash = '';
      let clean = parsed.toString();
      if (clean.endsWith('/')) clean = clean.slice(0, -1);
      return clean;
    } catch (e) {
      return url.trim().toLowerCase();
    }
  }

  function cleanPlainText(raw) {
    if (!raw) return '';
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const text = doc.body.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str.trim();
  }

  function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('./') || trimmed.startsWith('#/')) {
      return trimmed;
    }
    return '#';
  }

  function showToast(message, duration = 3200) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
