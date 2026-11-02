import fs from 'node:fs';
import path from 'node:path';
import { build } from './build.mjs';
import { startServer } from './serve.mjs';
import { root } from './content.mjs';

await build();
const server = await startServer();
let timer;
let running = false;
let dirty = false;
async function rebuild() {
    dirty = true;
    if (running) return;
    running = true;
    while (dirty) {
        dirty = false;
        try { await build(); console.log('Updated. Refresh the browser to see changes.'); }
        catch (error) { console.error('Build failed:', error.message); }
    }
    running = false;
}
const watchers = ['web', 'content', 'pages/pic', 'src'].map(directory => fs.watch(path.join(root, directory), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => { void rebuild(); }, 150);
}));
function close() {
    clearTimeout(timer);
    watchers.forEach(watcher => watcher.close());
    server.close();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
