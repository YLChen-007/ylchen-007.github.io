import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';
import { loadArticles } from './blog.mjs';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const root = path.join(siteRoot, 'dist');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const articles = await loadArticles(path.join(siteRoot, 'content', 'blog'));

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
assert.ok(html.includes('id="blog"'), 'Missing blog module');
for (const article of articles) {
  assert.ok(html.includes(`./blog/${article.slug}/`), `${article.slug}: missing homepage card`);
}
assert.ok(!html.includes('id="projects"') && !html.includes('href="#projects"'), 'Removed projects module must not be rendered');
await checkDocument(html, root);
const structuredData = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
assert.equal(structuredData.name, site.name);
assert.equal(structuredData.email, site.email);

for (const article of articles) {
  const articleDirectory = path.join(root, 'blog', article.slug);
  const articleHtml = await readFile(path.join(articleDirectory, 'index.html'), 'utf8');
  assert.ok(articleHtml.includes(`<html lang="${article.language}">`), `${article.slug}: incorrect language`);
  assert.equal((articleHtml.match(/<h1\b/g) || []).length, 1, `${article.slug}: expected one article heading`);
  assert.ok(articleHtml.includes(article.title), `${article.slug}: missing title`);
  if (article.gistUrl) assert.ok(articleHtml.includes(article.gistUrl), `${article.slug}: missing Gist link`);
  assert.ok(!/TODO|PLACEHOLDER|lorem ipsum|example\.com/i.test(articleHtml), `${article.slug}: unfinished content`);
  await checkDocument(articleHtml, articleDirectory);
  const articleData = JSON.parse(articleHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(articleData['@type'], 'BlogPosting');
  assert.equal(articleData.author.name, site.name);
  assert.ok((await readFile(path.join(root, 'sitemap.xml'), 'utf8')).includes(`blog/${article.slug}/`), `${article.slug}: missing from sitemap`);
  assert.deepEqual((await readdir(articleDirectory)).sort(), ['index.html'], `${article.slug}: unexpected article files`);
}

assert.deepEqual((await readdir(root)).sort(), ['.nojekyll', '404.html', 'assets', 'blog', 'index.html', 'robots.txt', 'sitemap.xml'].sort(), 'Unexpected public files');
assert.deepEqual((await readdir(path.join(root, 'assets'))).sort(), ['blog', 'favicon.svg', 'style.css'], 'Unexpected public assets');
const dragonflyDiagramDirectory = path.join(root, 'assets', 'blog', 'dragonfly2-downloadtinyfile-ssrf-analysis');
assert.deepEqual(
  (await readdir(dragonflyDiagramDirectory)).sort(),
  [
    '01-vulnerability-chain.svg',
    '02-component-architecture.svg',
    '03-metadata-relations.svg',
    '04-trust-boundaries.svg',
    '05-normal-tiny-flow.svg',
    '06-redirect-exploit-flow.svg'
  ],
  'Unexpected Dragonfly2 article diagrams'
);
assert.deepEqual((await readdir(path.join(root, 'blog'))).sort(), articles.map(article => article.slug).sort(), 'Unexpected blog routes');
for (const file of ['404.html', 'sitemap.xml', 'robots.txt']) await access(path.join(root, file));
console.log('PASS: homepage, Markdown blog articles, metadata, links, sitemap, assets, and public-file allowlist.');
