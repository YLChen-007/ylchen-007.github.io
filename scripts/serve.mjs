import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let filename = path.resolve(root, `.${pathname}`);
    if (filename !== root && !filename.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
    if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
    const body = await readFile(filename);
    response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
