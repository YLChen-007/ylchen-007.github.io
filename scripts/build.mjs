import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import site from '../site.config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const external = (url, label, className = 'text-link') => `<a class="${className}" href="${escape(url)}">${escape(label)} <span aria-hidden="true">↗</span></a>`;
const githubIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.6 9.6 0 0 1 12 6.82c.85 0 1.7.11 2.5.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.58 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>';
const mailIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>';
const paperAuthors = authors => authors.map(author => author === site.name ? `<strong>${escape(author)}</strong>` : escape(author)).join(', ');
const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: site.name, url: site.url, email: site.email, jobTitle: site.role, affiliation: { '@type': 'Organization', name: site.affiliation, url: site.affiliationUrl }, sameAs: [site.github] }).replace(/</g, '\\u003c');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#faf9f6">
  <title>${escape(site.name)} | Program Analysis &amp; Software Security</title>
  <meta name="description" content="${escape(site.description)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escape(site.name)} · Academic Homepage">
  <meta property="og:description" content="${escape(site.description)}">
  <meta property="og:url" content="${escape(site.url)}">
  <link rel="canonical" href="${escape(site.url)}">
  <link rel="icon" href="./assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="./assets/style.css">
  <script type="application/ld+json">${schema}</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="#about" aria-label="${escape(site.name)} — home"><span class="brand-mark" aria-hidden="true">yc.</span><span>${escape(site.name)}</span></a>
      <nav class="site-nav" aria-label="Main navigation">
        <a href="#about">About</a><a href="#research">Research</a><a href="#publications">Publications</a><a href="#projects">Projects</a><a href="#contact">Contact <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
  </header>
  <div class="page-layout">
    <aside class="profile-aside" aria-label="Profile">
      <div class="portrait-mark" aria-hidden="true"><span>${escape(site.initials)}</span><span class="portrait-caption">ANALYZE / UNDERSTAND / SECURE</span></div>
      <h2 class="profile-name">${escape(site.name)}</h2>
      <p class="profile-role">${escape(site.role)}</p>
      <p class="profile-affiliation"><a href="${escape(site.affiliationUrl)}">Institute of Computing Technology<br>Chinese Academy of Sciences</a></p>
      <p class="profile-location"><span aria-hidden="true">◎</span> ${escape(site.location)}</p>
      <div class="social-links"><a href="mailto:${escape(site.email)}">${mailIcon}<span>Email</span></a><a href="${escape(site.github)}">${githubIcon}<span>GitHub</span></a></div>
      <p class="profile-caption">Program analysis.<br>Software security.<br>Real-world systems.</p>
    </aside>
    <main id="main" class="main-content">
      <section id="about" class="hero" aria-labelledby="hero-heading">
        <p class="eyebrow"><span aria-hidden="true"></span> SOFTWARE &amp; SYSTEMS SECURITY</p>
        <h1 id="hero-heading" class="hero-title">${site.headline.map(escape).join('<br>')}</h1>
        <p class="hero-description">${escape(site.introduction)}</p>
        <p class="hero-description">${escape(site.researchStatement)}</p>
        <div class="hero-actions"><a class="button button-primary" href="#publications">Explore my research <span aria-hidden="true">↓</span></a><a class="button button-secondary" href="mailto:${escape(site.email)}">Get in touch <span aria-hidden="true">↗</span></a></div>
      </section>
      <section id="research" class="section" aria-labelledby="research-heading">
        <div class="section-heading"><h2 id="research-heading">Research interests</h2><span class="section-kicker" aria-hidden="true">01 / FOCUS</span></div>
        <div class="interests">${site.interests.map((interest, i) => `<article class="interest"><span class="interest-number" aria-hidden="true">0${i + 1}</span><div class="interest-body"><h3>${escape(interest.title)}</h3><p>${escape(interest.description)}</p></div></article>`).join('')}</div>
      </section>
      <section id="publications" class="section" aria-labelledby="publications-heading">
        <div class="section-heading"><h2 id="publications-heading">Selected publications</h2><span class="section-kicker" aria-hidden="true">02 / PAPERS</span></div>
        <div class="publication-list">${site.publications.map(paper => `<article class="publication"><div class="publication-meta"><span class="venue">${escape(paper.venue)}</span><span>${escape(paper.note)}</span></div><h3 class="publication-title">${escape(paper.title)}</h3>${paper.authors.length ? `<p class="authors">${paperAuthors(paper.authors)}</p>` : ''}<p class="publication-description">${escape(paper.description)}</p><div class="publication-links">${paper.links.map(link => external(link.url, link.label)).join('')}</div></article>`).join('')}</div>
      </section>
      <section id="projects" class="section" aria-labelledby="projects-heading">
        <div class="section-heading"><h2 id="projects-heading">Code &amp; research artifacts</h2><span class="section-kicker" aria-hidden="true">03 / OPEN SOURCE</span></div>
        <div class="project-list">${site.projects.map(project => `<article class="project"><div class="project-code" aria-hidden="true">${project.type === 'RESEARCH DATA' ? '[ ]' : '&lt;/&gt;'}</div><div class="project-body"><span class="project-type">${escape(project.type)}</span><h3>${escape(project.name)}</h3><p>${escape(project.description)}</p>${external(project.url, project.label, 'project-link text-link')}</div></article>`).join('')}</div>
      </section>
      <section id="security" class="section" aria-labelledby="security-heading">
        <div class="section-heading"><h2 id="security-heading">Security research</h2><span class="section-kicker" aria-hidden="true">04 / DISCLOSURES</span></div>
        ${site.disclosures.map(item => `<article class="publication"><div class="publication-meta"><span class="venue">${escape(item.project)}</span><span>Reported &amp; fixed</span></div><h3 class="publication-title">${escape(item.title)}</h3><p class="publication-description">${escape(item.description)}</p>${external(item.url, item.label)}</article>`).join('')}
      </section>
      <section id="contact" class="contact-section" aria-labelledby="contact-heading">
        <p class="eyebrow">LET’S CONNECT</p><h2 id="contact-heading" class="contact-title">Have a research question<br>or an idea to explore?</h2><p>I welcome conversations about program analysis, software security, and AI agents.</p><a class="email-link" href="mailto:${escape(site.email)}">${escape(site.email)} <span aria-hidden="true">↗</span></a>
      </section>
    </main>
  </div>
  <footer class="site-footer"><div class="footer-inner"><p>© ${new Date().getUTCFullYear()} ${escape(site.name)}</p><p>Built with curiosity. Hosted on GitHub Pages.</p><a href="#about">Back to top <span aria-hidden="true">↑</span></a></div></footer>
</body>
</html>
`;

await mkdir(path.join(output, 'assets'), { recursive: true });
await writeFile(path.join(output, 'index.html'), html);
for (const asset of ['style.css', 'favicon.svg']) await copyFile(path.join(root, 'assets', asset), path.join(output, 'assets', asset));
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}sitemap.xml\n`);
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(site.url)}</loc></url></urlset>\n`);
await writeFile(path.join(output, '404.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | ${escape(site.name)}</title><style>body{margin:10vh auto;padding:24px;max-width:640px;background:#faf9f6;color:#183f36;font:18px/1.7 system-ui}h1{font:48px Georgia,serif}a{color:inherit}</style></head><body><p>404 / PAGE NOT FOUND</p><h1>Let’s find your way back.</h1><p>This page may have moved or the link may be incorrect.</p><a href="${escape(site.url)}">Return to ${escape(site.name)}’s homepage →</a></body></html>`);
console.log(`Built homepage: ${path.join(output, 'index.html')}`);
