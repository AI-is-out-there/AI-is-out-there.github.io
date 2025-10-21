// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Load repositories
    fetchRepos();

    // Load Kaggle stats
    loadKaggleStats();

    // Load ORCID publications
    fetchOrcidWorks(); // Now calls the API directly

    // Set footer date
    document.getElementById('footerDate').textContent = new Date().toLocaleDateString();

    // Set last update time
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
});

// --- ORCID Functions ---

// Use the provided ORCID ID
const ORCID_ID = '0000-0003-0359-0897'; // Fixed: Removed spaces

// Main function to fetch ORCID works using the API
async function fetchOrcidWorks() {
    const container = document.getElementById('papers-container');
    container.innerHTML = '<p class="loading">Loading publications...</p>';

    try {
        // Construct the API URL correctly - Fixed: Removed space
        const apiUrl = `https://pub.orcid.org/v3.0/${ORCID_ID}/activities`; // Fixed: Removed space

        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json',
                // 'User-Agent': 'Mozilla/5.0 (compatible; ORCID-Display-Script/1.0)' // Optional but good practice
            }
        });

        if (!response.ok) {
            // Handle potential HTTP errors (4xx, 5xx)
            if (response.status === 404) {
                 throw new Error(`ORCID record or activities not found for ID: ${ORCID_ID}`);
            } else if (response.status === 401 || response.status === 403) {
                 throw new Error('Access to ORCID data denied (Private/Restricted).');
            } else {
                 throw new Error(`ORCID API Error: ${response.status} ${response.statusText}`);
            }
        }

        const data = await response.json();
        // console.log("Fetched ORCID Data:", data); // Optional: Log the raw data for debugging

        const worksGroups = data['activities:works']?.['group'] || [];
        displayPapers(worksGroups); // Pass data to the display function

    } catch (error) {
        console.error('Error fetching ORCID works:', error);
        container.innerHTML = `<p class="error">Error loading publications: ${error.message}</p>`;
    }
}


// Display function for data fetched from the ORCID API (v3.0)
function displayPapers(worksGroupsArray) {
    const container = document.getElementById('papers-container');

    if (!worksGroupsArray || worksGroupsArray.length === 0) {
        container.innerHTML = '<p>No publications found in ORCID profile.</p>';
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
        container.innerHTML = '<p>No publication summaries found in ORCID profile.</p>';
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
