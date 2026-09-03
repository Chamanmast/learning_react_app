import { readFileSync, readdirSync } from 'node:fs';
let fail = 0;
const ok = (cond, msg) => { if (!cond) { fail++; console.log('FAIL:', msg); } };
const guides = JSON.parse(readFileSync('src/data/guides.json', 'utf8'));
ok(guides.length >= 39, `guides count ${guides.length}`);
for (const g of guides) ok(g.route && g.slug && g.shelf && g.name, `guide fields ${g.file}`);

const chunks = readdirSync('dist/assets');
for (const g of guides) {
  if (g.kind === 'guide') ok(chunks.some((c) => c.startsWith(`guide-${g.slug}-`)), `chunk guide-${g.slug}`);
  if (g.kind === 'tips') ok(chunks.some((c) => c.startsWith(`tips-${g.slug}-`)), `chunk tips-${g.slug}`);
  if (g.kind === 'qa') ok(chunks.some((c) => c.startsWith(`qa-${g.slug}-`)), `chunk qa-${g.slug}`);
}
ok(chunks.some((c) => c.startsWith('quiz-') && c.endsWith('.js') && !c.startsWith('Quiz-')), 'chunk quiz data');
ok(chunks.some((c) => c.startsWith('mcq-')), 'chunk mcq data');
ok(chunks.some((c) => c.startsWith('cases-')), 'chunk cases data');

for (const f of readdirSync('src/content')) {
  const d = JSON.parse(readFileSync('src/content/' + f, 'utf8'));
  if (f.startsWith('guide-')) {
    ok(typeof d.sidebar === 'string' && typeof d.content === 'string' && d.content.length > 1000, `${f} content`);
    ok(!/<script/i.test(d.content) && !/<script/i.test(d.sidebar), `${f} no scripts`);
  } else if (f.startsWith('tips-')) {
    for (const s of d.sections) ok(Array.isArray(d.tips[s.id]) && d.tips[s.id].length > 0, `${f} section ${s.id}`);
    for (const [k, v] of Object.entries(d.tips)) ok(v.every((t) => t.length === 3), `${f} tip shape ${k}`);
  } else if (f.startsWith('qa-')) {
    ok(d.questions.length > 10, `${f} questions`);
    ok(d.questions.every((x) => x.q && x.a && x.s && x.d), `${f} qa shape`);
    const secs = new Set(d.questions.map((x) => x.s));
    for (const s of d.order) ok(secs.has(s), `${f} order covers ${s}`);
  } else if (f === 'quiz.json' || f === 'mcq.json') {
    ok(d.questions.length > 5, `${f} questions`);
    ok(d.questions.every((x) => x.q && x.a && x.category && x.difficulty), `${f} shape`);
    if (f === 'mcq.json') ok(d.questions.every((x) => Array.isArray(x.options) && Number.isInteger(x.correct)), 'mcq options');
  } else if (f === 'cases.json') {
    ok(d.questions.length > 10, 'cases count');
    ok(d.questions.every((x) => x.q && x.a), 'cases shape');
  }
}
console.log(fail === 0 ? 'ALL DATA CHECKS PASS' : `${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
