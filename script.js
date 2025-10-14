// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Load repositories
    fetchRepos();
    
    // Load Kaggle stats
    loadKaggleStats();

    // Load ORCID publications
    fetchOrcidWorks();
    
    // Set footer date
    document.getElementById('footerDate').textContent = new Date().toLocaleDateString();
    
    // Set last update time
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
});

// --- ORCID Functions ---

// Use the provided ORCID ID
const ORCID_ID = '0000-0003-0359-0897';

async function fetchOrcidWorks() {

    const container = document.getElementById('papers-container');
    container.innerHTML = '<p class="loading">Loading publications...</p>';

    try {
        // Attempt to fetch the public ORCID page HTML
        // This is a workaround if the direct API call fails due to CORS
        const pageUrl = `https://orcid.org/${ORCID_ID}`;
        const response = await fetch(pageUrl);

        if (!response.ok) {
            throw new Error(`ORCID Page Error: ${response.status} ${response.statusText}`);
        }

        const htmlText = await response.text();
        
        // Attempt to parse the HTML to find publication data
        // This is fragile and might break if ORCID changes their HTML structure
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // Look for elements that might contain work information
        // ORCID pages often use structured data or specific classes
        const worksData = extractWorksFromHtml(doc);

        if (worksData && worksData.length > 0) {
             displayPapersFromParsedData(worksData);
        } else {
             // If parsing the HTML fails, inform the user
             throw new Error("Could not extract publication data from the ORCID page.");
        }

    } catch (error) {
        console.error('Error fetching ORCID works:', error);
        // Fallback: Try the original API method if HTML parsing failed
        console.log("Attempting fallback API call...");
        try {
            await fetchOrcidWorksApi();
        } catch (apiError) {
            console.error('Both HTML parsing and API call failed:', apiError);
            document.getElementById('papers-container').innerHTML = 
                `<p class="error">Error loading publications: ${apiError.message}<br>Please check your ORCID ID or try again later.</p>`;
        }
    }
}

// Fallback API call function
async function fetchOrcidWorksApi() {
    const response = await fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/activities`, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; ORCID-Display-Script/1.0)'
        }
    });

    if (!response.ok) {
        throw new Error(`ORCID API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const worksGroups = data['activities:works']?.['group'] || [];
    displayPapers(worksGroups); // Use the original display function for API data
}

// Attempt to extract work information from the fetched HTML
function extractWorksFromHtml(doc) {
    // This is a heuristic attempt and might need adjustment based on ORCID's actual HTML
    // Look for elements that might represent works (often divs with specific roles or classes)
    const workElements = doc.querySelectorAll('[data-test="work"]');
    if (workElements.length > 0) {
        console.log("Found works via [data-test='work'] selector");
        return Array.from(workElements).map(el => {
            // Try to find title, authors, date, etc. within each element
            const titleEl = el.querySelector('[data-test="title"]');
            const authorsEl = el.querySelector('[data-test="author"]');
            const dateEl = el.querySelector('[data-test="date"]');
            const journalEl = el.querySelector('[data-test="journal"]');
            const linkEl = el.querySelector('a'); // Might be the title link or an external link

            return {
                title: titleEl ? titleEl.textContent.trim() : 'Untitled Work',
                authors: authorsEl ? authorsEl.textContent.trim() : '',
                date: dateEl ? dateEl.textContent.trim() : '',
                journal: journalEl ? journalEl.textContent.trim() : '',
                url: linkEl ? linkEl.href : ''
            };
        });
    }

    // Alternative: Look for structured data in <script> tags (JSON-LD)
    const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scriptTags) {
        try {
            const structuredData = JSON.parse(script.textContent);
            // Check if it contains work-related data
            if (structuredData && Array.isArray(structuredData)) {
                 const works = structuredData.filter(item => 
                     item['@type'] === 'ScholarlyArticle' || 
                     item['@type'] === 'CreativeWork' ||
                     item['@type'] === 'PublicationIssue' // Sometimes used
                 );
                 if (works.length > 0) {
                      console.log("Found works in JSON-LD structured data");
                      return works; // Return the structured data objects
                 }
            }
        } catch (e) {
            console.warn("Could not parse structured data script:", e);
            // Continue to next script tag if parsing fails
        }
    }

    // If no specific selectors work, try a general search for elements that look like works
    // This is very fragile
    const genericWorkSelectors = [
        'div.work', 'section.work', 'li.work', 
        '.orcid-works li', '.work-item', '.result-item'
    ];
    for (const selector of genericWorkSelectors) {
        const genericElements = doc.querySelectorAll(selector);
        if (genericElements.length > 0) {
             console.log(`Found potential works via generic selector: ${selector}`);
             // For generic elements, we'd need a more complex parsing logic
             // which is difficult without knowing the exact structure beforehand.
             // This is a basic example assuming a title might be an h3 or h4.
             return Array.from(genericElements).map(el => {
                 const titleEl = el.querySelector('h3, h4, .title, [data-title]');
                 return {
                     title: titleEl ? titleEl.textContent.trim() : 'Untitled Work (Generic)',
                     authors: '',
                     date: '',
                     journal: '',
                     url: '' // Would need to find a link within the element
                 };
             });
        }
    }

    console.warn("Could not find works using common selectors or structured data.");
    return null; // Return null if nothing is found
}


