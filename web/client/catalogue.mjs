import { normalize, resolvePlantId } from '../shared/model.mjs';
import { plantArticle } from '../shared/render.mjs';
import { dataURL, fetchJSON } from './utils.mjs';

export function initCatalogue(document, browser = window) {
    const list = document.querySelector('#plant-list');
    if (!list) return;
    const links = [...list.querySelectorAll('a[data-id]')];
    const plants = links.map(link => ({ id: Number(link.dataset.id), url: link.getAttribute('href'), name: link.textContent.replace(/^\d+/, '').trim() }));
    const filter = document.querySelector('#plant-filter');
    const reader = document.querySelector('.reader');
    const content = document.querySelector('#reader-content');
    const status = document.querySelector('#reader-status');
    const open = document.querySelector('#open-entry');
    const cache = new Map();
    let activeId = plants[0].id;
    let request;
    let revision = 0;
    async function select(focus = false) {
        const id = resolvePlantId(browser.location.hash, plants);
        const current = ++revision;
        request?.abort();
        reader.removeAttribute('aria-busy');
        const plant = plants.find(plant => plant.id === id);
        open.href = plant.url;
        if (id === activeId) {
            status.textContent = plant.name;
            return;
        }
        status.textContent = `正在翻阅${plant.name}……`;
        reader.setAttribute('aria-busy', 'true');
        try {
            request = new AbortController();
            const record = cache.get(id) || await fetchJSON(dataURL(`plants/${id}.json`), { signal: request.signal });
            if (current !== revision) return;
            cache.set(id, record);
            content.innerHTML = plantArticle(record, '', 'h2');
            activeId = id;
            open.href = plant.url;
            status.textContent = plant.name;
            for (const link of links) {
                const active = Number(link.dataset.id) === id;
                link.classList.toggle('selected', active);
                if (active) link.setAttribute('aria-current', 'true');
                else link.removeAttribute('aria-current');
            }
            if (focus) content.querySelector('#entry-title').focus({ preventScroll: true });
        } catch (error) {
            if (error.name !== 'AbortError' && current === revision) status.textContent = `暂时无法载入${plant.name}。可再次选择重试，或直接打开资料页。`;
        } finally {
            if (current === revision) reader.removeAttribute('aria-busy');
        }
    }
    list.addEventListener('click', event => {
        const link = event.target.closest('a[data-id]');
        if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const id = Number(link.dataset.id);
        browser.history.pushState(null, '', `#${id}`);
        // Keep an ordinary link available even if the enhanced request fails.
        open.href = link.href;
        void select(true);
    });
    filter.addEventListener('input', () => {
        const query = normalize(filter.value);
        let count = 0;
        for (const link of links) {
            link.hidden = !link.dataset.filter.includes(query);
            if (!link.hidden) count++;
        }
        document.querySelector('#filter-count').textContent = `${count} / ${links.length} 种植物`;
        document.querySelector('#catalogue-empty').hidden = count !== 0;
    });
    browser.addEventListener('hashchange', () => { void select(); });
    void select();
}
if (typeof document !== 'undefined') initCatalogue(document);
