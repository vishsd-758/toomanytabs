let currentView = 'open';
let tabData = { openTabs: {}, closedTabs: [] };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTabData();
  setupEventListeners();
});

function setupEventListeners() {
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
      currentView = e.target.dataset.tab;
      updateActiveTab();
      renderTabs();
    });
  });
}

function updateActiveTab() {
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === currentView);
  });
}

async function loadTabData() {
  chrome.runtime.sendMessage({ action: 'getTabData' }, (response) => {
    tabData = response;
    renderStats();
    renderTabs();
  });
}

function renderStats() {
  const openCount = Object.keys(tabData.openTabs).length;
  const closedCount = tabData.closedTabs.length;
  
  let totalTimeSpent = 0;
  Object.values(tabData.openTabs).forEach(tab => {
    totalTimeSpent += tab.timeSpent || 0;
  });
  
  const statsHtml = `
    <div class="stat-card">
      <div class="stat-value">${openCount}</div>
      <div class="stat-label">Open Tabs</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${closedCount}</div>
      <div class="stat-label">Closed Tabs</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatTime(totalTimeSpent)}</div>
      <div class="stat-label">Time Spent</div>
    </div>
  `;
  
  document.getElementById('stats').innerHTML = statsHtml;
}

function renderTabs() {
  const container = document.getElementById('tabList');
  
  if (currentView === 'open') {
    const tabs = Object.values(tabData.openTabs);
    if (tabs.length === 0) {
      container.innerHTML = '<div class="empty-state">No open tabs tracked</div>';
      return;
    }
    
    // Sort by last activated
    tabs.sort((a, b) => b.lastActivated - a.lastActivated);
    
    container.innerHTML = tabs.map(tab => renderTabItem(tab)).join('');
  } else {
    const tabs = tabData.closedTabs;
    if (tabs.length === 0) {
      container.innerHTML = '<div class="empty-state">No closed tabs in history</div>';
      return;
    }
    
    // Sort by closed time (most recent first)
    tabs.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
    
    container.innerHTML = tabs.slice(0, 100).map(tab => renderTabItem(tab)).join('');
  }
}

function renderTabItem(tab) {
  const timeSpent = formatTime(tab.timeSpent || 0);
  const openedAt = new Date(tab.openedAt).toLocaleString();
  const closedAt = tab.closedAt ? new Date(tab.closedAt).toLocaleString() : null;
  
  return `
    <div class="tab-item">
      <div class="tab-title">${escapeHtml(tab.title || 'Untitled')}</div>
      <div class="tab-url">${escapeHtml(tab.url || '')}</div>
      ${tab.searchQuery ? `<div class="search-query">🔍 ${escapeHtml(tab.searchQuery)}</div>` : ''}
      <div class="tab-meta">
        <span>⏱️ ${timeSpent}</span>
        <span>🔄 ${tab.activationCount || 0} activations</span>
        <span>📅 ${closedAt ? 'Closed: ' + closedAt : 'Opened: ' + openedAt}</span>
      </div>
    </div>
  `;
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
