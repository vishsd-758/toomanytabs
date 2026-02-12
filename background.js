// Tab tracking state
let tabData = {};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Tracker installed');
  initializeTracking();
});

// Initialize tracking on startup
chrome.runtime.onStartup.addListener(() => {
  initializeTracking();
});

async function initializeTracking() {
  const result = await chrome.storage.local.get(['tabData']);
  tabData = result.tabData || {};
  
  // Track all currently open tabs
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    trackTab(tab);
  });
}

// Track new tab creation
chrome.tabs.onCreated.addListener((tab) => {
  trackTab(tab);
});

// Track tab updates (URL changes, title changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.title) {
    updateTab(tabId, tab, changeInfo);
  }
});

// Track tab activation (switching between tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  recordTabActivation(activeInfo.tabId, tab);
});

// Track tab closure
chrome.tabs.onRemoved.addListener((tabId) => {
  closeTab(tabId);
});

// Track navigation to capture search queries
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    captureSearchQuery(details.tabId, details.url);
  }
});

function trackTab(tab) {
  if (!tab.id || tab.id < 0) return;
  
  const now = Date.now();
  tabData[tab.id] = {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    openedAt: now,
    lastActivated: now,
    activationCount: 1,
    timeSpent: 0,
    searchQuery: extractSearchQuery(tab.url),
    referrer: null,
    history: [{
      timestamp: now,
      event: 'opened',
      url: tab.url,
      title: tab.title
    }]
  };
  
  saveTabData();
}

function updateTab(tabId, tab, changeInfo) {
  if (!tabData[tabId]) {
    trackTab(tab);
    return;
  }
  
  const now = Date.now();
  const entry = tabData[tabId];
  
  if (changeInfo.url) {
    entry.url = changeInfo.url;
    entry.searchQuery = extractSearchQuery(changeInfo.url);
  }
  
  if (changeInfo.title) {
    entry.title = changeInfo.title;
  }
  
  entry.history.push({
    timestamp: now,
    event: 'updated',
    url: entry.url,
    title: entry.title,
    changes: changeInfo
  });
  
  saveTabData();
}

function recordTabActivation(tabId, tab) {
  if (!tabData[tabId]) {
    trackTab(tab);
    return;
  }
  
  const now = Date.now();
  const entry = tabData[tabId];
  
  // Calculate time spent since last activation
  if (entry.lastActivated) {
    entry.timeSpent += now - entry.lastActivated;
  }
  
  entry.lastActivated = now;
  entry.activationCount++;
  
  entry.history.push({
    timestamp: now,
    event: 'activated'
  });
  
  saveTabData();
}

function closeTab(tabId) {
  if (!tabData[tabId]) return;
  
  const now = Date.now();
  const entry = tabData[tabId];
  
  // Calculate final time spent
  if (entry.lastActivated) {
    entry.timeSpent += now - entry.lastActivated;
  }
  
  entry.closedAt = now;
  entry.history.push({
    timestamp: now,
    event: 'closed'
  });
  
  // Move to closed tabs history
  moveToHistory(tabId);
}

function captureSearchQuery(tabId, url) {
  if (!tabData[tabId]) return;
  
  const searchQuery = extractSearchQuery(url);
  if (searchQuery) {
    tabData[tabId].searchQuery = searchQuery;
    tabData[tabId].history.push({
      timestamp: Date.now(),
      event: 'search',
      query: searchQuery
    });
    saveTabData();
  }
}

function extractSearchQuery(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Google
    if (urlObj.hostname.includes('google.com')) {
      return urlObj.searchParams.get('q');
    }
    
    // Bing
    if (urlObj.hostname.includes('bing.com')) {
      return urlObj.searchParams.get('q');
    }
    
    // DuckDuckGo
    if (urlObj.hostname.includes('duckduckgo.com')) {
      return urlObj.searchParams.get('q');
    }
    
    // Yahoo
    if (urlObj.hostname.includes('yahoo.com')) {
      return urlObj.searchParams.get('p');
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

async function moveToHistory(tabId) {
  const result = await chrome.storage.local.get(['tabHistory']);
  const tabHistory = result.tabHistory || [];
  
  tabHistory.push(tabData[tabId]);
  delete tabData[tabId];
  
  // Keep only last 1000 closed tabs
  if (tabHistory.length > 1000) {
    tabHistory.shift();
  }
  
  await chrome.storage.local.set({ tabHistory, tabData });
}

async function saveTabData() {
  await chrome.storage.local.set({ tabData });
}

// Message handler for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabData') {
    chrome.storage.local.get(['tabData', 'tabHistory'], (result) => {
      sendResponse({
        openTabs: result.tabData || {},
        closedTabs: result.tabHistory || []
      });
    });
    return true; // Keep channel open for async response
  }
});
