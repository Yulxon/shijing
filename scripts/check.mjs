import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { loadPlants, root } from './content.mjs';

const dist = path.join(root, 'dist');
const plants = await loadPlants();
const files = ['index.html', 'list.html', 'shijing.html', 'search.html', 'head.html', '404.html', ...plants.map(plant => plant.url)];
let links = 0;
for (const file of files) {
    const html = await fs.readFile(path.join(dist, file), 'utf8');
    const { document } = parseHTML(html);
    assert.equal(document.documentElement.lang, 'zh-CN', `${file}: language`);
    assert.ok(document.querySelector('meta[name="viewport"]'), `${file}: mobile viewport`);
    assert.ok(document.title && !document.title.includes('Title'), `${file}: title`);
    assert.equal(document.querySelectorAll('iframe').length, 0, `${file}: iframe-free reading`);
    for (const element of document.querySelectorAll('*')) {
        assert.ok(!element.getAttributeNames().some(name => /^on/i.test(name)), `${file}: inline event handlers`);
    }
    for (const element of document.querySelectorAll('[href], [src]')) {
        const reference = element.getAttribute('href') ?? element.getAttribute('src');
        assert.ok(reference, `${file}: empty resource reference`);
        const url = new URL(reference, `https://atlas.invalid/${file}`);
        if (url.origin !== 'https://atlas.invalid') continue;
        const target = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
        assert.ok((await fs.stat(path.join(dist, target))).isFile(), `${file}: missing ${reference}`);
        if (url.hash && !url.pathname.endsWith('list.html')) {
            const targetHTML = target === file ? document : parseHTML(await fs.readFile(path.join(dist, target), 'utf8')).document;
            assert.ok(targetHTML.getElementById(decodeURIComponent(url.hash.slice(1))), `${file}: missing fragment ${reference}`);
        }
        links++;
    }
}
for (const name of ['main.css', 'tokens.css']) {
    const css = await fs.readFile(path.join(dist, 'assets/styles', name), 'utf8');
    for (const match of css.matchAll(/(?:url\(|@import\s+)["']([^"']+)["']/g)) {
        await fs.access(path.resolve(dist, 'assets/styles', match[1]));
    }
}
for (const item of ['.git', '.aws', 'legacy', 'content', 'node_modules', 'package.json', 'scripts']) {
    await assert.rejects(fs.access(path.join(dist, item)), `${item} must not be published`);
}
const { document: catalogue } = parseHTML(await fs.readFile(path.join(dist, 'list.html'), 'utf8'));
assert.equal(catalogue.querySelectorAll('#plant-list a').length, plants.length);
assert.ok(catalogue.querySelector('#reader-content .plant-article'), 'Catalogue must contain a pre-rendered article');
const { document: home } = parseHTML(await fs.readFile(path.join(dist, 'index.html'), 'utf8'));
assert.equal(home.querySelectorAll('.plant-card').length, 4, 'Homepage features must not require JS');
assert.equal(home.querySelectorAll('script').length, 0, 'Homepage needs no JavaScript');
console.log(`Checked ${plants.length} records, ${files.length} static pages, ${links} references, and publication boundaries.`);
