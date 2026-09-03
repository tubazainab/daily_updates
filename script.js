/**
 * Cyber Security & Hacking News Aggregator - Core Engine
 * 
 * Lightweight, Mobile-First, Vanilla JavaScript.
 * Hosted on GitHub Pages.
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
    activeSource: 'all',
    searchQuery: '',
    lastUpdated: null,
    seenArticleIds: new Set(),
    isRefreshing: false,
    theme: 'dark',
    notificationEnabled: false,
    dailyUpdateCount: 0
  };

  // Local Storage Keys
  const STORAGE_KEYS = {
    THEME: 'cyber_news_theme',
    NOTIFICATIONS: 'cyber_news_notifications_enabled',
    NOTIFY_PROMPT_SHOWN: 'cyber_news_notify_prompt_shown',
    SELECTED_CATEGORY: 'cyber_news_selected_category',
    SELECTED_SOURCE: 'cyber_news_selected_source',
    CACHED_ARTICLES: 'cyber_news_cached_articles',
    SEEN_IDS: 'cyber_news_seen_ids',
    LAST_UPDATED: 'cyber_news_last_updated',
    LAST_9AM_NOTIFIED: 'cyber_news_last_9am_notified'
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
    toastContainer: document.getElementById('toast-container')
  };

  /**
   * 1. Initialize Application
   */
  function init() {
    loadTheme();
    loadSources();
    setupUIControls();
    loadCache();
    checkOfflineStatus();
    checkDailyNotificationPrompt();
    scheduleDaily9AMCheck();

    // Initial fetch of news
    refreshNews();

    // Auto-refresh timer (default 30 minutes)
    const refreshMs = (window.appConfig?.refreshIntervalMinutes || 30) * 60 * 1000;
    setInterval(() => {
      refreshNews(true); // background auto refresh
    }, refreshMs);

    // Register Service Worker if supported for offline/PWA capability
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch((err) => {
          console.warn('Service Worker registration note:', err.message);
        });
      });
    }
  }

  /**
   * 2. Load Sources & Category Filters
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
    // Keep first "All Sources"
    elements.sourceSelect.innerHTML = '<option value="all">All Sources</option>';

    state.sources.forEach((source) => {
      const option = document.createElement('option');
      option.value = source.id;
      option.textContent = source.name;
      elements.sourceSelect.appendChild(option);
    });

    // Restore saved source if available
    const savedSource = localStorage.getItem(STORAGE_KEYS.SELECTED_SOURCE);
    if (savedSource && (savedSource === 'all' || state.sources.some(s => s.id === savedSource))) {
      state.activeSource = savedSource;
      elements.sourceSelect.value = savedSource;
    }
  }

  /**
   * 3. Fetching News Concurrently (Error Resilient)
   */
  async function fetchNews() {
    const enabledSources = state.sources.filter((s) => s.enabled);
    if (enabledSources.length === 0) {
      showToast('No news sources enabled in data/sources.js');
      return [];
    }

    const fetchPromises = enabledSources.map(async (source) => {
      try {
        if (source.type === 'api_hn') {
          return await fetchHackerNewsSource(source);
        } else {
          return await fetchRSSSource(source);
        }
      } catch (err) {
        // Log individual source error without crashing the application
        console.warn(`[News Aggregator] Source "${source.name}" unavailable:`, err.message);
        return [];
      }
    });

    // Promise.allSettled guarantees that one failing source never breaks the others
    const results = await Promise.allSettled(fetchPromises);
    const collectedArticles = [];
    let failedCount = 0;

    results.forEach((res, index) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        collectedArticles.push(...res.value);
      } else {
        failedCount++;
      }
    });

    if (failedCount > 0 && failedCount === enabledSources.length) {
      showToast('Unable to fetch online feeds. Showing cached news.');
    }

    return collectedArticles;
  }

  /**
   * Fetch Hacker News Algolia JSON API (Direct open CORS)
   */
  async function fetchHackerNewsSource(source) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(source.feed, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const hits = Array.isArray(data.hits) ? data.hits : [];

    return hits
      .filter((hit) => hit.title && (hit.url || hit.story_text || hit.objectID))
      .map((hit) => {
        const articleUrl = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
        const description = hit.story_text ? cleanPlainText(hit.story_text) : `Hacker News discussion (${hit.points || 0} points, ${hit.num_comments || 0} comments)`;

        return normalizeArticle({
          sourceId: source.id,
          sourceName: source.name,
          title: hit.title,
          url: articleUrl,
          description: description,
          publishedAt: hit.created_at || new Date().toISOString(),
          category: detectCategory(hit.title, source.category),
          thumbnail: null
        });
      });
  }

  /**
   * Fetch RSS Feeds via CORS-Friendly Gateway or Direct
   */
  async function fetchRSSSource(source) {
    const proxies = window.appConfig?.rssProxies || [
      'https://api.rss2json.com/v1/api.json?rss_url='
    ];

    let lastError = null;

    // Try primary proxy converter (RSS2JSON returns parsed JSON directly)
    for (const proxyUrl of proxies) {
      try {
        const targetUrl = proxyUrl ? `${proxyUrl}${encodeURIComponent(source.feed)}` : source.feed;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Case 1: Proxy returned JSON (e.g. api.rss2json.com)
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json') || proxyUrl.includes('rss2json')) {
          const data = await response.json();
          if (data.status === 'ok' && Array.isArray(data.items)) {
            return data.items.map((item) => {
              const thumb = item.thumbnail || item.enclosure?.link || extractImgFromHTML(item.description);
              return normalizeArticle({
                sourceId: source.id,
                sourceName: source.name,
                title: item.title,
                url: item.link || item.guid,
                description: cleanPlainText(item.description),
                publishedAt: item.pubDate || new Date().toISOString(),
                category: detectCategory(item.title + ' ' + (item.categories?.join(' ') || ''), source.category),
                thumbnail: thumb
              });
            });
          }
        }

        // Case 2: Proxy returned raw XML text (e.g. allorigins or direct XML)
        const xmlText = await response.text();
        const parsed = parseXMLFeed(xmlText, source);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        lastError = err;
        // Continue loop to next fallback proxy
      }
    }

    throw lastError || new Error('All feed gateways failed');
  }

  /**
   * Parse XML/Atom Feed in Browser
   */
  function parseXMLFeed(xmlText, source) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing failed');
    }

    // Try RSS <item> tags
    let items = Array.from(doc.querySelectorAll('item'));
    // Or Atom <entry> tags
    if (items.length === 0) {
      items = Array.from(doc.querySelectorAll('entry'));
    }

    return items.map((node) => {
      const title = node.querySelector('title')?.textContent || 'Untitled';
      const link = node.querySelector('link')?.textContent || node.querySelector('link')?.getAttribute('href') || '';
      const desc = node.querySelector('description')?.textContent || node.querySelector('summary')?.textContent || node.querySelector('content')?.textContent || '';
      const pubDate = node.querySelector('pubDate')?.textContent || node.querySelector('published')?.textContent || node.querySelector('updated')?.textContent || '';
      
      let thumb = null;
      const mediaContent = node.querySelector('media\\:content, content') || node.querySelector('enclosure[type^="image"]');
      if (mediaContent) {
        thumb = mediaContent.getAttribute('url');
      }
      if (!thumb) {
        thumb = extractImgFromHTML(desc);
      }

      return normalizeArticle({
        sourceId: source.id,
        sourceName: source.name,
        title: title,
        url: link,
        description: cleanPlainText(desc),
        publishedAt: pubDate || new Date().toISOString(),
        category: detectCategory(title + ' ' + desc, source.category),
        thumbnail: thumb
      });
    });
  }

  /**
   * 4. Normalize Article Structure
   */
  function normalizeArticle(item) {
    const safeUrl = sanitizeUrl(item.url);
    const cleanTitle = sanitizeText(item.title) || 'Untitled Security Article';
    const cleanDesc = sanitizeText(item.description) || 'No summary available for this article.';
    
    // Parse valid date or fallback to now
    let parsedDate = new Date(item.publishedAt);
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }

    // Normalize URL as primary duplicate key
    const normalizedId = normalizeUrlForDeduplication(safeUrl);

    return {
      id: normalizedId,
      sourceId: item.sourceId || 'source',
      sourceName: item.sourceName || 'Infosec Source',
      title: cleanTitle,
      url: safeUrl,
      description: cleanDesc,
      publishedAt: parsedDate.toISOString(),
      timestamp: parsedDate.getTime(),
      category: item.category || 'Cyber Security',
      thumbnail: sanitizeUrl(item.thumbnail)
    };
  }

  /**
   * 5. Remove Duplicates (by normalized URL)
   */
  function removeDuplicates(articles) {
    const seen = new Set();
    const unique = [];

    for (const article of articles) {
      if (!article.url || article.url === '#') continue;
      const key = article.id || article.url;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(article);
      }
    }
    return unique;
  }

  /**
   * 6. Chronological Sorting (Newest first)
   */
  function sortArticles(articles) {
    return [...articles].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 7. Refresh News Workflow
   */
  async function refreshNews(isBackground = false) {
    if (state.isRefreshing) return;
    state.isRefreshing = true;

    if (!isBackground) {
      setRefreshSpinning(true);
      if (state.articles.length === 0) {
        renderSkeletonLoading();
      }
    }

    try {
      const rawFetched = await fetchNews();

      if (rawFetched.length > 0) {
        // Merge with existing articles for seamless updates
        const merged = removeDuplicates([...rawFetched, ...state.articles]);
        const sorted = sortArticles(merged);

        // Calculate new articles for 9 AM indicator
        calculateNewArticles(rawFetched);

        state.articles = sorted;
        state.lastUpdated = new Date();

        saveCache();
        updateLastUpdatedDisplay();
        filterAndRender();

        if (!isBackground) {
          showToast(`Feed updated with ${rawFetched.length} latest articles.`);
        }
      } else if (state.articles.length > 0) {
        // If fetch yielded 0 (e.g. offline), render current cached
        filterAndRender();
      } else {
        renderEmptyState('No articles could be loaded. Please check your internet connection or sources configuration.');
      }
    } catch (err) {
      console.error('Error refreshing news:', err);
      if (state.articles.length > 0) {
        filterAndRender();
      } else {
        renderEmptyState('Unable to load feed. Displaying cached data where available.');
      }
    } finally {
      state.isRefreshing = false;
      setRefreshSpinning(false);
      checkOfflineStatus();
    }
  }

  /**
   * 8. Filter & Search Logic
   */
  function filterAndRender() {
    let result = state.articles;

    // Filter by Source
    if (state.activeSource !== 'all') {
      result = result.filter((a) => a.sourceId === state.activeSource);
    }

    // Filter by Category
    if (state.activeCategory !== 'All') {
      result = result.filter((a) => a.category.toLowerCase() === state.activeCategory.toLowerCase());
    }

    // Filter by Search Query
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      result = result.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.sourceName.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
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
          ? `No articles match "${state.searchQuery}". Try another keyword or filter.`
          : 'No articles found in this category.'
      );
      return;
    }

    const fragment = document.createDocumentFragment();

    articles.forEach((article) => {
      const card = document.createElement('article');
      card.className = 'news-card';

      // Check if newly fetched around 9 AM
      const isUnread = !state.seenArticleIds.has(article.id);
      if (isUnread && isNearNineAM()) {
        card.classList.add('is-new');
      }

      // Card Header (Source Name + Category Badge + Optional New Badge)
      const metaTop = document.createElement('div');
      metaTop.className = 'card-meta-top';

      const sourceSpan = document.createElement('span');
      sourceSpan.className = 'card-source';
      sourceSpan.textContent = article.sourceName;
      metaTop.appendChild(sourceSpan);

      const badgesWrap = document.createElement('div');
      badgesWrap.style.display = 'flex';
      badgesWrap.style.gap = '6px';
      badgesWrap.style.alignItems = 'center';

      if (isUnread && isNearNineAM()) {
        const newBadge = document.createElement('span');
        newBadge.className = 'new-badge';
        newBadge.textContent = 'NEW';
        badgesWrap.appendChild(newBadge);
      }

      const categorySpan = document.createElement('span');
      categorySpan.className = 'card-category';
      categorySpan.textContent = article.category;
      badgesWrap.appendChild(categorySpan);

      metaTop.appendChild(badgesWrap);
      card.appendChild(metaTop);

      // Card Body (Content & Thumbnail)
      const contentWrap = document.createElement('div');
      contentWrap.className = 'card-content-wrap';

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';

      // Title with Safe Link
      const titleEl = document.createElement('h2');
      titleEl.className = 'card-title';
      const titleLink = document.createElement('a');
      titleLink.href = article.url;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
      titleLink.textContent = article.title;
      titleLink.addEventListener('click', () => markArticleAsSeen(article.id));
      titleEl.appendChild(titleLink);
      cardBody.appendChild(titleEl);

      // Description
      const descEl = document.createElement('p');
      descEl.className = 'card-description';
      descEl.textContent = article.description;
      cardBody.appendChild(descEl);

      contentWrap.appendChild(cardBody);

      // Thumbnail (if valid and present)
      if (article.thumbnail && article.thumbnail.startsWith('http')) {
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'card-thumb-wrap';

        const img = document.createElement('img');
        img.className = 'card-thumb';
        img.src = article.thumbnail;
        img.alt = article.title;
        img.loading = 'lazy';
        img.onerror = () => {
          thumbWrap.style.display = 'none'; // hide on image load error
        };

        thumbWrap.appendChild(img);
        contentWrap.appendChild(thumbWrap);
      }

      card.appendChild(contentWrap);

      // Card Footer (Time & Read Article Button)
      const footer = document.createElement('div');
      footer.className = 'card-footer';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'card-time';
      timeSpan.title = new Date(article.publishedAt).toLocaleString();
      timeSpan.textContent = formatRelativeTime(article.publishedAt);
      footer.appendChild(timeSpan);

      const readBtn = document.createElement('a');
      readBtn.className = 'card-read-btn';
      readBtn.href = article.url;
      readBtn.target = '_blank';
      readBtn.rel = 'noopener noreferrer';
      readBtn.innerHTML = `Read Article <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
      readBtn.addEventListener('click', () => markArticleAsSeen(article.id));
      footer.appendChild(readBtn);

      card.appendChild(footer);
      fragment.appendChild(card);
    });

    elements.newsContainer.appendChild(fragment);
  }

  /**
   * Skeleton Loading Cards
   */
  function renderSkeletonLoading() {
    if (!elements.newsContainer) return;
    elements.newsContainer.innerHTML = `
      <div class="skeleton-card">
        <div class="skeleton-shimmer skeleton-meta"></div>
        <div class="skeleton-shimmer skeleton-title"></div>
        <div class="skeleton-shimmer skeleton-desc"></div>
        <div class="skeleton-shimmer skeleton-desc-2"></div>
        <div class="skeleton-shimmer skeleton-footer"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-shimmer skeleton-meta"></div>
        <div class="skeleton-shimmer skeleton-title"></div>
        <div class="skeleton-shimmer skeleton-desc"></div>
        <div class="skeleton-shimmer skeleton-desc-2"></div>
        <div class="skeleton-shimmer skeleton-footer"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-shimmer skeleton-meta"></div>
        <div class="skeleton-shimmer skeleton-title"></div>
        <div class="skeleton-shimmer skeleton-desc"></div>
        <div class="skeleton-shimmer skeleton-desc-2"></div>
        <div class="skeleton-shimmer skeleton-footer"></div>
      </div>
    `;
  }

  /**
   * Empty / No Results State
   */
  function renderEmptyState(message) {
    if (!elements.newsContainer) return;
    elements.newsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛡️</div>
        <div class="empty-title">No Articles Found</div>
        <p class="empty-subtitle">${sanitizeText(message)}</p>
      </div>
    `;
  }

  /**
   * 10. Daily 9 AM Notification Feature
   */
  function checkDailyNotificationPrompt() {
    const isGranted = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) === 'true';
    const promptShown = localStorage.getItem(STORAGE_KEYS.NOTIFY_PROMPT_SHOWN) === 'true';

    state.notificationEnabled = isGranted && ('Notification' in window && Notification.permission === 'granted');
    updateNotificationIconState();

    // Show friendly prompt if not yet decided
    if (!isGranted && !promptShown && 'Notification' in window && Notification.permission !== 'denied') {
      setTimeout(() => {
        if (elements.notificationPrompt) {
          elements.notificationPrompt.classList.add('visible');
        }
      }, 2000);
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
        
        // Instant test notification confirmation
        showNotification(
          '🛡️ Daily Cyber News Enabled',
          'You will receive morning reminders when new cyber security news is ready.'
        );
      } else {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, 'false');
        state.notificationEnabled = false;
        updateNotificationIconState();
        showToast('Notification permission was not granted.');
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    } finally {
      if (elements.notificationPrompt) {
        elements.notificationPrompt.classList.remove('visible');
      }
      localStorage.setItem(STORAGE_KEYS.NOTIFY_PROMPT_SHOWN, 'true');
    }
  }

  function showNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      // Try service worker notification first if available
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: title,
          body: body
        });
      } else {
        // Fallback to standard Notification API
        new Notification(title, {
          body: body,
          icon: 'assets/icon.svg',
          tag: 'cyber-news-daily'
        });
      }
    } catch (e) {
      console.warn('Failed to display notification:', e);
    }
  }

  /**
   * 9 AM Reminder Scheduler
   */
  function scheduleDaily9AMCheck() {
    // Check every 60 seconds if it's 9:00 AM local time
    setInterval(checkDailyNotification, 60 * 1000);
    // Also run immediate check
    checkDailyNotification();
  }

  function checkDailyNotification() {
    const now = new Date();
    const todayStr = now.toDateString();
    const targetHour = window.appConfig?.dailyNotificationHour ?? 9;
    const targetMinute = window.appConfig?.dailyNotificationMinute ?? 0;

    const lastNotified = localStorage.getItem(STORAGE_KEYS.LAST_9AM_NOTIFIED);

    // If current time is 9:00 AM to 9:30 AM and hasn't notified today
    if (now.getHours() === targetHour && now.getMinutes() >= targetMinute && lastNotified !== todayStr) {
      localStorage.setItem(STORAGE_KEYS.LAST_9AM_NOTIFIED, todayStr);

      if (state.notificationEnabled) {
        showNotification(
          '🔔 Daily Cyber News Ready',
          'Your daily cyber security & hacking news is ready. Tap to view the latest updates!'
        );
      }

      // Auto-refresh to ensure morning news is fresh
      refreshNews(true);
    }

    // Check if 9 AM banner should be displayed
    updateDailyUpdateBanner();
  }

  function updateDailyUpdateBanner() {
    if (!elements.bannerDaily) return;

    if (isNearNineAM()) {
      elements.bannerDaily.classList.add('visible');
      const count = state.dailyUpdateCount > 0 ? state.dailyUpdateCount : state.articles.length;
      if (count > 0) {
        elements.bannerDailyText.textContent = `Today's update: ${count} new articles available`;
      } else {
        elements.bannerDailyText.textContent = `Today's 9 AM cyber security briefing is ready.`;
      }
    } else {
      elements.bannerDaily.classList.remove('visible');
    }
  }

  function isNearNineAM() {
    const now = new Date();
    // Consider 8:30 AM to 11:59 AM as morning update window
    return now.getHours() >= 8 && now.getHours() <= 12;
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
   * 11. Caching & Offline Handling
   */
  function saveCache() {
    try {
      // Cache latest 100 articles
      const toCache = state.articles.slice(0, 100);
      localStorage.setItem(STORAGE_KEYS.CACHED_ARTICLES, JSON.stringify(toCache));
      if (state.lastUpdated) {
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, state.lastUpdated.toISOString());
      }
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  function loadCache() {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_ARTICLES);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.articles = parsed;
          filterAndRender();
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
      console.warn('LocalStorage load error:', e);
    }
  }

  function saveSeenIds() {
    try {
      // Keep seen IDs capped to recent 300
      const idsArray = Array.from(state.seenArticleIds).slice(-300);
      localStorage.setItem(STORAGE_KEYS.SEEN_IDS, JSON.stringify(idsArray));
    } catch (e) {
      // Ignore
    }
  }

  function checkOfflineStatus() {
    const isOffline = !navigator.onLine;
    if (elements.bannerOffline) {
      if (isOffline) {
        elements.bannerOffline.classList.add('visible');
      } else {
        elements.bannerOffline.classList.remove('visible');
      }
    }
  }

  /**
   * 12. UI Controls & Event Listeners
   */
  function setupUIControls() {
    // Refresh Button Click
    elements.btnRefresh?.addEventListener('click', () => {
      refreshNews(false);
    });

    // Theme Toggle Click
    elements.btnTheme?.addEventListener('click', toggleTheme);

    // Notification Icon Button Click
    elements.btnNotification?.addEventListener('click', () => {
      if (!state.notificationEnabled) {
        requestNotificationPermission();
      } else {
        showToast('Daily 9:00 AM notifications are active.');
      }
    });

    // Notification Prompt Buttons
    elements.btnNotifyEnable?.addEventListener('click', requestNotificationPermission);
    elements.btnNotifyDismiss?.addEventListener('click', () => {
      if (elements.notificationPrompt) {
        elements.notificationPrompt.classList.remove('visible');
      }
      localStorage.setItem(STORAGE_KEYS.NOTIFY_PROMPT_SHOWN, 'true');
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
      
      // Show or hide clear button
      if (elements.searchClear) {
        if (val.length > 0) {
          elements.searchClear.classList.add('visible');
        } else {
          elements.searchClear.classList.remove('visible');
        }
      }

      debounceTimer = setTimeout(() => {
        state.searchQuery = val;
        filterAndRender();
      }, 200);
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

    // Network Online/Offline Listeners
    window.addEventListener('online', () => {
      checkOfflineStatus();
      showToast('Network restored. Refreshing news...');
      refreshNews(true);
    });

    window.addEventListener('offline', () => {
      checkOfflineStatus();
      showToast('You are currently offline.');
    });
  }

  function setCategory(category) {
    state.activeCategory = category;
    localStorage.setItem(STORAGE_KEYS.SELECTED_CATEGORY, category);

    // Update pill styles
    const pills = elements.categoryPills?.querySelectorAll('.category-pill');
    pills?.forEach((pill) => {
      const isCurrent = pill.textContent === category;
      pill.classList.toggle('active', isCurrent);
      pill.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    filterAndRender();
  }

  /**
   * 13. Theme Handling (Light / Dark)
   */
  function loadTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Respect system preference if available
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'dark'); // default sleek dark
    }
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

  function updateNotificationIconState() {
    if (elements.btnNotification) {
      if (state.notificationEnabled) {
        elements.btnNotification.classList.add('active');
        elements.btnNotification.title = 'Daily 9:00 AM notifications enabled';
      } else {
        elements.btnNotification.classList.remove('active');
        elements.btnNotification.title = 'Click to enable daily 9:00 AM notifications';
      }
    }
  }

  function setRefreshSpinning(isSpinning) {
    const svg = elements.btnRefresh?.querySelector('svg');
    if (svg) {
      if (isSpinning) {
        svg.classList.add('spin');
      } else {
        svg.classList.remove('spin');
      }
    }
  }

  function updateLastUpdatedDisplay() {
    if (!elements.lastUpdatedText) return;
    if (!state.lastUpdated) {
      elements.lastUpdatedText.textContent = 'Last updated: --';
      return;
    }
    const timeStr = state.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.lastUpdatedText.textContent = `Last updated: ${timeStr}`;
  }

  function updateStatsDisplay(count) {
    if (elements.articleCount) {
      elements.articleCount.textContent = `${count} ${count === 1 ? 'article' : 'articles'}`;
    }
  }

  /**
   * 14. Relative Time Formatter
   */
  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffSeconds < 172800) return 'Yesterday';
    const days = Math.floor(diffSeconds / 86400);
    if (days <= 30) return `${days} days ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  /**
   * 15. Intelligent Category Detection
   */
  function detectCategory(text, defaultCategory = 'Cyber Security') {
    if (!text) return defaultCategory;
    const lower = text.toLowerCase();

    if (lower.includes('bounty') || lower.includes('hackerone') || lower.includes('bugcrowd') || lower.includes('writeup') || lower.includes('disclosed')) {
      return 'Bug Bounty';
    }
    if (lower.includes('cve-') || lower.includes('vulnerability') || lower.includes('zero-day') || lower.includes('0-day') || lower.includes('patch')) {
      return 'Vulnerabilities';
    }
    if (lower.includes('malware') || lower.includes('ransomware') || lower.includes('trojan') || lower.includes('botnet') || lower.includes('spyware')) {
      return 'Malware';
    }
    if (lower.includes('xss') || lower.includes('sqli') || lower.includes('csrf') || lower.includes('ssrf') || lower.includes('web security')) {
      return 'Web Security';
    }
    if (lower.includes('aws') || lower.includes('azure') || lower.includes('gcp') || lower.includes('cloud security') || lower.includes('kubernetes') || lower.includes('s3')) {
      return 'Cloud Security';
    }
    if (lower.includes('llm') || lower.includes('ai security') || lower.includes('prompt injection') || lower.includes('gpt')) {
      return 'AI Security';
    }
    if (lower.includes('tool') || lower.includes('github') || lower.includes('scanner') || lower.includes('nuclei') || lower.includes('burp')) {
      return 'Tools';
    }
    if (lower.includes('privacy') || lower.includes('gdpr') || lower.includes('surveillance') || lower.includes('tracking')) {
      return 'Privacy';
    }
    if (lower.includes('research') || lower.includes('analysis') || lower.includes('paper') || lower.includes('reverse engineering')) {
      return 'Research';
    }
    if (lower.includes('hack') || lower.includes('exploit') || lower.includes('breach') || lower.includes('phishing')) {
      return 'Hacking';
    }

    return defaultCategory;
  }

  /**
   * 16. Utility Helpers (Sanitization & Cleanup)
   */
  function normalizeUrlForDeduplication(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      // Strip common tracking parameters
      parsed.searchParams.delete('utm_source');
      parsed.searchParams.delete('utm_medium');
      parsed.searchParams.delete('utm_campaign');
      parsed.searchParams.delete('utm_term');
      parsed.searchParams.delete('utm_content');
      parsed.hash = '';
      let clean = parsed.toString();
      // Remove trailing slash
      if (clean.endsWith('/')) {
        clean = clean.slice(0, -1);
      }
      return clean;
    } catch (e) {
      return url.trim().toLowerCase();
    }
  }

  function cleanPlainText(raw) {
    if (!raw) return '';
    // Strip HTML tags using browser DOMParser
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const text = doc.body.textContent || '';
    // Collapse excess whitespace and newlines
    return text.replace(/\s+/g, ' ').trim();
  }

  function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str.trim();
  }

  function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('./')) {
      return trimmed;
    }
    return '#';
  }

  function extractImgFromHTML(htmlString) {
    if (!htmlString || typeof htmlString !== 'string') return null;
    const match = htmlString.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    return match ? match[1] : null;
  }

  function showToast(message, duration = 3000) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    // Trigger reflow to animate
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

  // Run on DOM Content Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
