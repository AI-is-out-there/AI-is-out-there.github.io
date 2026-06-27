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


// --- GitHub Functions ---

const GITHUB_USER = 'D2718281828nis';
const PINNED_REPOS = [
    'BioMedAI',
    'ML-machinelearning_fundamentals',
    'Math-Wavelets_fundamentals',
    'AutomaticControlTheory-Fundamentals',
    'LLM_AI_agents',
    'Fuzzy-fundamentals'
];

let allRepos = [];
let activeFilter = 'all';

function getRepoCategory(name) {
    if (name.startsWith('BioMed') || name.startsWith('ECG') || name.includes('ECG')) return 'BioMed AI';
    if (name.startsWith('AutomaticControl')) return 'Control Theory';
    if (name.startsWith('ML-') || name.startsWith('ML_')) return 'Machine Learning';
    if (name.startsWith('Math-')) return 'Math & Signals';
    if (name.startsWith('Fuzzy')) return 'Fuzzy Logic';
    if (name.startsWith('Neuro')) return 'Neuroscience';
    if (name.startsWith('LLM') || name.startsWith('Open-Source-LLM')) return 'LLM & Agents';
    return 'Other';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setSyncStatus(state, syncedAt) {
    const el = document.getElementById('lastUpdate');
    if (!el) return;

    el.classList.remove('is-syncing', 'is-error');

    if (state === 'syncing') {
        el.classList.add('is-syncing');
        el.textContent = 'syncing with GitHub…';
        el.removeAttribute('title');
        return;
    }

    if (state === 'error') {
        el.classList.add('is-error');
        el.textContent = 'sync failed — featured repos still available above';
        el.title = syncedAt ? syncedAt.toLocaleString() : '';
        return;
    }

    const date = syncedAt || new Date();
    el.textContent = date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    el.title = date.toLocaleString();
}

function updatePinnedStats() {
    const pinnedRoot = document.getElementById('pinned-repos');
    if (!pinnedRoot) return;

    PINNED_REPOS.forEach(name => {
        const repo = allRepos.find(r => r.name === name);
        const statsEl = pinnedRoot.querySelector(`[data-pinned="${name}"] .pinned-stats`);
        if (!statsEl || !repo) return;

        statsEl.textContent = `★ ${repo.stargazers_count} · ${repo.language || 'Jupyter Notebook'}`;
        statsEl.classList.remove('is-syncing');
    });

    pinnedRoot.setAttribute('aria-busy', 'false');
}

function fetchRepos() {
    const container = document.getElementById('repo-container');
    const pinnedContainer = document.getElementById('pinned-repos');
    setSyncStatus('syncing');

    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`)
        .then(response => {
            if (!response.ok) throw new Error(`GitHub API ${response.status}`);
            return response.json();
        })
        .then(repos => {
            if (!Array.isArray(repos)) throw new Error('Unexpected GitHub API response');

            allRepos = repos.sort((a, b) => b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name));

            const countEl = document.getElementById('github-repo-count');
            if (countEl) countEl.textContent = allRepos.length;

            updatePinnedStats();
            renderRepoGrid(container);
            setupRepoFilters();
            container.setAttribute('aria-busy', 'false');
            setSyncStatus('success', new Date());
        })
        .catch(error => {
            console.error('Error fetching repositories:', error);
            container.innerHTML = '<p class="error">Could not load the full repository list. Featured repos above remain available.</p>';
            container.setAttribute('aria-busy', 'false');
            if (pinnedContainer) pinnedContainer.setAttribute('aria-busy', 'false');
            setSyncStatus('error');
        });
}

function renderRepoGrid(container) {
    const filtered = activeFilter === 'all'
        ? allRepos
        : allRepos.filter(r => getRepoCategory(r.name) === activeFilter);

    if (!filtered.length) {
        container.innerHTML = '<p class="loading">No repositories in this category.</p>';
        return;
    }

    container.innerHTML = filtered.map(repo => createRepoCardHtml(repo)).join('');
}

function createRepoCardHtml(repo) {
    const category = getRepoCategory(repo.name);
    const description = repo.description || 'Jupyter notebook with practical examples.';

    return `
        <article class="repo-card">
            <div class="repo-card-header">
                <h3><a href="${repo.html_url}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a></h3>
                <span class="repo-category">${escapeHtml(category)}</span>
            </div>
            <p>${escapeHtml(description)}</p>
            <div class="repo-stats">
                <div class="stat"><span>★</span><span>${repo.stargazers_count}</span></div>
                <div class="stat"><span>⑂</span><span>${repo.forks_count}</span></div>
                <div class="stat"><span>◉</span><span>${escapeHtml(repo.language || 'Notebook')}</span></div>
            </div>
            <a href="${repo.html_url}" target="_blank" rel="noopener" class="btn">Open repo</a>
        </article>
    `;
}

function setupRepoFilters() {
    const filters = document.querySelectorAll('.repo-filter');
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderRepoGrid(document.getElementById('repo-container'));
        });
    });
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
