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

// Main function to fetch ORCID works
async function fetchOrcidWorks() {
    const container = document.getElementById('papers-container');
    container.innerHTML = '<p class="loading">Loading publications...</p>';

    // First, try the public API as it's the preferred method
    console.log("Attempting to fetch works via public API...");
    try {
        const apiUrl = `https://pub.orcid.org/v3.0/${ORCID_ID}/activities`;
        const apiResponse = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json',
                // 'User-Agent': 'YourAppName/1.0 (https://yourdomain.com/contact)' // Optional
            }
        });

        if (!apiResponse.ok) {
            // Log the status for debugging, but don't necessarily fail here if HTML fetch is the fallback
            console.warn(`ORCID API returned status: ${apiResponse.status} ${apiResponse.statusText}. Trying HTML fallback.`);
        } else {
            const apiData = await apiResponse.json();
            const apiWorksGroups = apiData['activities:works']?.['group'] || [];
            console.log("API returned", apiWorksGroups.length, "work groups.");
            if (apiWorksGroups.length > 0) {
                 console.log("Displaying works from API data.");
                 displayPapers(apiWorksGroups); // Use the existing display function for API data
                 return; // Exit successfully if API works
            } else {
                 console.warn("API call succeeded but returned 0 work groups.");
            }
        }
    } catch (apiError) {
         console.warn("ORCID API call failed or returned no data:", apiError.message);
         // Proceed to HTML fetch attempt
    }

    // If API fails or returns no works, attempt to fetch the HTML page
    console.log("Attempting to fetch ORCID profile HTML page...");
    try {
        // Construct the profile URL correctly - Fixed: Removed space
        const profileUrl = `https://orcid.org/${ORCID_ID}`;

        const response = await fetch(profileUrl, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' // Browser-like User-Agent
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText} when fetching ORCID profile HTML.`);
        }

        const htmlText = await response.text();
        console.log("Fetched ORCID HTML page, length:", htmlText.length);

        // Attempt to parse the HTML to find publication data embedded as JSON-LD
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // Look for JSON-LD scripts containing work information
        const worksData = extractWorksFromHtmlJsonLd(doc);

        if (worksData && worksData.length > 0) {
             console.log("Found", worksData.length, "works in JSON-LD.");
             displayPapersFromParsedData(worksData);
        } else {
             // If parsing the HTML fails, inform the user
             throw new Error("Could not extract publication data from the ORCID page HTML (no JSON-LD found or parsing failed). The profile might rely on JavaScript for content rendering, which this script cannot execute.");
        }

    } catch (htmlError) {
        console.error('Error fetching or parsing ORCID HTML:', htmlError);
        container.innerHTML = `<p class="error">Error loading publications: ${htmlError.message}<br>Could not retrieve data from ORCID API or profile page.</p>`;
    }
}

// Attempt to extract work information from the fetched HTML using JSON-LD
function extractWorksFromHtmlJsonLd(doc) {
    console.log("Attempting to find JSON-LD in HTML...");
    const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
    console.log("Found", scriptTags.length, "JSON-LD script tags.");
    for (const script of scriptTags) {
        try {
            const structuredData = JSON.parse(script.textContent);
            // console.log("Found JSON-LD:", structuredData); // Debug log
            // Check if it contains work-related data at the top level or within an array
            if (structuredData && Array.isArray(structuredData)) {
                 console.log("JSON-LD is an array, searching for works...");
                 const works = structuredData.filter(item =>
                     item['@type'] === 'ScholarlyArticle' ||
                     item['@type'] === 'CreativeWork' ||
                     item['@type'] === 'Dataset' || // Example of another type
                     item['@type'] === 'Thesis' ||
                     item['@type'] === 'Book' ||
                     item['@type'] === 'Chapter'
                 );
                 if (works.length > 0) {
                      console.log("Found works array in JSON-LD.");
                      return works; // Return the structured data objects
                 }
            } else if (structuredData && typeof structuredData === 'object') {
                 // Check if the root object itself is a work or contains works
                 // ORCID profiles might embed the entire profile or sections like 'works' as JSON-LD
                 console.log("JSON-LD is an object, checking for works...");
                 // Common patterns might be {"@type": "Person", "works": [...]} or similar
                 // Or the data might be nested differently.
                 // A common pattern for a list of works might be under a specific property or be the work itself.
                 // Check root level first
                 if (structuredData['@type'] === 'ScholarlyArticle' ||
                     structuredData['@type'] === 'CreativeWork' ||
                     structuredData['@type'] === 'Dataset' ||
                     structuredData['@type'] === 'Thesis' ||
                     structuredData['@type'] === 'Book' ||
                     structuredData['@type'] === 'Chapter') {
                      console.log("Found a single work object in JSON-LD root.");
                      return [structuredData]; // Wrap single object in array for consistency
                 }
                 // Check for nested 'works' or 'hasPublications' properties if common schema uses them
                 // This is more specific and might need adjustment based on ORCID's actual output
                 // For now, let's assume the array search above covers the likely case.
                 // If the whole profile is one JSON-LD object, the works might be in a specific sub-field not easily generalizable.
                 // More likely, the page has an array of works or individual script tags per work/group.
            }
        } catch (e) {
            console.warn("Could not parse JSON-LD script tag content:", e);
            console.log("Script content:", script.textContent.substring(0, 200) + "..."); // Log first 200 chars
            // Continue to next script tag if parsing fails
        }
    }
    console.warn("Could not find works using JSON-LD structured data.");
    return null; // Return null if nothing is found
}

// Display function for data extracted from HTML parsing (JSON-LD)
function displayPapersFromParsedData(worksDataArray) {
    const container = document.getElementById('papers-container');

    if (!worksDataArray || worksDataArray.length === 0) {
        container.innerHTML = '<p>No publications found in ORCID profile (parsed from HTML JSON-LD).</p>';
        return;
    }

    const papersHTML = worksDataArray.map(work => {
        // Handle data based on JSON-LD schema
        let title = work.name || work.headline || work.title || 'Untitled Work (JSON-LD)';
        // Handle author as string or array of Person/Organization objects
        let authors = '';
        if (work.author) {
             if (Array.isArray(work.author)) {
                 authors = work.author.map(a => typeof a === 'string' ? a : (a.name || a['@name'] || 'Unknown Author')).join(', ');
             } else {
                 authors = typeof work.author === 'string' ? work.author : (work.author.name || work.author['@name'] || 'Unknown Author');
             }
        }
        let date = work.datePublished || work.dateCreated || work.publicationDate || '';
        // Handle publisher or isPartOf (e.g., journal/book)
        let journal = '';
        if (work.isPartOf) {
             if (typeof work.isPartOf === 'string') {
                 journal = work.isPartOf;
             } else if (typeof work.isPartOf === 'object' && work.isPartOf.name) {
                 journal = work.isPartOf.name;
             }
        } else if (work.publisher) {
             if (typeof work.publisher === 'string') {
                 journal = work.publisher;
             } else if (typeof work.publisher === 'object' && work.publisher.name) {
                 journal = work.publisher.name;
             }
        }
        let url = work.url || work['@id'] || ''; // @id sometimes holds the canonical URL

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

// Original display function for API data (remains the same, can be used if API works)
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
        const title = firstWorkSummary['title']?.['title']?.value || 'Untitled Work (API)';
        const journalTitle = firstWorkSummary['journal-title']?.value || '';
        const publicationDate = firstWorkSummary['publication-date'];
        let dateStr = '';
        if (publicationDate) {
            const year = publicationDate.year?.value;
            const month = publicationDate.month?.value?.padStart(2, '0'); // Pad month with leading zero
            const day = publicationDate.day?.value?.padStart(2, '0'); // Pad day with leading zero
            // Join non-null parts with '-' to form YYYY-MM-DD or YYYY-MM or just YYYY
            dateStr = [year, month, day].filter(Boolean).join('-');
        }

        // Extract external IDs (like DOI, URL) - prioritize URL if available
        let externalUrl = '';
        const externalIds = firstWorkSummary['work-external-identifiers']?.['work-external-identifier'] || [];
        for (const id of externalIds) {
            const idType = id['work-external-identifier-type'];
            const idValue = id['work-external-identifier-id']?.value;
            if (idType === 'DOI' && idValue) {
                 // Construct the DOI URL - Fixed: Removed space
                 externalUrl = `https://doi.org/${idValue}`; // Fixed: Removed space
                 break; // Prefer DOI
            } else if (idType === 'URL' && idValue) {
                 externalUrl = idValue; // Fallback to URL
                 // Ensure it starts with http/https
                 if (!externalUrl.startsWith('http')) {
                     externalUrl = 'https://' + externalUrl;
                 }
            }
        }

        // Contributors (Authors) - Handle potential undefined contributors array
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
        container.innerHTML = '<p>No publication summaries found in ORCID profile data after processing (API).</p>';
    }
}


// --- Existing GitHub Functions ---

function fetchRepos() {
    const container = document.getElementById('repo-container');
    container.innerHTML = '<p>Loading repositories...</p>';

    // Using GitHub API to fetch repositories - Fixed: Removed trailing space
    fetch('https://api.github.com/users/TAUforPython/repos') // Fixed: Removed trailing space
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
    fetch('https://www.kaggle.com/denisandrikov') // Fixed: Removed trailing space if it existed
        .then(response => response.json())
        .then(data => {
            document.getElementById('competitionRank').textContent = data.competitionRank;
            document.getElementById('bestFinish').textContent = data.bestFinish;
            document.getElementById('datasetViews').textContent = data.datasetViews;
        })
        .catch(error => console.error('Error loading Kaggle stats:', error));
    */
}
