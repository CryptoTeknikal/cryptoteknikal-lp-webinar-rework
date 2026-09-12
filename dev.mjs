#!/usr/bin/env node
// Dev server for the landing page: static files plus live reload over SSE.
//
//   node dev.mjs [--port 8899] [--no-open]
//
// Zero dependencies - Node's standard library only - so the repo keeps its
// "no build step, no node_modules" promise and index.html stays the shippable
// artifact. The reload snippet is injected on the way out of this server, so it
// never touches the file on disk.
//
// Saving index.html updates the browser straight away. If the edit only touched
// a <style> block the CSS is swapped in place, so scroll position, the open FAQ
// item and the reveal-on-scroll state all survive; any other edit falls back to
// a reload that restores the scroll position.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');
const args = process.argv.slice(2);
const portArg = args.indexOf('--port');
const START_PORT = portArg === -1 ? 8899 : Number(args[portArg + 1]);
const OPEN = !args.includes('--no-open');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// ---------------------------------------------------------------- client shim

const CLIENT = `
(() => {
  const KEY = '__dev_scroll';
  const save = () => { try { sessionStorage.setItem(KEY, String(scrollY)); } catch (e) {} };
  addEventListener('beforeunload', save); // covers a hand-driven refresh too

  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw !== null) {
      sessionStorage.removeItem(KEY);
      const y = +raw;
      // 'instant' matters: the page sets scroll-behavior:smooth on <html>, and a
      // smooth jump gets cancelled by the first layout shift after load.
      const put = () => scrollTo({ top: y, left: 0, behavior: 'instant' });
      put();
      addEventListener('load', () => {
        let tries = 0;
        const settle = () => {
          put();
          dispatchEvent(new Event('scroll')); // wake the reveal-on-scroll pass
          if (Math.abs(scrollY - y) > 2 && tries++ < 20) requestAnimationFrame(settle);
        };
        settle();
      });
    }
  } catch (e) {}

  let badge;
  const flash = (text, tone) => {
    if (!badge) {
      badge = document.createElement('div');
      badge.setAttribute('data-dev-badge', '');
      badge.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:2147483647;' +
        'padding:6px 11px;border-radius:999px;font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;' +
        'letter-spacing:.04em;color:#fff;background:rgba(12,10,18,.92);border:1px solid rgba(255,0,255,.45);' +
        'box-shadow:0 6px 24px rgba(0,0,0,.5);pointer-events:none;opacity:0;transition:opacity .18s ease';
      document.body.appendChild(badge);
    }
    badge.textContent = text;
    badge.style.borderColor = tone === 'warn' ? 'rgba(255,180,60,.55)' : 'rgba(255,0,255,.45)';
    badge.style.opacity = '1';
    clearTimeout(flash.t);
    flash.t = setTimeout(() => { badge.style.opacity = '0'; }, 1100);
  };

  const reload = () => {
    save();
    location.reload();
  };

  const patchCss = (blocks) => {
    const tags = [...document.querySelectorAll('style')];
    if (tags.length !== blocks.length) return reload();
    let touched = 0;
    blocks.forEach((css, i) => {
      if (tags[i].textContent !== css) { tags[i].textContent = css; touched++; }
    });
    if (touched) flash('css updated');
  };

  let dropped = false;
  const es = new EventSource('/__dev/events');
  es.onopen = () => { if (dropped) reload(); };
  es.onerror = () => { dropped = true; flash('dev server offline', 'warn'); };
  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'css') patchCss(msg.blocks);
    else if (msg.type === 'reload') reload();
  };
})();
`;

const SNIPPET = '\n<script data-dev-live-reload>' + CLIENT + '<' + '/script>\n';

// ---------------------------------------------------------------- html diffing

const STYLE_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const styleBlocks = (html) => [...html.matchAll(STYLE_RE)].map((m) => m[1]);
const withoutStyles = (html) => html.replace(STYLE_RE, '<style></style>');

/** Last copy of each html file we served or saw, so a change can be classified. */
const snapshots = new Map();

function classify(path, next) {
  const prev = snapshots.get(path);
  snapshots.set(path, next);
  if (prev === undefined || prev === next) return null;
  const before = styleBlocks(prev);
  const after = styleBlocks(next);
  if (before.length === after.length && withoutStyles(prev) === withoutStyles(next)) {
    return { type: 'css', blocks: after };
  }
  return { type: 'reload' };
}

// ---------------------------------------------------------------- sse clients

const clients = new Set();

function broadcast(msg) {
  const frame = 'data: ' + JSON.stringify(msg) + '\n\n';
  for (const res of clients) res.write(frame);
}

// ---------------------------------------------------------------- file server

