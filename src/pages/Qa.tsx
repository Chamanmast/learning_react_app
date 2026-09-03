import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Chrome from '../components/Chrome';
import { useDoc } from '../components/doc';
import { loadQa } from '../lib/content';
import { useLocalStorage } from '../lib/hooks';
import { useSeo, getGuideSeo } from '../lib/seo';
import type { QaDoc, QaQuestion, MarkMap } from '../types';

const DIFFS: [string, string][] = [['all', 'All'], ['easy', 'Easy'], ['med', 'Medium'], ['hard', 'Hard']];

export default function Qa() {
  const { slug } = useParams<{ slug: string }>();
  const [doc, missing] = useDoc<QaDoc>(slug, loadQa);
  useSeo({ ...getGuideSeo(slug || ''), route: `/qa/${slug}` });
  const [tab, setTab] = useState('all');
  const [diff, setDiff] = useState('all');
  const [q, setQ] = useState('');
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [marks, setMarks] = useLocalStorage<MarkMap>(`rv-qa:${slug}`, {});

  const order = useMemo(() => {
    if (!doc) return [];
    const present = new Set(doc.questions.map((x) => x.s));
    return (doc.order?.length ? doc.order : [...present]).filter((s) => present.has(s));
  }, [doc]);

  const filtered = useMemo(() => {
    if (!doc) return [];
    const term = q.trim().toLowerCase();
    return doc.questions.filter((x) => {
      if (tab !== 'all' && x.s !== tab) return false;
      if (diff !== 'all' && x.d !== diff) return false;
      if (term && !`${x.q} ${x.a}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [doc, tab, diff, q]);

  if (missing) return <Chrome acc="#c9a227" sidebarHtml=""><div className="rv-empty"><p>Not found.</p><Link to="/">← Back</Link></div></Chrome>;
  if (!doc) return <Chrome acc="#c9a227" sidebarHtml=""><div className="rv-loading">Loading questions…</div></Chrome>;

  const total = doc.questions.length;
  const got = Object.values(marks).filter((m) => m === 'got').length;
  const rev = Object.values(marks).filter((m) => m === 'review').length;
  const toggleReveal = (id: number) => setRevealed((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const mark = (id: number, v: string) => setMarks((m) => ({ ...m, [id]: m[id] === v ? undefined : v }));

  const parents: Record<string, string[]> = {};
  order.forEach((s) => { const p = doc.parents?.[s] || 'other'; (parents[p] = parents[p] || []).push(s); });
  const navHtml = `<div class="brand"><h5>${doc.title.split(' - ')[0]}</h5><small>${total} questions</small></div>
    <div class="py-2">${Object.entries(parents).map(([p, secs]) =>
      `<div class="nav-section">${doc.parentLabels?.[p] || p}</div>` +
      secs.map((s) => `<a class="nav-link" href="#sec-${s}">${doc.names?.[s] || s}</a>`).join('')
    ).join('')}</div>`;

  const grouped = tab === 'all' && !q.trim() && diff === 'all';
  const exportTxt = () => {
    const text = filtered.map((x) => `Q: ${x.q}\nA: ${x.a.replace(/<[^>]+>/g, '')}`).join('\n\n---\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${slug}-questions.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const renderItem = (x: QaQuestion) => (
    <div className="rv-qa-item" key={x.id}>
      <button className="rv-qa-q" onClick={() => toggleReveal(x.id)} aria-expanded={revealed.has(x.id)}>
        <span style={{ flex: 1 }}>{x.q}</span>
        <span className="rv-mark" onClick={(e) => e.stopPropagation()}>
          <button className={`got${marks[x.id] === 'got' ? ' on' : ''}`} onClick={() => mark(x.id, 'got')}>✓ Got it</button>
          <button className={`rev${marks[x.id] === 'review' ? ' on' : ''}`} onClick={() => mark(x.id, 'review')}>Review</button>
        </span>
      </button>
      {revealed.has(x.id) && <div className="rv-qa-a" dangerouslySetInnerHTML={{ __html: x.a }} />}
    </div>
  );

  return (
    <Chrome acc={doc.acc} sidebarHtml={navHtml} label={doc.title}>
      <div className="rv-pagehead">
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>{doc.title.split(' - ')[0]}</h1>
        <p className="text-muted" style={{ fontSize: '.85rem' }}>{total} questions · {revealed.size} revealed · {got} got it · {rev} to review</p>
        <div className="rv-progress"><div style={{ width: `${total ? Math.round((revealed.size / total) * 100) : 0}%` }} /></div>
        <div className="rv-toolbar">
          <button className="rv-tbtn" onClick={exportTxt}>Export ledger (.txt)</button>
          <button className="rv-tbtn" onClick={() => { setQ(''); setTab('all'); setDiff('all'); }}>Reset filters</button>
        </div>
        <div className="rv-search">
          <i className="bi bi-search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions and answers…" aria-label="Search questions" />
        </div>
        <div>
          {DIFFS.map(([v, l]) => <button key={v} className={`rv-chip${diff === v ? ' active' : ''}`} onClick={() => setDiff(v)}>{l}</button>)}
        </div>
      </div>
      <div className="rv-tabs" role="tablist" aria-label="Chapters">
        <button className={`rv-chip${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>All chapters</button>
        {order.map((s) => <button key={s} className={`rv-chip${tab === s ? ' active' : ''}`} onClick={() => setTab(s)}>{doc.names?.[s] || s}</button>)}
      </div>
      <div className="rv-results" style={{ marginBottom: '.6rem' }}>{filtered.length} shown</div>
      {grouped ? order.map((s) => (
        <section key={s} id={`sec-${s}`}>
          <h2 className="rv-h2">{doc.names?.[s] || s} <span className="rv-count">{doc.questions.filter((x) => x.s === s).length}</span></h2>
          {doc.descs?.[s] && <p className="rv-shelf hint">{doc.descs[s]}</p>}
          {doc.questions.filter((x) => x.s === s).map(renderItem)}
        </section>
      )) : filtered.map(renderItem)}
      {!filtered.length && <div className="rv-empty">No questions match. Clear search or filters.</div>}
    </Chrome>
  );
}