// Display function for data extracted from HTML parsing
function displayPapersFromParsedData(worksDataArray) {
    const container = document.getElementById('papers-container');
    
    if (!worksDataArray || worksDataArray.length === 0) {
        container.innerHTML = '<p>No publications found in ORCID profile (parsed from HTML).</p>';
        return;
    }

    const papersHTML = worksDataArray.map(work => {
        // Handle data based on its source (API object vs. parsed HTML object vs. JSON-LD)
        let title = 'Untitled Work';
        let authors = '';
        let date = '';
        let journal = '';
        let url = '';

        if (work['@type']) { // Likely JSON-LD
            title = work.name || work.headline || work.title || title;
            authors = Array.isArray(work.author) 
                ? work.author.map(a => a.name || a).join(', ') 
                : (work.author?.name || work.author || authors);
            date = work.datePublished || work.dateCreated || date;
            journal = work.isPartOf?.name || work.inDefinedTermSet || journal;
            url = work.url || url;
        } else { // Likely parsed HTML object
            title = work.title || title;
            authors = work.authors || authors;
            date = work.date || date;
            journal = work.journal || journal;
            url = work.url || url;
        }

        return `
            <div class="paper-item">
                <div class="paper-title">
                    ${url ? `<a href="${url}" target="_blank">${title}</a>` : title}
                </div>
                ${authors ? `<div class="paper-authors">${authors}</div>` : ''}
                ${journal || date ? `<div class="paper-details">${journal}${journal && date ? ' | ' : ''}${date}</div>` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = papersHTML;
}

// Original display function for API data (remains the same)
function displayPapers(worksGroupsArray) {
    const container = document.getElementById('papers-container');
    
    if (!worksGroupsArray || worksGroupsArray.length === 0) {
        container.innerHTML = '<p>No publications found in ORCID profile (API).</p>';
        return;
    }

    // Process the works groups to extract summary information for display
    const papersHTML = worksGroupsArray.map(group => {
        // Each group contains multiple works, often representing different versions or sources
        // We'll take the summary of the first work in the group for display
        const firstWorkSummary = group['work-summary']?.[0]; 
        if (!firstWorkSummary) return ''; // Skip if no summary found

        // Extract details from the summary object
        const title = firstWorkSummary['title']?.['title']?.value || 'Untitled Work';
        const journalTitle = firstWorkSummary['journal-title']?.value || '';
        const publicationDate = firstWorkSummary['publication-date'];
        let dateStr = '';
        if (publicationDate) {
            const year = publicationDate.year?.value;
            const month = publicationDate.month?.value?.padStart(2, '0'); // Pad month with leading zero
            const day = publicationDate.day?.value?.padStart(2, '0'); // Pad day with leading zero
            dateStr = [year, month, day].filter(Boolean).join('-'); // Join non-null parts with '-'
        }
        
        // Extract external IDs (like DOI, URL) - prioritize URL if available
        let externalUrl = '';
        const externalIds = firstWorkSummary['work-external-identifiers']?.['work-external-identifier'] || [];
        for (const id of externalIds) {
            const idType = id['work-external-identifier-type'];
            const idValue = id['work-external-identifier-id']?.value;
            if (idType === 'DOI' && idValue) {
                 externalUrl = `https://doi.org/${idValue}`;
                 break; // Prefer DOI
            } else if (idType === 'URL' && idValue) {
                 externalUrl = idValue; // Fallback to URL
                 // Ensure it starts with http/https
                 if (!externalUrl.startsWith('http')) {
                     externalUrl = 'https://' + externalUrl;
                 }
            }
        }
        
        // Contributors (Authors)
        const contributors = firstWorkSummary['contributors']?.['contributor'] || [];
        const authors = contributors
            .map(c => c['credit-name']?.value || 'Unknown Author')
            .join(', ');

        return `
            <div class="paper-item">
                <div class="paper-title">
                    ${externalUrl ? `<a href="${externalUrl}" target="_blank">${title}</a>` : title}
                </div>
                ${authors ? `<div class="paper-authors">${authors}</div>` : ''}
                ${journalTitle || dateStr ? `<div class="paper-details">${journalTitle}${journalTitle && dateStr ? ' | ' : ''}${dateStr}</div>` : ''}
            </div>
        `;
    }).filter(html => html !== '').join(''); // Filter out any empty strings generated by skipped groups
    
    if (papersHTML) {
        container.innerHTML = papersHTML;
    } else {
        container.innerHTML = '<p>No publication summaries found in ORCID profile (API).</p>';
    }
}


