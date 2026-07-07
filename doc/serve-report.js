const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD_SCRIPT = path.join(__dirname, 'build-report-content.js');
const DEFAULT_PORT = Number(process.env.PORT || 5178);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function resolveFile(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const fullPath = path.resolve(ROOT, cleanPath);
  if (!fullPath.startsWith(ROOT + path.sep) && fullPath !== ROOT) return null;
  return fullPath;
}

function rebuildContent() {
  const result = spawnSync(process.execPath, [BUILD_SCRIPT], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    const message = [result.stdout, result.stderr].filter(Boolean).join('\n');
    throw new Error(message || 'Failed to build report content.');
  }
}

function handleRequest(req, res) {
  try {
    const urlPath = req.url.split('?')[0];
    if (urlPath === '/data/report-content.js') {
      rebuildContent();
    }

    const filePath = resolveFile(req.url);
    if (!filePath) {
      send(res, 403, 'Forbidden');
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (statErr || !stat.isFile()) {
        send(res, 404, 'Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (error) {
    send(res, 500, error.message || String(error));
  }
}

function listen(port) {
  const server = http.createServer(handleRequest);
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Report server: http://127.0.0.1:${port}/index.html`);
    console.log('Edit markdown files, then refresh the browser page to update displayed copy.');
  });
}

listen(DEFAULT_PORT);
