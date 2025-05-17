const fs = require('fs');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const https = require('https');

// Fetch HTML from a URL using node-fetch
const fetchHTMLFromURL = async (url) => {
  console.log(`Starting fetch from URL: ${url}`);
  try {
    // Create a custom agent to ignore SSL errors (for development only)
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    
    console.log('Before fetch call');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      agent,
      timeout: 30000 // 30 second timeout
    });
    console.log('After fetch call');
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`Response HTML length: ${html.length}`);
    return html;
  } catch (err) {
    console.error(`Error fetching URL: ${err}`);
    return null;
  }
};

// Read HTML from a file
const readHTMLFromFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading file: ${err}`);
    return null;
  }
};

// Parse CVPR papers from HTML
const parseCVPRPapers = (html) => {
  console.log('Starting to parse HTML');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Debug document structure
  console.log('Document title:', document.title);
  console.log('Tables found:', document.querySelectorAll('table').length);
  
  const papers = [];
  const rows = document.querySelectorAll('table tr');
  console.log(`Found ${rows.length} table rows`);
  
  // Skip header rows
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    
    if (cells.length < 3) continue;
    
    // Extract paper title and URL
    let title = '';
    let url = '';
    
    const titleElement = cells[0].querySelector('strong');
    const linkElement = cells[0].querySelector('a');
    
    if (linkElement) {
      title = linkElement.textContent.trim();
      url = linkElement.getAttribute('href');
    } else if (titleElement) {
      title = titleElement.textContent.trim();
    } else {
      continue; // Skip if no title found
    }
    
    // Extract poster session
    const cellText = cells[0].textContent;
    const posterSessionMatch = cellText.match(/Poster Session (\d+)/);
    const posterSession = posterSessionMatch ? posterSessionMatch[0] : '';
    
    // Extract authors
    const authorElement = cells[0].querySelector('.indented i');
    const authors = authorElement ? authorElement.textContent.trim().replace(/\s+·\s+/g, ', ').replace(/\s+/g, ' ') : '';
    
    // Extract location and poster number
    const locationCell = cells[2];
    const locationText = locationCell.textContent.trim().replace(/\s+/g, ' ');
    const location = locationText.split('Poster #')[0].trim();
    const posterMatch = locationText.match(/Poster #(\d+)/);
    const posterNumber = posterMatch ? posterMatch[1] : '';
    
    papers.push({
      title,
      authors,
      posterSession,
      location,
      posterNumber,
      url
    });
  }
  
  return papers;
};

// Convert papers to CSV
const convertToCSV = (papers) => {
  // CSV header
  let csv = 'Title,Authors,Poster Session,Location,URL\n';
  
  // Add each paper as a CSV row
  papers.forEach(paper => {
    // Escape commas and quotes in fields
    const escapedTitle = `"${paper.title.replace(/"/g, '""')}"`;
    const escapedAuthors = `"${paper.authors.replace(/"/g, '""')}"`;
    
    // Combine location and poster number
    const combinedLocation = paper.posterNumber ? `${paper.location} Poster #${paper.posterNumber}` : paper.location;
    
    csv += `${escapedTitle},${escapedAuthors},${paper.posterSession},${combinedLocation},${paper.url}\n`;
  });
  
  return csv;
};

// Main function
const main = async () => {
  const defaultURL = 'https://cvpr.thecvf.com/Conferences/2025/AcceptedPapers';
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];
  
  let html;
  let outputFile;
  
  // Check if the first argument is a URL or a file
  if (!arg1) {
    // No arguments provided, use default URL
    console.log(`No input provided. Using default URL: ${defaultURL}`);
    html = await fetchHTMLFromURL(defaultURL);
    outputFile = 'cvpr_papers.csv';
  } else if (arg1.startsWith('http://') || arg1.startsWith('https://')) {
    // URL provided
    console.log(`Fetching from URL: ${arg1}`);
    html = await fetchHTMLFromURL(arg1);
    outputFile = arg2 || 'cvpr_papers.csv';
  } else {
    // File path provided
    console.log(`Reading from file: ${arg1}`);
    html = readHTMLFromFile(arg1);
    console.log(`HTML content length from file: ${html ? html.length : 'null'}`);
    outputFile = arg2 || 'cvpr_papers.csv';
  }
  
  if (!html) {
    console.error('Failed to retrieve HTML content');
    process.exit(1);
  }
  
  const papers = parseCVPRPapers(html);
  const csv = convertToCSV(papers);
  
  try {
    fs.writeFileSync(outputFile, csv);
    console.log(`Successfully parsed ${papers.length} papers to ${outputFile}`);
  } catch (err) {
    console.error(`Error writing CSV file: ${err}`);
  }
};

main().catch(err => {
  console.error('An error occurred:', err);
  process.exit(1);
});