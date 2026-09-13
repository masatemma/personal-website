// Page-weight and zero-JS guard for the built site. Runs after `astro build`.
//
// For each HTML page it adds up the gzipped size of the document and of every
// same-origin resource the page loads (stylesheets, scripts, images, icons),
// which approximates bytes transferred on a cold visit. It fails when:
//   - any page exceeds BUDGET_BYTES (50 KB)
//   - the stylesheet exceeds CSS_RAW_BYTES (10 KB uncompressed)
//   - any page ships executable JavaScript (JSON-LD is data, so it's allowed)

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const BUDGET_BYTES = 50 * 1024;
const CSS_RAW_BYTES = 10 * 1024;
const base = (process.env.BASE || '/').replace(/\/?$/, '/');

const COMPRESSIBLE = /\.(html|css|js|svg|xml|txt|json)$/;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

/** Bytes on the wire: gzip for text, raw for already-compressed formats. */
const transferSize = (path) => {
  const bytes = readFileSync(path);
  return COMPRESSIBLE.test(path) ? gzipSync(bytes, { level: 6 }).length : bytes.length;
};

/** Map a URL in the HTML to a file in dist, or null if it's external. */
const toFile = (url) => {
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:')) return null;
  const path = url.split(/[?#]/)[0];
  const withinBase = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\//, '');
  return join(DIST, withinBase);
};

const failures = [];
const pages = walk(DIST).filter((path) => path.endsWith('.html'));

console.log('Page weight (gzipped, cold cache)\n');

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const resources = new Set();

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/rel="(stylesheet|icon|preload|modulepreload)"/.test(tag)) continue;
    const href = tag.match(/href="([^"]+)"/)?.[1];
    if (href) resources.add(href);
  }
  for (const match of html.matchAll(/<(?:img|script|source)\b[^>]*\bsrc(?:set)?="([^"\s]+)/gi)) {
    resources.add(match[1]);
  }

  const rows = [['  document', transferSize(page)]];
  for (const url of resources) {
    const file = toFile(url);
    if (!file) continue;
    if (!existsSync(file)) {
      failures.push(`${relative(DIST, page)}: missing resource ${url}`);
      continue;
    }
    rows.push([`  ${relative(DIST, file)}`, transferSize(file)]);
  }

  const total = rows.reduce((sum, [, size]) => sum + size, 0);
  console.log(`${relative(DIST, page).padEnd(40)} ${kb(total).padStart(9)} total`);
  for (const [name, size] of rows) console.log(`${name.padEnd(40)} ${kb(size).padStart(9)}`);
  if (total > BUDGET_BYTES) failures.push(`${relative(DIST, page)} is ${kb(total)}, budget ${kb(BUDGET_BYTES)}`);

  const scripts = [...html.matchAll(/<script\b[^>]*>/gi)].filter(
    ([tag]) => !/type="application\/ld\+json"/.test(tag),
  );
  if (scripts.length > 0) failures.push(`${relative(DIST, page)} ships ${scripts.length} script tag(s)`);
}

const jsFiles = walk(DIST).filter((path) => /\.m?js$/.test(path));
if (jsFiles.length > 0) failures.push(`JavaScript in build output: ${jsFiles.join(', ')}`);

for (const css of walk(DIST).filter((path) => path.endsWith('.css'))) {
  const size = statSync(css).size;
  console.log(`\n${relative(DIST, css)}: ${kb(size)} raw, ${kb(transferSize(css))} gzipped`);
  if (size > CSS_RAW_BYTES) failures.push(`${relative(DIST, css)} is ${kb(size)} raw, budget ${kb(CSS_RAW_BYTES)}`);
}

if (!existsSync(join(DIST, 'resume.pdf'))) {
  console.warn('\nWarning: public/resume.pdf is missing, so résumé links will 404.');
}

if (failures.length > 0) {
  console.error(`\nBudget check failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  process.exit(1);
}
console.log('\nBudget check passed.');
