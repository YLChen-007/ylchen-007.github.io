import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
assert.match(html, /<html lang="en">/, 'The homepage must be in English');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Expected one main heading');
assert.ok(html.includes(site.email) && html.includes(site.name), 'Missing contact details');
assert.ok(!/TODO|PLACEHOLDER|lorem ipsum|example\.com/i.test(html), 'Unfinished content');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate element IDs');
for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (value.startsWith('#')) assert.ok(ids.includes(value.slice(1)), `Broken anchor: ${value}`);
  else if (value.startsWith('./')) await access(path.join(root, value));
  else assert.ok(/^(https:\/\/|mailto:)/.test(value), `Unexpected link: ${value}`);
}
const structuredData = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
assert.equal(structuredData.name, site.name);
assert.equal(structuredData.email, site.email);
assert.deepEqual((await readdir(root)).sort(), ['.nojekyll', '404.html', 'assets', 'index.html', 'robots.txt', 'sitemap.xml'].sort(), 'Unexpected public files');
assert.deepEqual((await readdir(path.join(root, 'assets'))).sort(), ['favicon.svg', 'style.css'], 'Unexpected public assets');
for (const file of ['404.html', 'sitemap.xml', 'robots.txt']) await access(path.join(root, file));
console.log('PASS: English content, identity, metadata, navigation, assets, and public-file allowlist.');
