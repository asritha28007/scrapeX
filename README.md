# Web Scraper Chrome Extension

A Chrome extension that scrapes web pages and processes data through a Flask backend.

## Features

-  Extract text content, links, images, and headings from any webpage
- Process and analyze scraped data via Flask API
- Download results as JSON
-  Clean, modern UI

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install flask flask-cors
python app.py
```

Backend runs on `http://localhost:5000`

### 2. Load Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

### 3. Use It

1. Navigate to any website
2. Click the extension icon
3. Select scraping options
4. Click "Scrape Current Page"
5. View results and download if needed

## Project Structure

```
web-scraper-extension/
├── extension/
│   ├── manifest.json      # Extension configuration
│   ├── popup.html         # UI
│   ├── popup.js           # Main logic
│   ├── content.js         # Content script
│   └── styles.css         # Styling
└── backend/
    └── app.py             # Flask API
```

## API Endpoint

```
POST /scrape
Content-Type: application/json

{
  "url": "https://example.com",
  "title": "Page Title",
  "text": "Page content...",
  "links": [...],
  "images": [...],
  "headings": [...]
}
```

## Requirements

- Python 3.7+
- Chrome Browser
- Flask & Flask-CORS

