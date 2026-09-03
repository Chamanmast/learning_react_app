// One-time migration: learning/*.html -> src/content/*.json + src/data/guides.json
// Run: npm run migrate   (from react-version/)
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEARN = join(ROOT, '..', 'learning');
const OUT = join(ROOT, 'src', 'content');
const DATA = join(ROOT, 'src', 'data');
mkdirSync(OUT, { recursive: true });
mkdirSync(DATA, { recursive: true });

const read = (p) => readFileSync(p, 'utf8');
const write = (p, v) => writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v));

// ---- 1. GUIDES (hub data) ----
const hubHtml = read(join(LEARN, 'index.html'));
const guidesSrc = hubHtml.match(/var GUIDES = ([\s\S]*?)\n    \];/)[1] + '\n    ]';
const GUIDES = eval(guidesSrc); // trusted local content, plain data array

const routeFor = (file) => {
  const slug = file.replace(/\.html$/, '');
  if (file === 'interview-quiz.html') return { route: '/quiz', kind: 'quiz', slug };
  if (file === 'practice.html') return { route: '/mcq', kind: 'mcq', slug };
  if (file === 'problems.html') return { route: '/cases', kind: 'cases', slug };
  if (file === 'interview.html' || file === 'laravel-interview.html') return { route: `/qa/${slug}`, kind: 'qa', slug };
  if (/tips\.html$/.test(file)) return { route: `/tips/${slug}`, kind: 'tips', slug };
  return { route: `/guide/${slug}`, kind: 'guide', slug };
};

const fileToRoute = {};
const guides = GUIDES.map((g) => {
  const r = routeFor(g.file);
  fileToRoute[g.file] = '#' + r.route;
  return { ...g, ...r };
});
// laravel-tips.html exists on disk but has no hub card yet — add it so it gets a route
if (!guides.some((g) => g.file === 'laravel-tips.html')) {
  const extra = {
    shelf: 'Get hired', file: 'laravel-tips.html', code: 'LV+', name: 'Laravel Tips',
    sub: '300+ tips · backend', desc: '350+ quick Laravel wins with copy-paste code.', hello: '350+ tips',
    level: 2, time: '1 wk', routes: ['backend'], tags: 'laravel tips tricks interview',
  };
  const r = routeFor(extra.file);
  fileToRoute[extra.file] = '#' + r.route;
  guides.push({ ...extra, ...r });
  console.log('added laravel-tips route');
}
write(join(DATA, 'guides.json'), guides);
console.log(`guides: ${guides.length}`);

