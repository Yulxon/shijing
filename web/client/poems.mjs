import { normalize } from '../shared/model.mjs';
import { updateQuery } from './utils.mjs';

export function initPoems(document, browser = window) {
    const input = document.querySelector('#poem-filter');
    if (!input) return;
    const cards = [...document.querySelectorAll('.poem-card')];
    const summary = document.querySelector('#poem-summary');
    const empty = document.querySelector('#poem-empty');
    function render() {
        const query = normalize(input.value);
        let count = 0;
        for (const card of cards) {
            card.hidden = !card.dataset.filter.includes(query);
            if (!card.hidden) count++;
        }
        empty.hidden = count !== 0;
        summary.textContent = `显示 ${count} / ${cards.length} 个篇目 · 根据植物条目的「出现篇目」整理`;
    }
    input.value = new URL(browser.location.href).searchParams.get('q') || '';
    input.addEventListener('input', () => { updateQuery(input.value, 'replaceState', browser); render(); });
    document.querySelector('#poem-form').addEventListener('submit', event => { event.preventDefault(); updateQuery(input.value, 'pushState', browser); render(); });
    browser.addEventListener('popstate', () => {
        input.value = new URL(browser.location.href).searchParams.get('q') || '';
        render();
    });
    render();
}
if (typeof document !== 'undefined') initPoems(document);
