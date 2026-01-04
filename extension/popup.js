const FLASK_API_URL = 'http://localhost:5000/scrape';

let scrapedData = null;

document.getElementById('scrapeBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const results = document.getElementById('results');
    const resultContent = document.getElementById('resultContent');
    const downloadBtn = document.getElementById('downloadBtn');

    status.textContent = 'Scraping page...';
    status.className = 'status loading';
    results.classList.remove('show');
    downloadBtn.style.display = 'none';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const options = {
            scrapeText: document.getElementById('scrapeText').checked,
            scrapeLinks: document.getElementById('scrapeLinks').checked,
            scrapeImages: document.getElementById('scrapeImages').checked,
            scrapeHeadings: document.getElementById('scrapeHeadings').checked
        };

        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrapePageContent,
            args: [options]
        });

        const scraped = result.result;

        status.textContent = 'Sending to Flask backend...';

        const response = await fetch(FLASK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scraped)
        });

        if (!response.ok) {
            throw new Error('Failed to process data');
        }

        const processedData = await response.json();
        scrapedData = processedData;

        status.textContent = 'Success! Data processed.';
        status.className = 'status success';

        resultContent.textContent = JSON.stringify(processedData, null, 2);
        results.classList.add('show');
        downloadBtn.style.display = 'block';

    } catch (err) {
        status.textContent = `Error: ${err.message}`;
        status.className = 'status error';
        console.error('Scraping error:', err);
    }
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!scrapedData) return;

    const blob = new Blob([JSON.stringify(scrapedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scraped-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

function scrapePageContent(opts) {
    const data = {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString()
    };

    if (opts.scrapeText) {
        const bodyText = document.body.innerText || document.body.textContent;
        data.text = bodyText.substring(0, 5000);
        data.textLength = bodyText.length;
    }

    if (opts.scrapeLinks) {
        const links = Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({
                text: a.textContent.trim(),
                href: a.href
            }))
            .filter(link => link.href && link.href.startsWith('http'));
        data.links = links.slice(0, 100);
        data.linksCount = links.length;
    }

    if (opts.scrapeImages) {
        const images = Array.from(document.querySelectorAll('img[src]'))
            .map(img => ({
                src: img.src,
                alt: img.alt || ''
            }));
        data.images = images.slice(0, 50);
        data.imagesCount = images.length;
    }

    if (opts.scrapeHeadings) {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .map(h => ({
                level: h.tagName,
                text: h.textContent.trim()
            }));
        data.headings = headings;
    }

    return data;
}