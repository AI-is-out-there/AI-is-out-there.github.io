// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Load repositories
    fetchRepos();

    // Load Kaggle stats
    loadKaggleStats();

    // Load ORCID publications by fetching and parsing the public HTML page
    fetchOrcidWorksFromHtml();

    // Set footer date
    document.getElementById('footerDate').textContent = new Date().toLocaleDateString();

    // Set last update time
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
});

// --- ORCID Functions ---

// Use the provided ORCID ID
const ORCID_ID = '0000-0003-0359-0897';

// Main function to fetch ORCID works by parsing the public HTML page
async function fetchOrcidWorksFromHtml() {
    const container = document.getElementById('papers-container');
    container.innerHTML = '<p class="loading">Loading publications...</p>';

    try {
        // Construct the public ORCID profile URL
        const profileUrl = `https://orcid.org/${ORCID_ID}`;

        const response = await fetch(profileUrl);
        if (!response.ok) {
            throw new Error(`Error fetching ORCID profile page: ${response.status} ${response.statusText}`);
        }

        const htmlText = await response.text();
        // console.log("Fetched ORCID HTML:", htmlText); // Optional: Log HTML for debugging

        // Parse the HTML text
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // Attempt to find structured data (JSON-LD) within <script> tags
        const worksData = extractWorksFromJsonLd(doc);

        if (worksData && worksData.length > 0) {
            console.log("Found works data in JSON-LD:", worksData); // Debug log
            displayPapersFromParsedData(worksData);
        } else {
            // If JSON-LD parsing fails, inform the user
            throw new Error("Could not extract publication data from the ORCID page HTML (no JSON-LD found or parsing failed).");
        }

    } catch (error) {
        console.error('Error fetching or parsing ORCID works:', error);
        container.innerHTML = `<p class="error">Error loading publications: ${error.message}</p>`;
    }
}

// Attempt to extract work information from JSON-LD scripts embedded in the HTML
function extractWorksFromJsonLd(doc) {
    const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scriptTags) {
        try {
            const data = JSON.parse(script.textContent);
            console.log("Found JSON-LD script:", data); // Debug log

            // ORCID pages often embed structured data. Look for works related to the person.
            // The structure can vary, but often the top level is a Person object with 'works' or 'hasPublications'.
            // Works might also be directly in an array at the top level or nested.
            // Schema.org vocabulary is used [[1]].
            if (Array.isArray(data)) {
                 // Check if the array contains work objects
                 const works = data.filter(item =>
                     item['@type'] === 'ScholarlyArticle' ||
                     item['@type'] === 'CreativeWork' ||
                     item['@type'] === 'Thesis' ||
                     item['@type'] === 'Book' ||
                     item['@type'] === 'Chapter' ||
                     item['@type'] === 'Dataset' ||
                     item['@type'] === 'Poster' ||
                     item['@type'] === 'Presentation' ||
                     item['@type'] === 'SoftwareSourceCode' ||
                     item['@type'] === 'ConferenceProceedings' ||
                     item['@type'] === 'Report' ||
                     item['@type'] === 'Review' ||
                     item['@type'] === 'Preprint' ||
                     // Add other relevant types as needed
                     (item['@type'] && item['@type'].includes('Publication')) // General catch for publication types
                 );
                 if (works.length > 0) {
                      console.log("Found works in JSON-LD array");
                      return works;
                 }
            } else if (data['@type'] === 'Person' || data['@type'] === 'Organization') {
                 // Check if it's a Person/Organization object and has works
                 const works = data.hasPublications || data.works || data.about?.works; // Common property names for works
                 if (works && Array.isArray(works)) {
                      console.log("Found works linked from Person/Organization JSON-LD");
                      return works;
                 }
            }
            // Check the root object itself if it's a single work
            else if (data['@type'] && (
                     data['@type'] === 'ScholarlyArticle' ||
                     data['@type'] === 'CreativeWork' ||
                     data['@type'] === 'Thesis' ||
                     // ... other types
                     data['@type'].includes('Publication')
                 )) {
                 console.log("Found single work in JSON-LD root");
                 return [data]; // Return as an array for consistency
            }

        } catch (e) {
            console.warn("Could not parse JSON-LD script:", e);
            // Continue to next script tag if parsing fails
        }
    }

    console.warn("Could not find works using JSON-LD structured data.");
    return null; // Return null if no structured data containing works is found
}


// Display function for data extracted from HTML parsing (specifically JSON-LD)
function displayPapersFromParsedData(worksDataArray) {
    const container = document.getElementById('papers-container');

    if (!worksDataArray || worksDataArray.length === 0) {
        container.innerHTML = '<p>No publications found in ORCID profile (parsed from HTML JSON-LD).</p>';
        return;
    }

    const papersHTML = worksDataArray.map(work => {
        // Handle data based on its source (JSON-LD object structure)
        let title = work.name || work.headline || work.title || 'Untitled Work';
        let authors = '';
        let date = work.datePublished || work.dateCreated || work.publicationDate || work.date || '';
        let journal = work.isPartOf?.name || work.isPartOf?.headline || work.inDefinedTermSet || work.containerTitle || '';
        let url = work.url || '';

        // Handle authors/contributors which might be an array of objects or strings
        if (work.author) {
            if (Array.isArray(work.author)) {
                 authors = work.author.map(a => a.name || a).join(', ');
            } else if (typeof work.author === 'object' && work.author.name) {
                 authors = work.author.name;
            } else if (typeof work.author === 'string') {
                 authors = work.author;
            }
        } else if (work.contributor) { // Check for contributor as well
             if (Array.isArray(work.contributor)) {
                 authors = work.contributor.map(c => c.name || c).join(', ');
             } else if (typeof work.contributor === 'object' && work.contributor.name) {
                 authors = work.contributor.name;
             } else if (typeof work.contributor === 'string') {
                 authors = work.contributor;
             }
        }

        // Fallback if authors is still empty, check for a simple creator field
        if (!authors && work.creator) {
             if (Array.isArray(work.creator)) {
                 authors = work.creator.map(c => c.name || c).join(', ');
             } else {
                 authors = typeof work.creator === 'object' ? work.creator.name || work.creator : work.creator;
             }
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


// --- Existing GitHub Functions ---

function fetchRepos() {
    const container = document.getElementById('repo-container');
    container.innerHTML = '<p>Loading repositories...</p>';

    // Using GitHub API to fetch repositories
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
