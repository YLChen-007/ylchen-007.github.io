import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const articleDirectory = path.join(root, 'blog', 'cpython-htmlparser-quadratic-dos');
const articleHtml = await readFile(path.join(articleDirectory, 'index.html'), 'utf8');

const checkDocument = async (document, directory) => {
  const ids = [...document.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'Duplicate element IDs');
  for (const [, value] of document.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (value.startsWith('#')) assert.ok(ids.includes(value.slice(1)), `Broken anchor: ${value}`);
    else if (value.startsWith('./') || value.startsWith('../')) await access(path.resolve(directory, value.split('#')[0]));
    else assert.ok(/^(https:\/\/|mailto:)/.test(value), `Unexpected link: ${value}`);
  }
};

assert.match(html, /<html lang="en">/, 'The homepage must be in English');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Expected one main heading');
assert.ok(html.includes(site.email) && html.includes(site.name), 'Missing contact details');
assert.ok(!/TODO|PLACEHOLDER|lorem ipsum|example\.com/i.test(html), 'Unfinished content');
assert.ok(html.includes('id="blog"') && html.includes('./blog/cpython-htmlparser-quadratic-dos/'), 'Missing blog module');
assert.ok(!html.includes('id="projects"') && !html.includes('href="#projects"'), 'Removed projects module must not be rendered');
await checkDocument(html, root);
const structuredData = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
assert.equal(structuredData.name, site.name);
assert.equal(structuredData.email, site.email);

assert.match(articleHtml, /<html lang="zh-CN">/, 'The article must declare Chinese content');
assert.equal((articleHtml.match(/<h1\b/g) || []).length, 1, 'Expected one article heading');
assert.ok(articleHtml.includes('CVE-2026-15308') && articleHtml.includes('a5f267d2d8769366baaa32de6386de6e'), 'Missing report evidence or EXP link');
assert.ok(!/TODO|PLACEHOLDER|lorem ipsum|example\.com/i.test(articleHtml), 'Unfinished article content');
await checkDocument(articleHtml, articleDirectory);
const articleData = JSON.parse(articleHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
assert.equal(articleData['@type'], 'BlogPosting');
assert.equal(articleData.author.name, site.name);

assert.deepEqual((await readdir(root)).sort(), ['.nojekyll', '404.html', 'assets', 'blog', 'index.html', 'robots.txt', 'sitemap.xml'].sort(), 'Unexpected public files');
assert.deepEqual((await readdir(path.join(root, 'assets'))).sort(), ['favicon.svg', 'style.css'], 'Unexpected public assets');
assert.deepEqual((await readdir(path.join(root, 'blog'))).sort(), ['cpython-htmlparser-quadratic-dos'], 'Unexpected blog routes');
assert.deepEqual((await readdir(articleDirectory)).sort(), ['index.html'], 'Unexpected article files');
for (const file of ['404.html', 'sitemap.xml', 'robots.txt']) await access(path.join(root, file));
assert.ok((await readFile(path.join(root, 'sitemap.xml'), 'utf8')).includes('blog/cpython-htmlparser-quadratic-dos/'), 'Article missing from sitemap');
console.log('PASS: homepage, blog module, Chinese article, metadata, links, sitemap, assets, and public-file allowlist.');
