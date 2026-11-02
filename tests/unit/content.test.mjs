import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { loadPlants, root } from '../../scripts/content.mjs';
import { excerptText, searchPlants, resolvePlantId, groupPoems, validatePlants } from '../../web/shared/model.mjs';
import { plantArticle, plantCard } from '../../web/shared/render.mjs';

const plants = await loadPlants();
const index = plants.map(plant => ({ ...plant, searchText: excerptText(plant) }));
const compact = text => text.replace(/\s/g, '');

test('migration preserves every source paragraph, heading, poem and illustration', async () => {
    assert.equal(plants.length, 148);
    assert.deepEqual(plants.map(plant => plant.id), Array.from({ length: 148 }, (_, index) => index + 1));
    for (const plant of plants) {
        const original = parseHTML(await fs.readFile(path.join(root, 'legacy', plant.url), 'utf8')).document;
        const rendered = parseHTML(plantArticle(plant)).document;
        const sourceText = original.querySelector('.md').textContent;
        const sectionsText = plant.sections.flatMap(section => [section.title, ...section.blocks.map(block => block.text)]).join('');
        assert.equal(compact(original.querySelector('h1').textContent + sectionsText), compact(sourceText), plant.name);
        assert.equal(rendered.querySelectorAll('figure').length, original.querySelectorAll('.pic img[src]:not([src=""])').length, plant.name);
        for (const section of plant.sections) for (const block of section.blocks) assert.ok(rendered.querySelector('article').textContent.includes(block.text), plant.name);
    }
});

test('search handles aliases, Latin names, full-width characters, whitespace and empty results', () => {
    assert.ok(searchPlants(index, '艾蒿').some(plant => plant.id === 1));
    assert.ok(searchPlants(index, '  ARTEMISIA   argyi ').some(plant => plant.id === 1));
    assert.ok(searchPlants(index, 'Ａｒｔｅｍｉｓｉａ').some(plant => plant.id === 1));
    assert.ok(searchPlants(index, '关雎').some(plant => plant.id === 124));
    assert.equal(searchPlants(index, '').length, 148);
    assert.equal(searchPlants(index, '不存在的草木XYZ123').length, 0);
    assert.ok(!searchPlants(index, 'Artemisia argyi').some(plant => plant.id === 124));
});

test('poem relationships and legacy IDs remain stable', () => {
    const poems = groupPoems(plants);
    assert.equal(poems.length, 128);
    assert.ok(poems.find(poem => poem.name === '关雎').plants.some(plant => plant.id === 124));
    assert.equal(resolvePlantId('#148', plants), 148);
    for (const hash of ['#999', '#-1', '#1x', '#', '', '#<script>']) assert.equal(resolvePlantId(hash, plants), 1);
});

test('renderers escape content and keep standalone and catalogue headings semantic', () => {
    const plant = structuredClone(plants[0]);
    plant.name = '<img src=x onerror=alert(1)>';
    plant.sections[0].blocks[0].text = '<script>alert(1)</script>';
    const html = plantArticle(plant);
    const { document } = parseHTML(html);
    assert.equal(document.querySelectorAll('script, img[onerror]').length, 0);
    assert.ok(document.querySelector('article').textContent.includes('<script>alert(1)</script>'));
    assert.equal(parseHTML(plantArticle(plants[0], '', 'h2')).document.querySelectorAll('h1').length, 0);
    assert.ok(plantCard({ ...plants[0], image: '' }).includes('pages/1艾.html'));
});

test('schema rejects duplicate IDs, invalid content and unsafe asset paths', () => {
    assert.throws(() => validatePlants([plants[0], plants[0]]));
    const malformed = structuredClone(plants[0]);
    malformed.images[0].src = '../.aws/config';
    assert.throws(() => validatePlants([malformed]));
    malformed.images = [];
    malformed.sections[0].blocks[0].kind = 'script';
    assert.throws(() => validatePlants([malformed]));
});
