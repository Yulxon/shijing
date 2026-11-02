'use strict';

const plants = window.PLANTS || [];
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const entryLink = plant => `list.html#${plant.id}`;
const card = plant => `<a class="plant-card" href="${entryLink(plant)}"><div class="card-art">${plant.image ? `<img loading="lazy" src="${escapeHTML(plant.image)}" alt="${escapeHTML(plant.name)}的植物图谱">` : '<span>草木</span>'}</div><div class="card-copy"><span class="eyebrow">草木 · ${String(plant.id).padStart(3, '0')}</span><h3>${escapeHTML(plant.name)}</h3><p>${plant.poems.map(poem => `《${escapeHTML(poem)}》`).join('、') || '查看植物记载'}</p></div><span class="card-arrow" aria-hidden="true">↗</span></a>`;

const featured = document.querySelector('#featured');
if (featured) featured.innerHTML = [124, 113, 99, 142].map(id => plants.find(plant => plant.id === id)).filter(Boolean).map(card).join('');
const count = document.querySelector('#plant-count');
if (count) count.textContent = plants.length;

const searchInput = document.querySelector('#search-query');
if (searchInput) {
    const results = document.querySelector('#search-results');
    const summary = document.querySelector('#search-summary');
    const form = document.querySelector('#search-form');
    searchInput.value = new URLSearchParams(location.search).get('q') || '';
    function search() {
        const query = searchInput.value.trim();
        const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
        const matches = plants.filter(plant => terms.every(term => `${plant.name} ${plant.text}`.toLocaleLowerCase().includes(term)));
        summary.textContent = query ? `“${query}” · 找到 ${matches.length} 种植物` : `全部 ${plants.length} 种植物 · 输入名称、别名或篇目开始检索`;
        results.innerHTML = matches.length ? matches.map(card).join('') : '<div class="empty"><h2>暂未找到相关植物</h2><p>试试更短的关键词，如「荇菜」「关雎」或「本草纲目」。</p></div>';
    }
    searchInput.addEventListener('input', search);
    form.addEventListener('submit', event => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
        try { history.replaceState(null, '', `search.html${params.size ? `?${params}` : ''}`); } catch { /* File previews may restrict history updates. */ }
        search();
    });
    document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
        searchInput.value = button.dataset.query;
        search();
        searchInput.focus();
    }));
    search();
}

const plantList = document.querySelector('#plant-list');
if (plantList) {
    const frame = document.querySelector('#plant-frame');
    const filter = document.querySelector('#plant-filter');
    function select() {
        const plant = plants.find(item => item.id === Number(location.hash.slice(1))) || plants[0];
        if (frame.getAttribute('src') !== plant.url) frame.src = plant.url;
        frame.title = `${plant.name}：植物记载与图谱`;
        document.querySelector('#current-plant').textContent = plant.name;
        document.querySelector('#open-entry').href = plant.url;
        plantList.querySelectorAll('a').forEach(link => {
            const active = link.hash === `#${plant.id}`;
            link.classList.toggle('selected', active);
            if (active) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
    }
    function renderList() {
        const query = filter.value.trim().toLowerCase();
        const matches = plants.filter(plant => `${plant.name} ${plant.poems.join(' ')}`.toLowerCase().includes(query));
        plantList.innerHTML = matches.length ? matches.map(plant => `<a href="#${plant.id}"><span class="entry-number">${String(plant.id).padStart(3, '0')}</span>${escapeHTML(plant.name)}</a>`).join('') : '<p class="muted">没有匹配的植物</p>';
        document.querySelector('#filter-count').textContent = `${matches.length} / ${plants.length} 种植物`;
        select();
    }
    filter.addEventListener('input', renderList);
    window.addEventListener('hashchange', select);
    renderList();
}

const poemList = document.querySelector('#poem-list');
if (poemList) {
    const poems = new Map();
    plants.forEach(plant => plant.poems.forEach(poem => {
        if (!poems.has(poem)) poems.set(poem, []);
        poems.get(poem).push(plant);
    }));
    const filter = document.querySelector('#poem-filter');
    function renderPoems() {
        const query = filter.value.trim();
        const matches = [...poems].filter(([name, entries]) => name.includes(query) || entries.some(plant => plant.name.includes(query)));
        document.querySelector('#poem-summary').textContent = `显示 ${matches.length} / ${poems.size} 个篇目 · 根据植物条目的「出现篇目」整理`;
        poemList.innerHTML = matches.length ? matches.map(([name, entries]) => `<article class="poem-card"><span class="eyebrow">${entries.length} 种植物</span><h2>《${escapeHTML(name)}》</h2><div class="plant-tags">${entries.map(plant => `<a href="${entryLink(plant)}">${escapeHTML(plant.name)} <span aria-hidden="true">↗</span></a>`).join('')}</div></article>`).join('') : '<div class="empty"><h2>没有匹配的篇目</h2><p>请尝试其他篇目或植物名称。</p></div>';
    }
    filter.addEventListener('input', renderPoems);
    renderPoems();
}
