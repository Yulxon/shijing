/** Shared content and navigation rules; this module has no DOM or filesystem dependencies. */
export const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
export const excerptText = plant => plant.sections.flatMap(section => [section.title, ...section.blocks.map(block => block.text)]).join(' ');
// Five historical records omit the heading between the poem list and source excerpts.
// Normalize their reading structure without changing any transcribed content.
export function readingSections(plant) {
    return plant.sections.flatMap(section => {
        const firstSource = section.blocks.findIndex(block => block.kind === 'source');
        if (section.title !== '出现篇目' || firstSource < 0) return [section];
        return [
            { ...section, blocks: section.blocks.slice(0, firstSource) },
            { id: `${section.id}-records`, title: '古代记载', blocks: section.blocks.slice(firstSource) }
        ];
    });
}
export const searchPlants = (plants, query) => {
    const terms = normalize(query).split(' ').filter(Boolean);
    return plants.filter(plant => terms.every(term => normalize(`${plant.name} ${plant.poems.join(' ')} ${plant.searchText || ''}`).includes(term)));
};
export const resolvePlantId = (hash, plants) => {
    const id = /^#\d+$/.test(hash) ? Number(hash.slice(1)) : NaN;
    return plants.some(plant => plant.id === id) ? id : plants[0]?.id;
};
export function groupPoems(plants) {
    const poems = new Map();
    for (const plant of plants) for (const name of plant.poems) {
        if (!poems.has(name)) poems.set(name, []);
        poems.get(name).push(plant);
    }
    return [...poems].map(([name, plants]) => ({ name, plants }));
}
export function validatePlants(plants) {
    if (!Array.isArray(plants) || !plants.length) throw new Error('植物资料不能为空');
    const ids = new Set();
    const urls = new Set();
    for (const plant of plants) {
        if (!Number.isSafeInteger(plant.id) || plant.id < 1 || ids.has(plant.id)) throw new Error(`植物编号无效或重复：${plant.id}`);
        ids.add(plant.id);
        if (!plant.name?.trim() || !/^pages\/\d+[^/]*\.html$/.test(plant.url) || urls.has(plant.url)) throw new Error(`植物名称或路径无效：${plant.id}`);
        urls.add(plant.url);
        if (!Array.isArray(plant.poems) || !plant.poems.length || plant.poems.some(poem => typeof poem !== 'string' || !poem.trim())) throw new Error(`${plant.name} 缺少篇目`);
        if (!Array.isArray(plant.sections) || !plant.sections.length) throw new Error(`${plant.name} 缺少正文`);
        const sections = new Set();
        for (const section of plant.sections) {
            if (!section.title || !section.id || sections.has(section.id) || !Array.isArray(section.blocks)) throw new Error(`${plant.name} 正文章节无效`);
            sections.add(section.id);
            if (section.blocks.some(block => !['paragraph', 'source'].includes(block.kind) || typeof block.text !== 'string' || !block.text.trim())) throw new Error(`${plant.name} 正文段落无效`);
        }
        if (!Array.isArray(plant.images) || plant.images.some(image => !/^pages\/pic\/[^/]+$/.test(image.src) || typeof image.caption !== 'string' || !image.alt)) throw new Error(`${plant.name} 图谱无效`);
    }
    return plants;
}
