import fs from 'node:fs/promises';
import path from 'node:path';
import { validatePlants } from '../web/shared/model.mjs';
export const root = path.resolve(import.meta.dirname, '..');
export async function loadPlants() {
    const directory = path.join(root, 'content/plants');
    const files = (await fs.readdir(directory)).filter(file => /^\d+\.json$/.test(file)).sort();
    const plants = await Promise.all(files.map(async file => JSON.parse(await fs.readFile(path.join(directory, file), 'utf8'))));
    return validatePlants(plants.sort((a, b) => a.id - b.id));
}
