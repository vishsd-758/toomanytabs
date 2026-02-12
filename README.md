# Tab Tracker Browser Extension

A cross-browser extension that automatically tracks open tabs, search queries, and usage patterns.

## Features

- **Automatic Tracking**: Monitors all tabs in the background
- **Search Query Detection**: Captures search queries from Google, Bing, DuckDuckGo, and Yahoo
- **Usage Analytics**: Tracks time spent, activation count, and tab history
- **Cross-Browser**: Works on Chrome, Edge, Firefox, and other Chromium-based browsers
- **Privacy-First**: All data stored locally in your browser

## Installation

### Chrome/Edge/Brave

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file

## Usage

Once installed, the extension automatically tracks:

- **Tab Opens**: When and how tabs are created
- **URL Changes**: Navigation within tabs
- **Search Queries**: Queries from major search engines
- **Time Spent**: Active time on each tab
- **Activation Count**: How many times you switch to each tab

Click the extension icon to view:
- Currently open tabs with stats
- Closed tab history (last 1000 tabs)
- Overall usage statistics

## Data Tracked

For each tab:
- URL and title
- Time opened/closed
- Total time spent (active time)
- Number of activations (tab switches)
- Search query that led to opening
- Complete history of events

## Privacy

All data is stored locally using Chrome's storage API. Nothing is sent to external servers.

## Development

Files:
- `manifest.json` - Extension configuration
- `background.js` - Background service worker for tracking
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic and rendering

## Future Enhancements

- Export data to CSV/JSON
- Advanced filtering and search
- Tag/categorize tabs
- Productivity insights
- Session management
