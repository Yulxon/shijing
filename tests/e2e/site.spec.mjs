import { test, expect } from '@playwright/test';

test('homepage preserves visual hierarchy, navigation and responsive width', async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('与草木相逢');
    await expect(page.locator('.plant-card')).toHaveCount(4);
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
    await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '诗经植物' }).click();
    await expect(page.locator('#plant-list a')).toHaveCount(148);
    expect(errors).toEqual([]);
});

test('catalogue supports old hashes, normal links, filtering and browser back', async ({ page }) => {
    await page.goto('/list.html#124');
    await expect(page.locator('#entry-title')).toHaveText('荇菜');
    await expect(page.locator('#plant-list [aria-current="true"]')).toHaveAttribute('data-id', '124');
    await page.locator('#plant-filter').fill('艾');
    await page.locator('#plant-list a[data-id="1"]').click();
    await expect(page.locator('#entry-title')).toHaveText('艾');
    await page.goBack();
    await expect(page.locator('#entry-title')).toHaveText('荇菜');
    await page.locator('#plant-filter').fill('不存在的草木');
    await expect(page.locator('#catalogue-empty')).toBeVisible();
    await page.locator('#open-entry').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('荇菜');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('search uses full text, shareable queries, clear and empty states', async ({ page }) => {
    await page.goto('/search.html?q=Artemisia%20argyi');
    await expect(page.locator('#search-results a[href="pages/1艾.html"]')).toBeVisible();
    await page.locator('#search-query').fill('不存在的草木XYZ123');
    await expect(page.locator('#search-results')).toContainText('暂未找到');
    await page.locator('#search-query').fill('关雎');
    await expect(page.locator('#search-results a[href="pages/124荇菜.html"]')).toBeVisible();
    await expect(page).toHaveURL(/q=/);
    await page.reload();
    await expect(page.locator('#search-query')).toHaveValue('关雎');
    await page.locator('#search-query').fill('');
    await expect(page.locator('#search-results .plant-card')).toHaveCount(148);
});

test('poem index supports direct queries and links to the associated plant', async ({ page }) => {
    await page.goto('/shijing.html?q=关雎');
    await expect(page.locator('.poem-card:visible')).toHaveCount(1);
    await page.locator('.poem-card:visible a[href="pages/124荇菜.html"]').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('荇菜');
    await expect(page.locator('.entry-gallery img')).not.toHaveCount(0);
});

test('request failures preserve readable content and allow retries', async ({ page }) => {
    await page.route('**/data/search.json', route => route.abort());
    await page.goto('/search.html?q=艾');
    await expect(page.locator('#search-summary')).toContainText('加载失败');
    await expect(page.locator('#search-results .plant-card')).toHaveCount(148);
    await page.unroute('**/data/search.json');
    await page.getByRole('button', { name: '检索' }).click();
    await expect(page.locator('#search-results a[href="pages/1艾.html"]')).toBeVisible();
    await page.goto('/list.html');
    await page.route('**/data/plants/124.json', route => route.abort());
    await page.locator('#plant-filter').fill('荇菜');
    await page.locator('#plant-list a[data-id="124"]').click();
    await expect(page.locator('#reader-status')).toContainText('暂时无法载入');
    await expect(page.locator('#entry-title')).toHaveText('艾');
    await expect(page.locator('#open-entry')).toHaveAttribute('href', 'pages/124荇菜.html');
});

test('static pages remain readable with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8000/list.html');
    await expect(page.locator('#plant-list a')).toHaveCount(148);
    await page.locator('#plant-list a[data-id="124"]').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('荇菜');
    await page.goto('http://127.0.0.1:8000/shijing.html');
    await expect(page.locator('.poem-card')).toHaveCount(128);
    await context.close();
});

test('publication contains public assets and a real 404 response', async ({ request }) => {
    for (const route of ['/pages/39 萑苇.html', '/pages/pic/145获-%20羽脉山黄麻.png', '/data/plants/124.json']) expect((await request.get(route)).status()).toBe(200);
    for (const route of ['/.git/config', '/content/plants/001.json', '/legacy/index.html', '/not-here']) expect((await request.get(route)).status()).toBe(404);
    expect((await request.head('/')).status()).toBe(200);
    expect((await request.post('/')).status()).toBe(405);
});
