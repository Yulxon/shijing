import { escapeHTML as e, plantCard, plantArticle } from '../shared/render.mjs';
import { groupPoems, normalize } from '../shared/model.mjs';
import { layout, navigation } from './layout.mjs';

const heading = (eyebrow, title, description) => `<div class="page-heading"><span class="eyebrow">${e(eyebrow)}</span><h1>${e(title)}</h1><p>${e(description)}</p></div>`;
export function homePage(plants, template) {
    const featured = [124, 113, 99, 142].map(id => plants.find(plant => plant.id === id)).filter(Boolean).map(plant => plantCard(plant)).join('');
    return layout({ title: '首页', description: `从《诗经》中认识${plants.length}种植物，阅读历代注疏，欣赏古今植物图谱。`, active: 'index.html', body: template.replace('{{plantCount}}', plants.length).replace('{{featured}}', featured) });
}
export function cataloguePage(plants) {
    const first = plants[0];
    return layout({ title: '诗经植物', description: '浏览诗经植物的古代注疏、现代记载和植物插图。', active: 'list.html', script: 'catalogue', body:
        heading('草木有名，诗意有迹', '诗经植物', '选择一种植物，翻开它的历代记载与图谱。') +
        `<div class="catalogue"><aside class="catalogue-sidebar" aria-label="植物目录"><label for="plant-filter">查找植物或篇目</label><input type="search" id="plant-filter" placeholder="如：艾、关雎" autocomplete="off"><p class="muted" id="filter-count" role="status">${plants.length} / ${plants.length} 种植物</p><div class="plant-list" id="plant-list">${plants.map(plant => `<a href="${e(plant.url)}" data-id="${plant.id}" data-filter="${e(normalize(plant.name + ' ' + plant.poems.join(' ')))}"${plant.id === first.id ? ' aria-current="true" class="selected"' : ''}><span class="entry-number">${String(plant.id).padStart(3, '0')}</span>${e(plant.name)}</a>`).join('')}</div><p id="catalogue-empty" class="muted" hidden>没有匹配的植物</p></aside><section class="reader" aria-label="植物条目"><div class="reader-toolbar"><span id="reader-status" role="status">${e(first.name)}</span><a id="open-entry" href="${e(first.url)}">展开阅读 ↗</a></div><div id="reader-content">${plantArticle(first, '', 'h2')}</div></section></div><noscript><p>目录链接可直接打开各植物资料页。启用 JavaScript 后可在本页切换和筛选植物。</p></noscript>` });
}
export function searchPage(plants) {
    return layout({ title: '植物检索', description: '按植物名称、别名、诗经篇目及古今文献记载检索诗经植物。', active: 'search.html', script: 'search', body:
        heading('在字里行间，寻找草木', '植物检索', '输入植物名、别名、篇目或文献关键词，检索全部植物条目。多个关键词以空格分隔。') +
        `<form id="search-form" role="search" action="search.html" method="get"><label for="search-query">检索关键词</label><div class="search-bar"><input type="search" id="search-query" name="q" placeholder="植物名、别名、诗篇、古籍记载……" autocomplete="off"><button class="button" type="submit">检索 <span aria-hidden="true">↗</span></button></div></form><div class="suggestions"><span>试着寻找</span>${['荇菜', '关雎', '本草纲目', 'Artemisia'].map(query => `<a href="search.html?q=${encodeURIComponent(query)}" data-query="${e(query)}">${e(query)}</a>`).join('')}</div><p class="result-summary" id="search-summary" role="status">全部 ${plants.length} 种植物</p><div class="card-grid" id="search-results">${plants.map(plant => plantCard(plant)).join('')}</div><noscript><p>以下为全部植物。全文检索需要 JavaScript，您也可以使用浏览器的页面查找。</p></noscript>` });
}
export function poemsPage(plants) {
    const poems = groupPoems(plants);
    return layout({ title: '诗经篇目', description: '按照诗经篇目寻找相关植物，探索诗句与草木之间的联系。', active: 'shijing.html', script: 'poems', body:
        heading('循诗寻草木', '诗经篇目', '一首诗里，藏着怎样的草木？从篇目出发，找到与它相遇的植物。') +
        `<form action="shijing.html" method="get" id="poem-form"><label for="poem-filter">筛选篇目或植物</label><div class="search-bar"><input type="search" id="poem-filter" name="q" placeholder="如：关雎、采葛、桃" autocomplete="off"><button class="button" type="submit">筛选</button></div></form><p class="result-summary" id="poem-summary" role="status">显示 ${poems.length} / ${poems.length} 个篇目 · 根据植物条目的「出现篇目」整理</p><div class="poem-grid" id="poem-list">${poems.map(poem => `<article class="poem-card" data-filter="${e(normalize(poem.name + ' ' + poem.plants.map(plant => plant.name).join(' ')))}"><span class="eyebrow">${poem.plants.length} 种植物</span><h2>《${e(poem.name)}》</h2><div class="plant-tags">${poem.plants.map(plant => `<a href="${e(plant.url)}">${e(plant.name)} <span aria-hidden="true">↗</span></a>`).join('')}</div></article>`).join('')}</div><div class="empty" id="poem-empty" hidden><h2>没有匹配的篇目</h2><p>请尝试其他篇目或植物名称。</p></div>` });
}
export function detailPage(plant, plants) {
    const index = plants.findIndex(item => item.id === plant.id);
    const adjacent = [plants[index - 1], plants[index + 1]].filter(Boolean);
    return layout({ title: plant.name, description: `${plant.name}的诗经篇目、历代注疏、现代记载与植物图谱。`, active: 'list.html', base: '../', bodyClass: 'detail-page', body:
        `<a class="entry-back" href="../list.html#${plant.id}">← 返回植物目录</a>${plantArticle(plant, '../')}<nav class="entry-pagination" aria-label="相邻植物">${adjacent.map(item => `<a href="${e(item.url.slice('pages/'.length))}">${item.id < plant.id ? '← 上一种：' : '下一种：'}${e(item.name)}${item.id > plant.id ? ' →' : ''}</a>`).join('')}</nav>` });
}
export function headerPage() {
    return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>诗经植物图鉴 · 导航</title><link rel="stylesheet" href="assets/styles/main.css"></head><body>${navigation('', '', true)}</body></html>`;
}
export function notFoundPage() {
    return layout({ title: '未找到页面', description: '返回诗经植物图鉴继续寻找草木。', base: '/', body: '<div class="empty"><h1>这条小径还没有草木</h1><p>页面不存在，您可以回到首页或检索植物。</p><a class="button" href="/index.html">返回首页</a> <a class="button secondary" href="/search.html">植物检索</a></div>' });
}