function inject(html) {
  const i = html.lastIndexOf('</body>');
  return i === -1 ? html + SNIPPET : html.slice(0, i) + SNIPPET + html.slice(i);
}

function safePath(url) {
  const decoded = decodeURIComponent(url.split('?')[0]);
  const rel = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = join(ROOT, rel);
  if (full !== ROOT && !full.startsWith(ROOT + sep)) return null;
  return decoded.endsWith('/') ? join(full, 'index.html') : full;
}

const server = createServer(async (req, res) => {
  if (req.url.startsWith('/__dev/events')) {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    res.write('retry: 500\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const path = safePath(req.url);
  if (!path) {
    res.writeHead(403, { 'content-type': MIME['.txt'] }).end('Forbidden');
    return;
  }

  try {
    const ext = extname(path).toLowerCase();
    if (ext === '.html') {
      const html = await readFile(path, 'utf8');
      snapshots.set(path, html);
      res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-store' });
      res.end(inject(html));
      return;
    }
    const buf = await readFile(path);
    // Safari will not play a video off a server that ignores Range. It asks for
    // a couple of bytes first, and a 200 carrying the whole file in reply reads
    // as "this server cannot seek", after which the element simply never plays -
    // so the local preview would fail at the one thing the deployed page does
    // fine. The file is already in memory, so answering is a slice of it.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range && buf.length) {
      const last = buf.length - 1;
      const start = range[1] ? Number(range[1]) : Math.max(0, last - Number(range[2]) + 1);
      const end = range[1] && range[2] ? Math.min(Number(range[2]), last) : last;
      if (start > end || start > last) {
        res.writeHead(416, { 'content-range': `bytes */${buf.length}` }).end();
        return;
      }
      res.writeHead(206, {
        'content-type': MIME[ext] || 'application/octet-stream',
        'content-range': `bytes ${start}-${end}/${buf.length}`,
        'content-length': end - start + 1,
        'accept-ranges': 'bytes',
        'cache-control': 'no-store',
      });
      res.end(buf.subarray(start, end + 1));
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'accept-ranges': 'bytes',
      'cache-control': 'no-store',
    });
    res.end(buf);
  } catch (err) {
    res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'content-type': MIME['.txt'] });
    res.end(err.code === 'ENOENT' ? 'Not found' : String(err));
  }
});

// ---------------------------------------------------------------- file watcher

const IGNORE = /(^|[/\\])(\.|node_modules([/\\]|$))/;
// Only these reach the browser, so an editor's atomic-save temp file next to
// index.html cannot trigger a phantom reload.
const WATCHED = new Set([
  '.html', '.css', '.js', '.mjs', '.json', '.svg', '.png', '.jpg', '.jpeg',
  '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2',
]);
const timers = new Map();

function onChange(rel) {
  if (!rel || IGNORE.test(rel) || !WATCHED.has(extname(rel).toLowerCase())) return;
  clearTimeout(timers.get(rel));
  timers.set(
    rel,
    setTimeout(async () => {
      timers.delete(rel);
      const full = join(ROOT, rel);
      if (extname(rel).toLowerCase() === '.html') {
        let html;
        try {
          html = await readFile(full, 'utf8');
        } catch {
          return; // deleted or swapped out mid-write
        }
        const msg = classify(full, html);
        if (msg) {
          broadcast(msg);
          log(rel + ' -> ' + (msg.type === 'css' ? 'css patched in place' : 'reload'));
        }
        return;
      }
      broadcast({ type: 'reload' });
      log(rel + ' -> reload');
    }, 40)
  );
}

const dim = (s) => '\u001b[2m' + s + '\u001b[0m';
const stamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
const log = (msg) => console.log('  ' + dim(stamp()) + '  ' + msg);

// ---------------------------------------------------------------- boot

function listen(port, attempt = 0) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 20) return listen(port + 1, attempt + 1);
    console.error(err.message);
    process.exit(1);
  });
  server.listen(port, () => {
    const url = 'http://localhost:' + port;
    console.log('\n  \u001b[35mcryptoteknikal\u001b[0m dev server');
    console.log('  ' + url + '   ' + dim('(live reload on, ctrl-c to stop)') + '\n');
    watch(ROOT, { recursive: true }, (_event, filename) => onChange(filename));
    if (OPEN) {
      const cmd =
        process.platform === 'darwin'
          ? 'open'
          : process.platform === 'win32'
            ? 'start'
            : 'xdg-open';
      spawn(cmd, [url], {
        stdio: 'ignore',
        detached: true,
        shell: process.platform === 'win32',
      }).unref();
    }
  });
}

listen(Number.isFinite(START_PORT) ? START_PORT : 8899);
