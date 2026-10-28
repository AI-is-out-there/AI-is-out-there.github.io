const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let explicitTheme = false;
try {
  explicitTheme = ['light', 'dark'].includes(localStorage.getItem('theme'));
} catch (_) {
  // Keep all interactions available without browser storage.
}

function setTheme(theme) {
  root.dataset.theme = theme;
  const dark = theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeLabel.textContent = dark ? 'Light' : 'Dark';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#09101e' : '#f4f7fb';
}

setTheme(root.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));
themeButton.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  explicitTheme = true;
  try {
    localStorage.setItem('theme', next);
  } catch (_) {
    // The preference applies to this visit even if it cannot be saved.
  }
});
themeButton.hidden = false;
systemTheme.addEventListener('change', event => {
  if (!explicitTheme) setTheme(event.matches ? 'dark' : 'light');
});

// All panels are readable HTML until the complete tab interaction is ready.
const tablist = document.querySelector('.expertise-tabs');
const tabs = [...tablist.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('.expertise-panel')];
const mobileTabs = window.matchMedia('(max-width: 820px)');
function setTabOrientation() {
  tablist.setAttribute('aria-orientation', mobileTabs.matches ? 'horizontal' : 'vertical');
}
function selectTab(tab, focus = false) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panels.forEach(panel => {
    panel.hidden = panel.id !== tab.getAttribute('aria-controls');
  });
  if (focus) tab.focus({ preventScroll: true });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const previous = mobileTabs.matches ? 'ArrowLeft' : 'ArrowUp';
    const next = mobileTabs.matches ? 'ArrowRight' : 'ArrowDown';
    let target;
    if (event.key === previous) target = (index + tabs.length - 1) % tabs.length;
    if (event.key === next) target = (index + 1) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target === undefined) return;
    event.preventDefault();
    selectTab(tabs[target], true);
    tabs[target].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
});
setTabOrientation();
mobileTabs.addEventListener('change', setTabOrientation);
selectTab(tabs[0]);
tablist.hidden = false;

const filterGroup = document.querySelector('.project-filter');
const cards = [...document.querySelectorAll('.project-card')];
const resultCount = document.querySelector('#project-count');
function updateProjectCount() {
  const count = cards.filter(card => !card.hidden).length;
  resultCount.textContent = `${count} ${count === 1 ? 'project' : 'projects'} shown`;
}
filterGroup.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', () => {
    filterGroup.querySelectorAll('button').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    cards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && !card.dataset.category.split(' ').includes(button.dataset.filter);
    });
    updateProjectCount();
  });
});
updateProjectCount();
filterGroup.hidden = false;
resultCount.hidden = false;

// Animation enhances visible content; it is never required to reveal it.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

document.querySelector('#year').textContent = new Date().getFullYear();
