export const dataURL = name => new URL(`../../data/${name}`, import.meta.url);
export async function fetchJSON(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}
export function updateQuery(value, mode = 'replaceState', browser = window) {
    const url = new URL(browser.location.href);
    if (value.trim()) url.searchParams.set('q', value.trim());
    else url.searchParams.delete('q');
    browser.history[mode](null, '', url);
}
