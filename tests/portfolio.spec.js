const { test, expect } = require('@playwright/test');

// The portfolio must render and work without any third-party requests.
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
});

test('loads local assets and all five project case studies', async ({ page }) => {
  const errors = [];
  const failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await expect(page.locator('.project-card')).toHaveCount(5);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const images = [...document.images];
    images.forEach(image => { image.loading = 'eager'; });
    await Promise.all(images.map(image => image.decode()));
  });
  expect(await page.evaluate(() => [...document.images].every(image => image.naturalWidth > 0))).toBe(true);
  expect((await page.request.get('/assets/social-preview.png')).status()).toBe(200);
  expect(await page.evaluate(() => document.fonts.check('600 16px Manrope'))).toBe(true);
  expect(await page.locator('.site-nav a').first().getAttribute('href')).toBe('#projects');
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test('theme persists, updates browser color, and respects an explicit preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#09101e');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('follows system changes when no theme has been chosen', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

for (const operation of ['getItem', 'setItem']) {
  test(`storage ${operation} failures preserve content and controls`, async ({ page }) => {
    await page.addInitScript(method => {
      Storage.prototype[method] = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
    }, operation);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.locator('.theme-toggle').click();
    await page.getByRole('tab', { name: 'Open education' }).click();
    await expect(page.locator('#panel-education')).toBeVisible();
    await page.getByRole('button', { name: 'AI & signals', exact: true }).click();
    await expect(page.locator('.project-card:visible')).toHaveCount(2);
    expect(errors).toEqual([]);
  });
}

test('expertise tabs support orientation, wrapping, Home/End, and roving focus', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-control')).toBeVisible();
  await expect(page.locator('#panel-biomed')).toBeHidden();
  await page.keyboard.press('End');
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(tabs.first()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#panel-control')).toBeFocused();
});

test('filters keep the correct projects and announce the result count', async ({ page }) => {
  await page.goto('/');
  for (const [name, count] of [['AI & signals', 2], ['Control', 1], ['Learning', 4], ['All', 5]]) {
    const button = page.getByRole('button', { name, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.project-card:visible')).toHaveCount(count);
    await expect(page.getByRole('status')).toHaveText(`${count} ${count === 1 ? 'project' : 'projects'} shown`);
  }
});

test('interactive library lists every published lab with its source', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-nav a[href="#library"]').click();
  await expect(page.locator('#library-title')).toBeInViewport();
  const items = page.locator('.library-item');
  await expect(items).toHaveCount(7);
  for (const item of await items.all()) {
    await expect(item.locator('a[href^="https://d2718281828nis.github.io/"]').first()).toBeVisible();
    await expect(item.locator('a[href^="https://github.com/D2718281828nis/"]')).toHaveCount(1);
  }
});

test('content and all expertise areas remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8765/');
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  for (const panel of ['biomed', 'control', 'education']) await expect(page.locator(`#panel-${panel}`)).toBeVisible();
  await expect(page.locator('.project-card')).toHaveCount(5);
  await expect(page.locator('.theme-toggle')).toBeHidden();
  await expect(page.locator('.project-filter')).toBeHidden();
  await context.close();
});

test('content remains visible without IntersectionObserver', async ({ page }) => {
  await page.addInitScript(() => { delete window.IntersectionObserver; });
  await page.goto('/');
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  await expect(page.locator('#year')).not.toBeEmpty();
});

test('reduced motion disables entrance animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-copy')).toHaveCSS('animation-name', 'none');
});

for (const scheme of ['light', 'dark']) {
  test(`${scheme} layout has navigation and no horizontal overflow at desktop and mobile widths`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await page.goto('/');
    for (const width of [1440, 1024, 821, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator('.site-nav')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `overflow at ${width}px`).toBeLessThanOrEqual(width);
    }
  });
}

const AxeBuilder = require('@axe-core/playwright').default;
for (const scheme of ['light', 'dark']) {
  for (const width of [1440, 390]) {
    test(`${scheme} accessibility checks at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([]);
    });
  }
}
