import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseHTML, DOMParser } from 'linkedom';
import { loadPlants, root } from '../../scripts/content.mjs';

test('sitemap and canonical URLs cover exactly the public content pages', async () => {
    const { domain } = JSON.parse(await fs.readFile(path.join(root, 'site.config.json'), 'utf8'));
    const origin = `https://${domain}`;
    const plants = await loadPlants();
    const files = ['index.html', 'list.html', 'shijing.html', ...plants.map(plant => plant.url)];
    const xml = await fs.readFile(path.join(root, 'dist/sitemap.xml'), 'utf8');
    const sitemap = new DOMParser().parseFromString(xml, 'text/xml');
    assert.equal(sitemap.documentElement.getAttribute('xmlns'), 'http://www.sitemaps.org/schemas/sitemap/0.9');
    const urls = [...sitemap.querySelectorAll('loc')].map(element => element.textContent);
    const expected = files.map(file => new URL(file === 'index.html' ? '/' : file, origin).href);
    assert.deepEqual(urls, expected);
    assert.equal(new Set(urls).size, urls.length);
    for (const [index, file] of files.entries()) {
        const { document } = parseHTML(await fs.readFile(path.join(root, 'dist', file), 'utf8'));
        assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1, file);
        assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), expected[index], file);
        assert.equal(document.querySelector('meta[name="robots"]'), null, file);
    }
    for (const file of ['search.html', 'head.html', '404.html']) {
        const { document } = parseHTML(await fs.readFile(path.join(root, 'dist', file), 'utf8'));
        assert.equal(document.querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow', file);
        assert.equal(document.querySelector('link[rel="canonical"]'), null, file);
    }
    assert.equal(await fs.readFile(path.join(root, 'dist/robots.txt'), 'utf8'),
        `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
});
