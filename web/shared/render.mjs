import { readingSections } from './model.mjs';
export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const e = escapeHTML;
export function plantCard(plant, base = '') {
    return `<a class="plant-card" href="${e(base + plant.url)}"><div class="card-art">${plant.image ? `<img loading="lazy" src="${e(base + plant.image)}" alt="${e(plant.name)}的植物图谱">` : '<span>草木</span>'}</div><div class="card-copy"><span class="eyebrow">草木 · ${String(plant.id).padStart(3, '0')}</span><h3>${e(plant.name)}</h3><p>${plant.poems.map(poem => `《${e(poem)}》`).join('、')}</p></div><span class="card-arrow" aria-hidden="true">↗</span></a>`;
}
export function plantArticle(plant, base = '', heading = 'h1') {
    if (!['h1', 'h2'].includes(heading)) throw new Error('Unsupported heading level');
    const subheading = heading === 'h1' ? 'h2' : 'h3';
    return `<article class="plant-article" aria-labelledby="entry-title"><header class="entry-heading"><span class="eyebrow">草木 · ${String(plant.id).padStart(3, '0')}</span><${heading} id="entry-title" tabindex="-1">${e(plant.name)}</${heading}><p>${plant.poems.map(poem => `<a href="${base}shijing.html?q=${encodeURIComponent(poem)}">《${e(poem)}》</a>`).join(' ')}</p></header><div class="entry-layout"><div class="entry-prose">${readingSections(plant).map(section => `<section aria-labelledby="section-${e(section.id)}"><${subheading} id="section-${e(section.id)}">${e(section.title)}</${subheading}>${section.blocks.map(block => block.kind === 'source' ? `<p class="source-title"><strong>${e(block.text)}</strong></p>` : `<p>${e(block.text)}</p>`).join('')}</section>`).join('')}</div><aside class="entry-gallery" aria-label="${e(plant.name)}的植物图谱">${plant.images.map(image => `<figure><a href="${e(base + image.src)}" target="_blank" rel="noopener" aria-label="查看${e(plant.name)}图谱原图"><img loading="lazy" src="${e(base + image.src)}" alt="${e(image.alt)}"></a><figcaption>${e(image.caption)}</figcaption></figure>`).join('')}</aside></div></article>`;
}
export const emptyState = (title, message) => `<div class="empty"><h2>${e(title)}</h2><p>${e(message)}</p></div>`;