// --- Existing GitHub Functions ---

function fetchRepos() {
    const container = document.getElementById('repo-container');
    container.innerHTML = '<p>Loading repositories...</p>';
    
    // Using GitHub API to fetch repositories
    fetch('https://api.github.com/users/TAUforPython/repos')
        .then(response => response.json())
        .then(repos => {
            container.innerHTML = '';
            repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                 .forEach(repo => createRepoCard(repo, container));
        })
        .catch(error => {
            console.error('Error fetching repositories:', error);
            container.innerHTML = '<p>Error loading repositories. Please try again later.</p>';
        });
}

function createRepoCard(repo, container) {
    const card = document.createElement('div');
    card.className = 'repo-card';
    
    card.innerHTML = `
        <h3>${repo.name}</h3>
        <p>${repo.description || 'No description provided'}</p>
        <div class="repo-stats">
            <div class="stat">
                <i>⭐</i>
                <span>${repo.stargazers_count} stars</span>
            </div>
            <div class="stat">
                <i>🍴</i>
                <span>${repo.forks_count} forks</span>
            </div>
            <div class="stat">
                <i>📅</i>
                <span>Updated: ${new Date(repo.updated_at).toLocaleDateString()}</span>
            </div>
            <div class="stat">
                <i>📝</i>
                <span>${repo.language || 'Not specified'}</span>
            </div>
        </div>
        <a href="${repo.html_url}" target="_blank" class="btn">View Repository</a>
    `;
    
    container.appendChild(card);
}

function loadKaggleStats() {
    // In a real implementation, this would fetch from Kaggle API
    // For now, we'll use placeholder data
    /*
    document.getElementById('competitionRank').textContent = 'Top 10%';
    document.getElementById('bestFinish').textContent = '#12 in competition';
    document.getElementById('competitionPoints').textContent = '2,450';
    document.getElementById('datasetsCount').textContent = '8';
    document.getElementById('datasetViews').textContent = '12.5K';
    document.getElementById('notebooksCount').textContent = '15';
    document.getElementById('notebookViews').textContent = '45.2K';
    */

    /*
    fetch('https://www.kaggle.com/denisandrikov')
        .then(response => response.json())
        .then(data => {
            document.getElementById('competitionRank').textContent = data.competitionRank;
            document.getElementById('bestFinish').textContent = data.bestFinish;
            document.getElementById('datasetViews').textContent = data.datasetViews;
        })
        .catch(error => console.error('Error loading Kaggle stats:', error));
    */
}
