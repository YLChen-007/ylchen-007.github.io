import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';

const escapeAttribute = value => String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
const stripTags = value => value.replace(/<[^>]*>/g, '').trim();
const slugify = value => value
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
  .replace(/^-+|-+$/g, '');

const requireText = (data, field, filename) => {
  if (typeof data[field] !== 'string' || !data[field].trim()) {
    throw new Error(`${filename}: front matter field "${field}" must be a non-empty string`);
  }
  return data[field].trim();
};

const renderMarkdown = source => {
  const toc = [];
  const usedIds = new Map();
  const markdown = new Marked({ gfm: true, breaks: false });

  markdown.use({
    renderer: {
      heading({ tokens, depth }) {
        const rendered = this.parser.parseInline(tokens);
        const label = stripTags(rendered);
        const base = slugify(label) || `section-${toc.length + 1}`;
        const count = usedIds.get(base) || 0;
        const id = count === 0 ? base : `${base}-${count + 1}`;
        usedIds.set(base, count + 1);
        if (depth === 2) toc.push([id, label]);
        return `<h${depth} id="${escapeAttribute(id)}">${rendered}</h${depth}>\n`;
      }
    }
  });

  const html = markdown.parse(source)
    .replaceAll('<table>', '<div class="table-wrap"><table>')
    .replaceAll('</table>', '</table></div>');
  return { html, toc };
};

export const loadArticles = async directory => {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (entries.length === 0) throw new Error(`No Markdown articles found in ${directory}`);

  const articles = await Promise.all(entries.map(async entry => {
    const filename = entry.name;
    const slug = path.basename(filename, '.md');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`${filename}: filename must be a lowercase, hyphen-separated slug`);
    }

    const source = await readFile(path.join(directory, filename), 'utf8');
    const { data, content } = matter(source);
    const title = requireText(data, 'title', filename);
    const description = requireText(data, 'description', filename);
    const publishedValue = data.published instanceof Date
      ? data.published.toISOString().slice(0, 10)
      : requireText(data, 'published', filename);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedValue)) {
      throw new Error(`${filename}: "published" must use YYYY-MM-DD`);
    }
    if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string'))) {
      throw new Error(`${filename}: "tags" must be a list of strings`);
    }

    const { html, toc } = renderMarkdown(content);
    return {
      slug,
      title,
      description,
      published: publishedValue,
      dateLabel: typeof data.dateLabel === 'string' ? data.dateLabel : publishedValue,
      readingTime: typeof data.readingTime === 'string' ? data.readingTime : `约 ${Math.max(1, Math.ceil(content.length / 1000))} 分钟`,
      language: typeof data.language === 'string' ? data.language : 'zh-CN',
      category: typeof data.category === 'string' ? data.category : 'Notes',
      tags: data.tags || [],
      gistUrl: typeof data.gistUrl === 'string' ? data.gistUrl : null,
      toc,
      html,
      sourceFile: filename
    };
  }));

  return articles.sort((a, b) => b.published.localeCompare(a.published));
};
