import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Chrome from '../components/Chrome';
import { useDoc } from '../components/doc';
import { loadCases } from '../lib/content';
import { useSeo, getStaticSeo } from '../lib/seo';
import type { CasesDoc } from '../types';

const uniq = <T,>(arr: T[]): T[] => [...new Set(arr)];

export default function Problems() {
  useSeo({ ...getStaticSeo('/cases'), route: '/cases' });
  const [doc, missing] = useDoc<CasesDoc>('cases', loadCases);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('all');
  const [diff, setDiff] = useState('all');
  const [exp, setExp] = useState('all');
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const tags = useMemo(() => {
    if (!doc) return [];
    const c: Record<string, number> = {};
    doc.questions.forEach((x) => (x.tags || []).forEach((t) => { c[t] = (c[t] || 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [doc]);

  const list = useMemo(() => {
    if (!doc) return [];
    const term = q.trim().toLowerCase();
    return doc.questions.filter((x) =>
      (tag === 'all' || (x.tags || []).includes(tag)) &&
      (diff === 'all' || x.difficulty === diff) &&
      (exp === 'all' || x.exp === exp) &&
      (!term || `${x.q} ${x.a} ${(x.tags || []).join(' ')}`.toLowerCase().includes(term)));
  }, [doc, q, tag, diff, exp]);

  if (missing) return <Chrome acc="#ff9933" sidebarHtml=""><div className="rv-empty"><p>Not found.</p><Link to="/">← Back</Link></div></Chrome>;
  if (!doc) return <Chrome acc="#ff9933" sidebarHtml=""><div className="rv-loading">Loading case problems…</div></Chrome>;

  const diffs = uniq(doc.questions.map((x) => x.difficulty).filter(Boolean));
  const exps = uniq(doc.questions.map((x) => x.exp).filter(Boolean));
  const navHtml = `<div class="brand"><h5>Case Problems</h5><small>${doc.questions.length} scenarios</small></div>
    <div class="py-2"><div class="nav-section">Top tags</div>${tags.slice(0, 12).map(([t]) => `<a class="nav-link" href="#tag-${t}">${t}</a>`).join('')}</div>`;

  return (
    <Chrome acc={doc.acc || '#ff9933'} sidebarHtml={navHtml} label="Case Problems">
      <div className="rv-pagehead">
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Coding Case Problems</h1>
        <p className="text-muted" style={{ fontSize: '.85rem' }}>{doc.questions.length} architecture scenarios with solutions · {list.length} shown · think before you peek</p>
        <div className="rv-toolbar">
          <button className="rv-tbtn" onClick={() => { setQ(''); setTag('all'); setDiff('all'); setExp('all'); }}>Reset filters</button>
        </div>
        <div className="rv-search">
          <i className="bi bi-search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search scenarios, tags, solutions…" aria-label="Search case problems" />
        </div>
        <div><div className="rv-results">Difficulty</div>
          {['all', ...diffs].map((v) => <button key={v} className={`rv-chip${diff === v ? ' active' : ''}`} onClick={() => setDiff(v)}>{v === 'all' ? 'All' : v}</button>)}
        </div>
        <div><div className="rv-results">Experience</div>
          {['all', ...exps].map((v) => <button key={v} className={`rv-chip${exp === v ? ' active' : ''}`} onClick={() => setExp(v)}>{v === 'all' ? 'All' : v}</button>)}
        </div>
        <div><div className="rv-results">Tags ({tags.length})</div>
          <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--bs-border-color)', borderRadius: 10, padding: '.4rem .4rem 0' }}>
            <button className={`rv-chip${tag === 'all' ? ' active' : ''}`} onClick={() => setTag('all')}>All</button>
            {tags.map(([t, n]) => <button key={t} id={`tag-${t}`} className={`rv-chip${tag === t ? ' active' : ''}`} onClick={() => setTag(t)}>{t} · {n}</button>)}
          </div>
        </div>
      </div>
      {list.map((x, i) => {
        const isOpen = open.has(x.id);
        return (
          <div className="rv-case" key={x.id}>
            <button className="rv-qa-q" onClick={() => setOpen((s) => { const n = new Set(s); n.has(x.id) ? n.delete(x.id) : n.add(x.id); return n; })} aria-expanded={isOpen}>
              <span style={{ flex: 1 }}><span className="rv-results">#{i + 1} · {x.category} · {x.difficulty} · {x.exp}</span><br />{x.q}</span>
              <span aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && <div className="rv-qa-a" dangerouslySetInnerHTML={{ __html: x.a }} />}
          </div>
        );
      })}
      {!list.length && <div className="rv-empty">No scenarios match these filters.</div>}
    </Chrome>
  );
}
