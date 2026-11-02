import { searchPlants } from '../shared/model.mjs';
import { plantCard, emptyState } from '../shared/render.mjs';
import { dataURL, fetchJSON, updateQuery } from './utils.mjs';

export function initSearch(document, browser = window) {
    const input = document.querySelector('#search-query');
    if (!input) return;
    const form = document.querySelector('#search-form');
    const summary = document.querySelector('#search-summary');
    const results = document.querySelector('#search-results');
    let records;
    let pending;
    let revision = 0;
    async function render() {
        const current = ++revision;
        const query = input.value.trim();
        summary.textContent = '正在检索草木资料……';
        results.setAttribute('aria-busy', 'true');
        try {
            pending ||= fetchJSON(dataURL('search.json')).catch(error => { pending = null; throw error; });
            records ||= await pending;
            if (current !== revision) return;
            const matches = searchPlants(records, query);
            summary.textContent = query ? `“${query}” · 找到 ${matches.length} 种植物` : `全部 ${records.length} 种植物 · 输入名称、别名或篇目开始检索`;
            results.innerHTML = matches.length ? matches.map(plant => plantCard(plant)).join('') : emptyState('暂未找到相关植物', '试试更短的关键词，如「荇菜」「关雎」或「本草纲目」。');
        } catch {
            if (current !== revision) return;
            summary.textContent = '检索资料加载失败。请检查网络后再次提交检索；下方已显示的植物仍可阅读。';
        } finally {
            if (current === revision) results.removeAttribute('aria-busy');
        }
    }
    input.value = new URL(browser.location.href).searchParams.get('q') || '';
    input.addEventListener('input', () => { updateQuery(input.value, 'replaceState', browser); void render(); });
    form.addEventListener('submit', event => { event.preventDefault(); updateQuery(input.value, 'pushState', browser); void render(); });
    document.querySelectorAll('[data-query]').forEach(link => link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        input.value = link.dataset.query;
        updateQuery(input.value, 'pushState', browser);
        void render();
        input.focus();
    }));
    browser.addEventListener('popstate', () => {
        input.value = new URL(browser.location.href).searchParams.get('q') || '';
        void render();
    });
    if (input.value) void render();
}
if (typeof document !== 'undefined') initSearch(document);
