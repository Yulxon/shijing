import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { initSearch } from '../../web/client/search.mjs';
import { initPoems } from '../../web/client/poems.mjs';
import { initCatalogue } from '../../web/client/catalogue.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
async function page(file, query = '') {
    const { document, window } = parseHTML(await fs.readFile(new URL(`../../dist/${file}`, import.meta.url), 'utf8'));
    const handlers = new Map();
    const browser = { location: new URL(`http://localhost/${file}${query}`), addEventListener: (type, handler) => handlers.set(type, handler) };
    browser.history = Object.fromEntries(['replaceState', 'pushState'].map(name => [name, (_state, _title, url) => { browser.location = new URL(url, browser.location); }]));
    window.HTMLElement.prototype.focus = function () {};
    const emit = (selector, type) => {
        const event = new window.Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'button', { value: 0 });
        document.querySelector(selector).dispatchEvent(event);
    };
    return { document, browser, handlers, emit };
}

test('real DOM search supports URL queries, errors, retries and clearing', async t => {
    const records = JSON.parse(await fs.readFile(new URL('../../dist/data/search.json', import.meta.url), 'utf8'));
    let fail = true;
    t.mock.method(globalThis, 'fetch', async () => {
        if (fail) throw new Error('Network unavailable');
        return { ok: true, json: async () => records };
    });
    const { document, browser, emit } = await page('search.html', '?q=关雎');
    initSearch(document, browser);
    await tick();
    assert.ok(document.querySelector('#search-summary').textContent.includes('加载失败'));
    assert.equal(document.querySelectorAll('.plant-card').length, 148);
    fail = false;
    emit('#search-form', 'submit');
    await tick();
    assert.ok(document.querySelector('#search-results a[href="pages/124荇菜.html"]'));
    document.querySelector('#search-query').value = '<script>missing</script>';
    emit('#search-query', 'input');
    await tick();
    assert.equal(document.querySelectorAll('#search-results script').length, 0);
    assert.ok(document.querySelector('#search-results').textContent.includes('暂未找到'));
    document.querySelector('#search-query').value = '';
    emit('#search-query', 'input');
    await tick();
    assert.equal(document.querySelectorAll('.plant-card').length, 148);
    assert.equal(browser.location.search, '');
});

test('real DOM poem filters preserve ordinary links and empty states', async () => {
    const { document, browser, emit } = await page('shijing.html', '?q=关雎');
    initPoems(document, browser);
    assert.equal(document.querySelectorAll('.poem-card:not([hidden])').length, 1);
    assert.ok(document.querySelector('.poem-card:not([hidden]) a[href="pages/124荇菜.html"]'));
    document.querySelector('#poem-filter').value = 'no-such-poem';
    emit('#poem-filter', 'input');
    assert.equal(document.querySelector('#poem-empty').hidden, false);
    assert.equal(document.querySelectorAll('.poem-card:not([hidden])').length, 0);
});

test('catalogue ignores stale responses, supports hashes and preserves a readable fallback', async t => {
    const pending = new Map();
    t.mock.method(globalThis, 'fetch', url => new Promise(resolve => pending.set(Number(url.pathname.match(/(\d+)\.json$/)[1]), resolve)));
    const { document, browser, handlers, emit } = await page('list.html', '#124');
    initCatalogue(document, browser);
    assert.ok(document.querySelector('#reader-status').textContent.includes('荇菜'));
    browser.location.hash = '#148';
    handlers.get('hashchange')();
    const record148 = JSON.parse(await fs.readFile(new URL('../../content/plants/148.json', import.meta.url), 'utf8'));
    pending.get(148)({ ok: true, json: async () => record148 });
    await tick();
    assert.equal(document.querySelector('#entry-title').textContent, '笋');
    const record124 = JSON.parse(await fs.readFile(new URL('../../content/plants/124.json', import.meta.url), 'utf8'));
    pending.get(124)({ ok: true, json: async () => record124 });
    await tick();
    assert.equal(document.querySelector('#entry-title').textContent, '笋');
    assert.equal(document.querySelectorAll('#plant-list [aria-current="true"]').length, 1);
    document.querySelector('#plant-filter').value = '不存在的植物';
    emit('#plant-filter', 'input');
    assert.equal(document.querySelector('#catalogue-empty').hidden, false);
    assert.equal(document.querySelector('#plant-list a[data-id="124"]').getAttribute('href'), 'pages/124荇菜.html');
});
