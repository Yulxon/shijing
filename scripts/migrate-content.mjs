/** One-time, auditable migration from archived HTML to the canonical content schema. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { validatePlants } from '../web/shared/model.mjs';

const root = path.resolve(import.meta.dirname, '..');
const legacy = fs.existsSync(path.join(root, 'legacy/pages/1艾.html')) ? 'legacy/pages' : 'pages';
const plain = value => value.replace(/\s+/g, ' ').trim();
const output = [];
for (const file of fs.readdirSync(path.join(root, legacy)).filter(file => /^\d+.*\.html$/.test(file))) {
    const { document } = parseHTML(fs.readFileSync(path.join(root, legacy, file), 'utf8'));
    const article = document.querySelector('.md');
    assert.ok(article, `${file}: missing article`);
    const sections = [];
    let section;
    for (const element of article.querySelectorAll('h2, p, center')) {
        if (element.tagName === 'CENTER' && element.closest('h1, h2')) continue;
        const text = plain(element.textContent);
        if (!text) continue;
        if (element.tagName === 'H2') {
            section = { id: `s${sections.length + 1}`, title: text, blocks: [] };
            sections.push(section);
        } else {
            assert.ok(section, `${file}: content without section`);
            const isSource = element.querySelector('strong') && plain(element.querySelector('strong').textContent) === text;
            section.blocks.push({ kind: isSource ? 'source' : 'paragraph', text });
        }
    }
    const name = file.replace(/^\d+|\.html$/g, '').trim();
    const poemSection = sections.find(section => section.title === '出现篇目');
    const firstSource = poemSection.blocks.findIndex(block => block.kind === 'source');
    const poemBlocks = firstSource < 0 ? poemSection.blocks : poemSection.blocks.slice(0, firstSource);
    const poems = [...new Set([...poemBlocks.map(block => block.text).join(' ').matchAll(/《([^》]+)》/g)].map(match => match[1]))];
    // Compare the entire reading text, including source headings, to prevent silent omissions.
    const migratedText = [plain(article.querySelector('h1').textContent), ...sections.flatMap(section => [section.title, ...section.blocks.map(block => block.text)])].join(' ');
    assert.equal(plain(migratedText).replace(/\s/g, ''), plain(article.textContent).replace(/\s/g, ''), `${file}: migration omitted or reordered content`);
    const images = [...document.querySelectorAll('.pic img')].filter(image => image.getAttribute('src')?.trim()).map(image => ({
        src: path.posix.normalize('pages/' + decodeURIComponent(image.getAttribute('src'))),
        caption: plain(image.nextElementSibling?.textContent || ''),
        alt: image.getAttribute('alt') || `${name}的植物图谱`
    }));
    output.push({ id: parseInt(file), name, url: `pages/${file}`, poems, sections, images });
}
output.sort((a, b) => a.id - b.id);
validatePlants(output);
fs.mkdirSync(path.join(root, 'content/plants'), { recursive: true });
for (const plant of output) {
    const target = path.join(root, 'content/plants', `${String(plant.id).padStart(3, '0')}.json`);
    fs.writeFileSync(target, JSON.stringify(plant, null, 4) + '\n', { flag: 'wx' });
}
console.log(`Migrated and text-verified ${output.length} plant records. Existing content files are never overwritten.`);
