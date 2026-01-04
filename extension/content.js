/**
 * Content Script - Runs on every web page
 * This script is injected into web pages and can interact with the DOM
 * You can extend this to add more functionality
 */

// Log when content script loads
console.log('Web Scraper Extension: Content script loaded on', window.location.href);

// Listen for messages from popup or background scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Handle different message types
    if (request.action === 'getPageData') {
        // Return basic page information
        const pageData = {
            url: window.location.href,
            title: document.title,
            readyState: document.readyState,
            loadTime: performance.now()
        };
        sendResponse(pageData);
    }
    
    if (request.action === 'highlightElement') {
        // Example: Highlight a specific element
        const element = document.querySelector(request.selector);
        if (element) {
            element.style.border = '3px solid red';
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Element not found' });
        }
    }
    
    if (request.action === 'getMetaTags') {
        // Extract meta tags
        const metaTags = Array.from(document.querySelectorAll('meta'))
            .map(meta => ({
                name: meta.name || meta.property,
                content: meta.content
            }))
            .filter(tag => tag.name);
        sendResponse({ metaTags });
    }
    
    // Return true to indicate async response
    return true;
});

// Optional: Monitor page changes (useful for dynamic content)
const observer = new MutationObserver((mutations) => {
    // You can handle DOM mutations here if needed
    // console.log('Page DOM changed', mutations.length, 'mutations');
});

// Start observing the document
// observer.observe(document.body, {
//     childList: true,
//     subtree: true
// });

// Optional: Add visual indicator that extension is active
function addExtensionIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'web-scraper-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #3498db;
        color: white;
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 999999;
        font-family: sans-serif;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        display: none;
    `;
    indicator.textContent = '🔍 Web Scraper Active';
    document.body.appendChild(indicator);
    
    // Show for 2 seconds then hide
    indicator.style.display = 'block';
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 2000);
}

// Add indicator when page loads
if (document.readyState === 'complete') {
    // Uncomment to show indicator
    // addExtensionIndicator();
} else {
    window.addEventListener('load', () => {
        // Uncomment to show indicator
        // addExtensionIndicator();
    });
}

// Helper function to extract structured data from page
function extractStructuredData() {
    const structuredData = [];
    
    // Look for JSON-LD structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach(script => {
        try {
            const data = JSON.parse(script.textContent);
            structuredData.push(data);
        } catch (e) {
            console.error('Error parsing JSON-LD:', e);
        }
    });
    
    return structuredData;
}

// Helper function to get page performance metrics
function getPageMetrics() {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
        return {
            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            responseTime: perfData.responseEnd - perfData.requestStart
        };
    }
    return null;
}

// Export functions for use by popup.js if needed
window.webScraperHelpers = {
    extractStructuredData,
    getPageMetrics
};