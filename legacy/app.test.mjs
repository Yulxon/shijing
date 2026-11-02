import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const data = fs.readFileSync(new URL('../plants-data.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

// A small DOM boundary lets these tests exercise the shipped script without dependencies.
// Browser layout and focus behavior still require a visual browser check.
class Element {
    value = '';
    textContent = '';
    dataset = {};
    attributes = {};
    listeners = {};
    classes = new Set();
    classList = { toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name) };
    set innerHTML(value) {
        this.html = value;
        this.links = [...value.matchAll(/<a href="([^"]+)"/g)].map(match => {
            const link = new Element();
            link.hash = match[1].startsWith('#') ? match[1] : '';
            return link;
        });
    }
    get innerHTML() { return this.html || ''; }
    querySelectorAll() { return this.links || []; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name]; }
    removeAttribute(name) { delete this.attributes[name]; }
    focus() { this.focused = true; }
    emit(name) { this.listeners[name]?.({ preventDefault() {} }); }
}

function boot(ids, search = '', hash = '') {
    const elements = Object.fromEntries(ids.map(id => [`#${id}`, new Element()]));
    const windowEvents = {};
    const context = {
        window: { addEventListener: (name, callback) => { windowEvents[name] = callback; } },
        document: { querySelector: selector => elements[selector] || null, querySelectorAll: () => [] },
        location: { search, hash },
        history: { replaceState: (_state, _title, url) => { context.lastURL = url; } },
        URLSearchParams
    };
    vm.createContext(context);
    vm.runInContext(data, context);
    vm.runInContext(app, context);
    return { elements, context, windowEvents };
}

const searchIds = ['search-query', 'search-results', 'search-summary', 'search-form'];
test('search loads shared links and filters by poem, alias, and multiple keywords', () => {
    const { elements: e } = boot(searchIds, '?q=关雎');
    assert.match(e['#search-results'].innerHTML, /href="list.html#124"/);
    e['#search-query'].value = '艾蒿';
    e['#search-query'].emit('input');
    assert.match(e['#search-results'].innerHTML, /href="list.html#1"/);
    e['#search-query'].value = 'Artemisia argyi';
    e['#search-query'].emit('input');
    assert.match(e['#search-results'].innerHTML, /href="list.html#1"/);
    assert.doesNotMatch(e['#search-results'].innerHTML, /href="list.html#124"/);
});

test('search supports empty results, safe user input, reset, and shareable URL', () => {
    const { elements: e, context } = boot(searchIds);
    e['#search-query'].value = '<img src=x onerror=alert(1)>';
    e['#search-query'].emit('input');
    assert.match(e['#search-results'].innerHTML, /暂未找到/);
    assert.doesNotMatch(e['#search-results'].innerHTML, /onerror/);
    e['#search-query'].value = '关雎';
    e['#search-form'].emit('submit');
    assert.equal(new URLSearchParams(context.lastURL.split('?')[1]).get('q'), '关雎');
    e['#search-query'].value = '';
    e['#search-query'].emit('input');
    assert.equal((e['#search-results'].innerHTML.match(/class="plant-card"/g) || []).length, 148);
});

test('catalogue honors deep links, hash navigation, and invalid IDs', () => {
    const { elements: e, context, windowEvents } = boot(['plant-list', 'plant-frame', 'plant-filter', 'current-plant', 'open-entry', 'filter-count'], '', '#124');
    assert.equal(e['#plant-frame'].src, 'pages/124荇菜.html');
    assert.equal(e['#current-plant'].textContent, '荇菜');
    const selected = e['#plant-list'].links.filter(link => link.attributes['aria-current'] === 'true');
    assert.equal(selected.length, 1);
    assert.equal(selected[0].hash, '#124');
    context.location.hash = '#148';
    windowEvents.hashchange();
    assert.equal(e['#plant-frame'].src, 'pages/148笋.html');
    context.location.hash = '#999';
    windowEvents.hashchange();
    assert.equal(e['#plant-frame'].src, 'pages/1艾.html');
    e['#plant-filter'].value = '不存在的植物名称';
    e['#plant-filter'].emit('input');
    assert.match(e['#filter-count'].textContent, /^0 \/ 148/);
    assert.match(e['#plant-list'].innerHTML, /没有匹配/);
});

test('poem index links related plants and supports filtering and empty states', () => {
    const { elements: e } = boot(['poem-list', 'poem-filter', 'poem-summary']);
    assert.match(e['#poem-summary'].textContent, /141 \/ 141/);
    e['#poem-filter'].value = '关雎';
    e['#poem-filter'].emit('input');
    assert.match(e['#poem-list'].innerHTML, /《关雎》/);
    assert.match(e['#poem-list'].innerHTML, /list.html#124/);
    e['#poem-filter'].value = '不存在的篇目名称';
    e['#poem-filter'].emit('input');
    assert.match(e['#poem-list'].innerHTML, /没有匹配的篇目/);
});
