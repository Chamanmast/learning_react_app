import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Chrome from '../components/Chrome';
import { useDoc } from '../components/doc';
import { loadMcq } from '../lib/content';
import { useSeo, getStaticSeo } from '../lib/seo';
import type { McqDoc } from '../types';

const uniq = <T,>(arr: T[]): T[] => [...new Set(arr)];

export default function Mcq() {
  useSeo({ ...getStaticSeo('/mcq'), route: '/mcq' });
  const [doc, missing] = useDoc<McqDoc>('mcq', loadMcq);
  const [diff, setDiff] = useState('all');
  const [cat, setCat] = useState('all');
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    if (!doc) return [];
    const term = q.trim().toLowerCase();
    return doc.questions.filter((x) =>
      (diff === 'all' || x.difficulty === diff) &&
      (cat === 'all' || x.category === cat) &&
      (!term || `${x.q} ${x.a}`.toLowerCase().includes(term)));
  }, [doc, diff, cat, q]);

  if (missing) return <Chrome acc="#0e7c7b" sidebarHtml=""><div className="rv-empty"><p>Not found.</p><Link to="/">← Back</Link></div></Chrome>;
  if (!doc) return <Chrome acc="#0e7c7b" sidebarHtml=""><div className="rv-loading">Loading practice questions…</div></Chrome>;

  const diffs = uniq(doc.questions.map((x) => x.difficulty).filter(Boolean));
  const cats = uniq(doc.questions.map((x) => x.category).filter(Boolean));
  const answered = Object.keys(picked).length;
  const correct = Object.entries(picked).filter(([id, i]) => doc.questions.find((x) => String(x.id) === id)?.correct === i).length;
  const navHtml = `<div class="brand"><h5>Practice MCQ</h5><small>${doc.questions.length} questions</small></div>`;

  return (
    <Chrome acc="#0e7c7b" sidebarHtml={navHtml} label="Practice MCQ">
      <div className="rv-pagehead">
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Practice MCQ</h1>
        <p className="text-muted" style={{ fontSize: '.85rem' }}>
          Pick an answer for instant feedback. Score: <b>{correct}/{answered}</b> · {list.length} shown
        </p>
        <div className="rv-progress"><div style={{ width: `${doc.questions.length ? Math.round((answered / doc.questions.length) * 100) : 0}%` }} /></div>
        <div className="rv-toolbar"><button className="rv-tbtn" onClick={() => setPicked({})}>Reset answers</button></div>
        <div className="rv-search">
          <i className="bi bi-search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions…" aria-label="Search questions" />
        </div>
        <div><div className="rv-results">Difficulty</div>
          {['all', ...diffs].map((v) => <button key={v} className={`rv-chip${diff === v ? ' active' : ''}`} onClick={() => setDiff(v)}>{v === 'all' ? 'All' : v}</button>)}
        </div>
        <div><div className="rv-results">Category ({cats.length})</div>
          <div style={{ maxHeight: 132, overflowY: 'auto', border: '1px solid var(--bs-border-color)', borderRadius: 10, padding: '.4rem .4rem 0' }}>
            {['all', ...cats].map((v) => <button key={v} className={`rv-chip${cat === v ? ' active' : ''}`} onClick={() => setCat(v)}>{v === 'all' ? 'All' : v}</button>)}
          </div>
        </div>
      </div>
      {list.map((x) => {
        const sel = picked[x.id];
        const done = sel !== undefined;
        return (
          <div className="rv-qa-item" key={x.id} style={{ padding: '.9rem 1rem' }}>
            <div className="rv-results">{x.category} · {x.difficulty} · {x.exp}</div>
            <p style={{ fontWeight: 700 }}>{x.q}</p>
            {(x.options || []).map((opt, i) => {
              const cls = !done ? '' : i === x.correct ? ' right' : i === sel ? ' wrong' : '';
              return <button key={i} className={`rv-opt${cls}`} disabled={done} onClick={() => setPicked((p) => ({ ...p, [x.id]: i }))}>{opt}</button>;
            })}
            {done && (
              <div style={{ fontSize: '.85rem', color: 'var(--rv-muted)' }}>
                {sel === x.correct ? <b style={{ color: '#17b26a' }}>Correct.</b> : <b style={{ color: '#dc2626' }}>Not quite.</b>}
                {' '}<span dangerouslySetInnerHTML={{ __html: x.a }} />
              </div>
            )}
          </div>
        );
      })}
      {!list.length && <div className="rv-empty">No questions match these filters.</div>}
    </Chrome>
  );
}
