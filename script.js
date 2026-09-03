const expertise = {
  biomed: { symbol: '∿', label: 'Biomedical AI', title: 'Finding interpretable patterns in physiological signals.', copy: 'EEG and ECG pipelines that combine signal processing, deep learning and explainability for clinical research.', tags: ['EEG / ECG', 'Explainable AI', 'Time series'], link: 'https://github.com/D2718281828nis/BioMedAI' },
  control: { symbol: '⌁', label: 'Control systems', title: 'Making dynamic systems stable, robust and understandable.', copy: 'Mathematical modelling, system identification and regulator design translated into practical Python workflows.', tags: ['Robust control', 'Modelling', 'Python'], link: 'https://www.rudntau.ru' },
  education: { symbol: '◌', label: 'Open education', title: 'Teaching difficult ideas without diluting their meaning.', copy: 'Free courses, videos and executable notebooks that connect mathematical foundations with real applications.', tags: ['76 playlists', 'Stepik courses', 'Open notebooks'], link: 'https://rutube.ru/channel/38172356/' }
};

const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const savedTheme = localStorage.getItem('theme');
const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

function setTheme(theme) {
  root.dataset.theme = theme;
  const dark = theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeLabel.textContent = dark ? 'Light' : 'Dark';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#171916' : '#f3f0e8';
}

setTheme(savedTheme || (preferredDark ? 'dark' : 'light'));
themeButton.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  setTheme(next);
});

document.querySelectorAll('[data-expertise]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-expertise]').forEach(item => item.setAttribute('aria-selected', String(item === tab)));
    const data = expertise[tab.dataset.expertise];
    document.querySelector('.panel-symbol').textContent = data.symbol;
    document.querySelector('#panel-label').textContent = data.label;
    document.querySelector('#panel-title').textContent = data.title;
    document.querySelector('#panel-copy').textContent = data.copy;
    document.querySelector('#panel-tags').innerHTML = data.tags.map(tag => `<li>${tag}</li>`).join('');
    document.querySelector('#panel-link').href = data.link;
  });
});

document.querySelectorAll('.project-filter button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.project-filter button').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('.project-card').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    });
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
document.querySelector('#year').textContent = new Date().getFullYear();
