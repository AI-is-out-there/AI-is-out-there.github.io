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

// Main function to fetch ORCID works using the Public Record XML API


/********************************************************************
 *  ORCID – clean API-only fetcher
 *  Endpoint: https://pub.orcid.org/v3.0/{ORCID}/activities
 *  No HTML scraping, no BibTeX, no CORS proxy, no API key
 ********************************************************************/
const ORCID_ID = '0000-0003-0359-0897';

async function fetchOrcidWorks() {
  const box = document.getElementById('papers-container');
  box.innerHTML = '<p class="loading">Loading publications…</p>';

  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/activities`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`ORCID API ${res.status} – ${res.statusText}`);

    const data = await res.json();
    const groups = data?.['activities:works']?.group ?? [];
    if (!groups.length) { box.innerHTML = '<p>No publications found.</p>'; return; }

    /* ---- flatten groups into readable cards ---- */
    const html = groups.map(g => {
      const s = g['work-summary']?.[0];
      if (!s) return '';

      const title = s['title']?.['title']?.value || 'Untitled';
      const journal = s['journal-title']?.value || '';
      const date  = [
        s['publication-date']?.year?.value,
        s['publication-date']?.month?.value?.padStart(2,'0'),
        s['publication-date']?.day?.value?.padStart(2,'0')
      ].filter(Boolean).join('-');

      // pick first DOI or URL external-id
      let url = '';
      const ids = s['work-external-identifiers']?.['work-external-identifier'] ?? [];
      for (const id of ids) {
        const type = id['work-external-identifier-type']?.toLowerCase();
        const val  = id['work-external-identifier-id']?.value;
        if (!val) continue;
        if (type === 'doi') { url = `https://doi.org/${val}`; break; }
        if (type === 'url') { url = val.startsWith('http') ? val : `https://${val}`; }
      }

      const authors = (s['contributors']?.['contributor'] ?? [])
                      .map(c => c['credit-name']?.value || 'Unknown')
                      .join(', ');

      return `
        <div class="paper-item">
          <div class="paper-title">
            ${url ? `<a href="${url}" target="_blank" rel="noopener">${title}</a>` : title}
          </div>
          ${authors ? `<div class="paper-authors">${authors}</div>` : ''}
          ${journal || date ? `<div class="paper-details">${journal}${journal && date ? ' | ' : ''}${date}</div>` : ''}
        </div>`;
    }).filter(Boolean).join('');

    box.innerHTML = html || '<p>No displayable publications found.</p>';

  } catch (err) {
    console.error(err);
    box.innerHTML = `<p class="error">Error loading publications: ${err.message}</p>`;
  }
}


// Function to extract work information from the ORCID XML document
function extractWorksFromXml(xmlDoc) {
    console.log("Parsing XML for works..."); // Debug log
    const works = [];

    // Find all 'work:work' elements within the activities section
    // The full record XML has a structure like:
    // <activities:activities-summary> -> <activities:works> -> <work:work-group> -> <work:work>
    const workElements = xmlDoc.querySelectorAll('work\\:work, work:work'); // Handle escaped colon for XML

    console.log("Found", workElements.length, "work elements in XML."); // Debug log

    workElements.forEach((workElement, index) => {
         // Find the title within the work element
         const titleElement = workElement.querySelector('work\\:title title\\:title, work:title title:title');
         const title = titleElement ? titleElement.textContent.trim() : 'Untitled Work (XML)';

         // Find external IDs (like DOI, URL)
         const externalIds = [];
         const externalIdElements = workElement.querySelectorAll('common\\:external-ids common\\:external-id, common:external-ids common:external-id');
         externalIdElements.forEach(idEl => {
             const idTypeEl = idEl.querySelector('common\\:external-id-type, common:external-id-type');
             const idValueEl = idEl.querySelector('common\\:external-id-value, common:external-id-value');
             if (idTypeEl && idValueEl) {
                 externalIds.push({
                     type: idTypeEl.textContent.trim(),
                     value: idValueEl.textContent.trim()
                 });
             }
         });

         // Find publication date
         const pubDateElement = workElement.querySelector('common\\:publication-date, common:publication-date');
         let pubDateStr = '';
         if (pubDateElement) {
             const yearEl = pubDateElement.querySelector('common\\:year, common:year');
             const monthEl = pubDateElement.querySelector('common\\:month, common:month');
             const dayEl = pubDateElement.querySelector('common\\:day, common:day');
             const year = yearEl ? yearEl.textContent.trim().padStart(4, '0') : null; // Ensure 4-digit year
             const month = monthEl ? monthEl.textContent.trim().padStart(2, '0') : null; // Pad month
             const day = dayEl ? dayEl.textContent.trim().padStart(2, '0') : null;     // Pad day
             pubDateStr = [year, month, day].filter(Boolean).join('-'); // Join non-null parts
         }

         // Find journal/conference title
         const journalTitleElement = workElement.querySelector('work\\:journal-title, work:journal-title');
         const journalTitle = journalTitleElement ? journalTitleElement.textContent.trim() : '';

         // Find contributors/authors
         const authors = [];
         const contributorElements = workElement.querySelectorAll('work\\:contributors work\\:contributor, work:contributors work:contributor');
         contributorElements.forEach(contribEl => {
             const creditNameEl = contribEl.querySelector('work\\:credit-name, work:credit-name');
             if (creditNameEl) {
                 authors.push(creditNameEl.textContent.trim());
             }
         });
         const authorsStr = authors.join(', ');

         // Construct the work object using the requested tags/structure
         works.push({
             title: title,
             authors: authorsStr,
             date: pubDateStr,
             journal: journalTitle,
             externalIds: externalIds // Keep the array of external IDs for flexibility
         });
    });

    console.log("Parsed works from XML:", works); // Debug log
    return works;
}


// Display function for data extracted from the ORCID XML
function displayPapersFromXmlData(worksDataArray) {
    const container = document.getElementById('papers-container');

    if (!worksDataArray || worksDataArray.length === 0) {
        container.innerHTML = '<p>No publications found in ORCID XML record.</p>';
        return;
    }

    const papersHTML = worksDataArray.map(work => {
        // Determine the URL to use (prefer DOI, then other URL)
        let url = '';
        if (work.externalIds && Array.isArray(work.externalIds)) {
             // Find DOI first
             const doiId = work.externalIds.find(id => id.type === 'doi');
             if (doiId && doiId.value) {
                 url = `https://doi.org/${doiId.value}`;
             } else {
                 // Find other URL type
                 const urlId = work.externalIds.find(id => id.type.toLowerCase() === 'url');
                 if (urlId && urlId.value) {
                     url = urlId.value;
                     if (!url.startsWith('http')) {
                         url = 'https://' + url;
                     }
                 }
             }
        }

        return `
            <div class="paper-item">
                <div class="paper-title">
                    ${url ? `<a href="${url}" target="_blank">${work.title}</a>` : work.title}
                </div>
                ${work.authors ? `<div class="paper-authors">${work.authors}</div>` : ''}
                ${work.journal || work.date ? `<div class="paper-details">${work.journal}${work.journal && work.date ? ' | ' : ''}${work.date}</div>` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = papersHTML;
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
