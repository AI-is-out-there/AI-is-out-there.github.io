// Apply the preference before styles paint. Storage can be unavailable.
(() => {
  let theme;
  try {
    theme = localStorage.getItem('theme');
  } catch (_) {
    // The system preference still works when storage is blocked.
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#09101e' : '#f4f7fb';
})();