// string-aware bracket matcher: returns the [...] or {...} literal starting at openIdx
const extractBalancedAt = (html, openIdx, openCh) => {
  const closeCh = openCh === '{' ? '}' : ']';
  let depth = 0, quote = null;
  for (let i = openIdx; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === openCh) depth++;
    else if (c === closeCh) { depth--; if (depth === 0) return html.slice(openIdx, i + 1); }
  }
  return null;
};
// string-aware brace matcher: returns the {...} object literal following a marker
const extractBalanced = (html, marker) => {
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const open = html.indexOf('{', start + marker.length);
  return extractBalancedAt(html, open, '{');
};
const cleanHtml = ($, root) => {
  root.find('script').remove();
  root.find('[onload],[onclick],[onerror]').removeAttr('onload').removeAttr('onclick').removeAttr('onerror');
  let html = root.html() || '';
  html = html.replaceAll('../lib/', './lib/').replaceAll('../assets/', './assets/');
  // hub + sibling links -> hash routes
  html = html.replace(/href="\.\.\/index\.html"/g, 'href="#/"').replace(/href="index\.html"/g, 'href="#/"');
  html = html.replace(/href="([A-Za-z0-9_.\-]+\.html)"/g, (m, f) => (fileToRoute[f] ? `href="${fileToRoute[f]}"` : m));
  return html;
};
const accOf = (html, fallback = '#e4572e') => {
  const m = html.match(/--acc:\s*(#[0-9a-fA-F]{3,8})/);
  return m ? m[1] : fallback;
};

// ---- 2. pages ----
let counts = { guide: 0, tips: 0, qa: 0, quiz: 0, mcq: 0, cases: 0 };
for (const g of guides) {
  const src = join(LEARN, g.file);
  if (!existsSync(src)) { console.log(`SKIP missing ${g.file}`); continue; }
  const html = read(src);
  const $ = cheerio.load(html);
  const title = ($('title').first().text() || g.name).trim();

  if (g.kind === 'guide') {
    const sidebar = $('#sidebar').html() || '';
    let main = $('#main');
    if (!main.length) main = $('.learn-main').first(); // ai-roadmap variant
    if (!main.length) main = $('main').first();
    main.find('script').remove();
    const content = cleanHtml($, main);
    write(join(OUT, `guide-${g.slug}.json`), {
      slug: g.slug, title, acc: accOf(html), sidebar, content,
    });
    counts.guide++;
  } else if (g.kind === 'tips') {
    const balanced = extractBalanced(html, 'TIPS_DATA');
    if (!balanced) { console.log(`SKIP no TIPS_DATA in ${g.file}`); continue; }
    const tips = eval('(' + balanced + ')');
    // some pages append further sections via TIPS_DATA['x'] = [...]
    const assignRe = /TIPS_DATA\['([^']+)'\] = \[/g;
    let am;
    while ((am = assignRe.exec(html)) !== null) {
      const arrSrc = extractBalancedAt(html, am.index + am[0].length - 1, '[');
      if (arrSrc) {
        try { tips[am[1]] = eval('(' + arrSrc + ')'); }
        catch (e) { console.log(`WARN tips append ${g.file}:${am[1]} ${e.message}`); }
      }
    }
    const pageKey = (html.match(/key:\s*'([^']+)'/) || [])[1] || g.slug;
    const guideLink = $('.guide-link').attr('href') || '';
    const sections = [];
    $('section[id]').each((_, el) => {
      const id = $(el).attr('id');
      const h2 = $(el).find('h2').first().clone();
      h2.find('.count').remove();
      sections.push({ id, title: h2.text().trim(), desc: $(el).find('.section-desc').first().text().trim() });
    });
    write(join(OUT, `tips-${g.slug}.json`), {
      slug: g.slug, title, acc: accOf(html), pageKey, guideLink, sections, tips,
    });
    counts.tips++;
  } else if (g.kind === 'qa') {
    const raw = $('#qData').html() || '[]';
    const questions = JSON.parse(raw);
    const grab = (name) => {
      const m = html.match(new RegExp(`const ${name} = (\\{[^\\n]*\\});`))
        || html.match(new RegExp(`const ${name} = (\\[[^\\n]*\\]);`))
        || html.match(new RegExp(`const ${name} = ([\\s\\S]*?\\n[\\}\\]]);`));
      if (!m) return (name.includes('ORDER') ? [] : {});
      return eval('(' + m[1].replace(/;$/, '') + ')');
    };
    write(join(OUT, `qa-${g.slug}.json`), {
      slug: g.slug, title,
      acc: g.slug === 'laravel-interview' ? '#f9322c' : '#c9a227',
      sidebar: $('#sidebar').html() || '',
      questions,
      names: grab('SECTION_NAMES'), parents: grab('SECTION_PARENT'),
      parentLabels: grab('PARENT_LABELS'), descs: grab('SECTION_DESCS'),
      icons: grab('SECTION_ICONS'), order: grab('SECTION_ORDER'),
    });
    counts.qa++;
  } else if (g.kind === 'quiz') {
    const questions = JSON.parse($('#questionsData').html() || '[]');
    write(join(OUT, 'quiz.json'), { slug: g.slug, title, questions });
    counts.quiz++;
  } else if (g.kind === 'mcq') {
    const questions = JSON.parse($('#questionsData').html() || '[]');
    write(join(OUT, 'mcq.json'), { slug: g.slug, title, questions });
    counts.mcq++;
  } else if (g.kind === 'cases') {
    const questions = JSON.parse($('#problemsData').html() || '[]');
    write(join(OUT, 'cases.json'), {
      slug: g.slug, title, acc: accOf(html, '#ff9933'),
      sidebar: $('#sidebar').html() || '', questions,
    });
    counts.cases++;
  }
}
console.log(counts);

// ---- 3. vendor assets -> public ----
for (const d of ['lib', 'assets']) {
  const from = join(ROOT, '..', d), to = join(ROOT, 'public', d);
  if (existsSync(from)) { cpSync(from, to, { recursive: true }); console.log(`copied public/${d}`); }
}
console.log('migrate done');
