import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from './content.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ttf': 'font/ttf' };
export function createServer(directory = path.join(root, 'dist')) {
    return http.createServer(async (request, response) => {
        if (!['GET', 'HEAD'].includes(request.method)) {
            response.writeHead(405, { Allow: 'GET, HEAD' }).end();
            return;
        }
        const send = (status, body, type = 'text/html; charset=utf-8') => {
            response.writeHead(status, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
            response.end(request.method === 'HEAD' ? undefined : body);
        };
        let name;
        try {
            name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
            if (name.includes('\0')) throw new Error('Invalid path');
        } catch { send(400, 'Bad request', 'text/plain'); return; }
        const target = path.resolve(directory, name);
        if (!target.startsWith(directory + path.sep) || name.split('/').some(part => part.startsWith('.'))) {
            send(404, 'Page not found', 'text/plain');
            return;
        }
        try {
            const body = await fs.readFile(target);
            send(200, body, types[path.extname(target).toLowerCase()] || 'application/octet-stream');
        } catch (error) {
            if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code)) {
                const body = await fs.readFile(path.join(directory, '404.html')).catch(() => 'Page not found');
                send(404, body);
            } else send(500, 'Unable to read page', 'text/plain');
        }
    });
}
export async function startServer() {
    const port = Number(process.env.PORT || 8000);
    const server = createServer();
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', resolve);
    });
    console.log(`Local: http://127.0.0.1:${server.address().port}`);
    return server;
}
if (process.argv[1] === new URL(import.meta.url).pathname) await startServer();
