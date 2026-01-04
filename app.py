from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension

@app.route('/scrape', methods=['POST'])
def process_scraped_data():
    """
    Receives scraped data from Chrome extension and processes it
    Returns processed/analyzed results
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Process the scraped data
        processed = {
            'original_url': data.get('url'),
            'page_title': data.get('title'),
            'scraped_at': data.get('timestamp'),
            'processed_at': datetime.now().isoformat(),
            'summary': {}
        }
        
        # Process text content
        if 'text' in data:
            text = data['text']
            processed['summary']['text_stats'] = {
                'total_length': data.get('textLength', len(text)),
                'word_count': len(text.split()),
                'line_count': len(text.split('\n')),
                'preview': text[:200] + '...' if len(text) > 200 else text
            }
        
        # Process links
        if 'links' in data:
            links = data['links']
            processed['summary']['links_stats'] = {
                'total_count': data.get('linksCount', len(links)),
                'unique_domains': len(set(extract_domain(link['href']) for link in links)),
                'internal_links': sum(1 for link in links if data.get('url', '').split('/')[2] in link['href']),
                'external_links': sum(1 for link in links if data.get('url', '').split('/')[2] not in link['href'])
            }
            processed['links'] = links[:20]  # Return top 20 links
        
        # Process images
        if 'images' in data:
            images = data['images']
            processed['summary']['images_stats'] = {
                'total_count': data.get('imagesCount', len(images)),
                'with_alt_text': sum(1 for img in images if img.get('alt'))
            }
            processed['images'] = images[:15]  # Return top 15 images
        
        # Process headings
        if 'headings' in data:
            headings = data['headings']
            heading_counts = {}
            for h in headings:
                level = h['level']
                heading_counts[level] = heading_counts.get(level, 0) + 1
            
            processed['summary']['headings_stats'] = {
                'total_count': len(headings),
                'by_level': heading_counts
            }
            processed['headings'] = headings[:30]  # Return top 30 headings
        
        # Additional analysis
        processed['analysis'] = analyze_content(data)
        
        return jsonify(processed), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def extract_domain(url):
    """Extract domain from URL"""
    try:
        match = re.search(r'https?://([^/]+)', url)
        return match.group(1) if match else ''
    except:
        return ''


def analyze_content(data):
    """Perform additional analysis on scraped content"""
    analysis = {}
    
    # Analyze text for keywords (simple word frequency)
    if 'text' in data:
        text = data['text'].lower()
        words = re.findall(r'\b[a-z]{4,}\b', text)
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top 10 most common words
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        analysis['top_keywords'] = [{'word': w, 'count': c} for w, c in top_words]
    
    # Analyze link patterns
    if 'links' in data:
        links = data['links']
        domains = [extract_domain(link['href']) for link in links]
        domain_freq = {}
        for domain in domains:
            if domain:
                domain_freq[domain] = domain_freq.get(domain, 0) + 1
        
        top_domains = sorted(domain_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        analysis['top_linked_domains'] = [{'domain': d, 'count': c} for d, c in top_domains]
    
    return analysis


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200


if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5000")
    print("Make sure to install required packages: pip install flask flask-cors")
    app.run(debug=True, port=5000)