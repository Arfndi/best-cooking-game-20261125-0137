// The Golden Ladle — serve.ts
// One job: serve this repository over plain HTTP so the game can be
// play-tested in a desktop browser. Development helper only; the entry
// itself is static files and needs no server to be graded.
// Run: node serve.ts [port]   (default port 8123)
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const port = Number(process.argv[2] || 8123);

const mimeByExt: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

const server = createServer((req, res) => {
  const rawPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safePath = normalize(join(repoRoot, rawPath)).replace(/\\/g, '/');
  if (!safePath.startsWith(repoRoot)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  let target = safePath;
  if (existsSync(target) && statSync(target).isDirectory()) {
    target = join(target, 'index.html');
  }
  if (!existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': mimeByExt[extname(target)] || 'application/octet-stream' });
  res.end(readFileSync(target));
});

server.listen(port, () => {
  console.log(`Golden Ladle dev server at http://127.0.0.1:${port}/game/index.html`);
});
