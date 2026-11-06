import fs from 'node:fs/promises';
import path from 'node:path';
import { root, loadPlants } from './content.mjs';
import { excerptText, groupPoems } from '../web/shared/model.mjs';
import { homePage, cataloguePage, searchPage, poemsPage, detailPage, headerPage, notFoundPage } from '../web/templates/pages.mjs';

export async function build() {
    const plants = await loadPlants();
    const dist = path.join(root, 'dist');
    const config = JSON.parse(await fs.readFile(path.join(root, 'site.config.json'), 'utf8'));
    if (!/^[a-z0-9.-]+$/.test(config.domain)) throw new Error('Invalid site domain');
    const origin = `https://${config.domain}`;
    const indexablePages = ['index.html', 'list.html', 'shijing.html', ...plants.map(plant => plant.url)];
    const canonicalURL = file => new URL(file === 'index.html' ? '/' : file, origin).href;
    // No source directory is deleted. Rebuild only generated text files and replace assets.
    await fs.mkdir(path.join(dist, 'data/plants'), { recursive: true });
    await fs.mkdir(path.join(dist, 'pages'), { recursive: true });
    const write = async (file, text) => {
        if (file.endsWith('.html')) {
            const metadata = indexablePages.includes(file)
                ? `<link rel="canonical" href="${canonicalURL(file)}">`
                : '<meta name="robots" content="noindex, follow">';
            text = text.replace('</head>', `${metadata}</head>`);
        }
        await fs.mkdir(path.dirname(path.join(dist, file)), { recursive: true });
        await fs.writeFile(path.join(dist, file), text);
    };
    const index = plants.map(({ id, name, url, poems, images }) => ({ id, name, url, poems, image: images[0]?.src || '' }));
    for (const plant of plants) {
        for (const image of plant.images) await fs.access(path.join(root, image.src));
        await write(plant.url, detailPage(plant, plants));
        await write(`data/plants/${plant.id}.json`, JSON.stringify(plant));
    }
    const template = await fs.readFile(path.join(root, 'web/templates/home.html'), 'utf8');
    const pages = { 'index.html': homePage(index, template), 'list.html': cataloguePage(plants), 'search.html': searchPage(index), 'shijing.html': poemsPage(index), 'head.html': headerPage(), '404.html': notFoundPage() };
    await Promise.all(Object.entries(pages).map(([file, html]) => write(file, html)));
    await write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        indexablePages.map(file => `    <url><loc>${canonicalURL(file)}</loc></url>`).join('\n') +
        '\n</urlset>\n');
    await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
    await write('CNAME', config.domain + '\n');
    await write('.nojekyll', '');
    await write('data/search.json', JSON.stringify(index.map((plant, i) => ({ ...plant, searchText: excerptText(plants[i]) }))));
    await Promise.all([
        fs.cp(path.join(root, 'web/client'), path.join(dist, 'assets/client'), { recursive: true }),
        fs.cp(path.join(root, 'web/shared'), path.join(dist, 'assets/shared'), { recursive: true }),
        fs.cp(path.join(root, 'web/styles'), path.join(dist, 'assets/styles'), { recursive: true }),
        fs.cp(path.join(root, 'pages/pic'), path.join(dist, 'pages/pic'), { recursive: true }),
        fs.cp(path.join(root, 'src'), path.join(dist, 'src'), { recursive: true })
    ]);
    console.log(`Built ${plants.length} plants and ${groupPoems(plants).length} poems into dist/.`);
}
if (process.argv[1] === new URL(import.meta.url).pathname) await build();
