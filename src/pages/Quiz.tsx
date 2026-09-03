import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Chrome from '../components/Chrome';
import { useDoc } from '../components/doc';
import { loadQuiz } from '../lib/content';
import { useLocalStorage } from '../lib/hooks';
import { useSeo, getStaticSeo } from '../lib/seo';
import type { QuizDoc, QuizQuestion, MarkMap } from '../types';

const uniq = <T,>(arr: T[]): T[] => [...new Set(arr)];

export default function Quiz() {
  useSeo({ ...getStaticSeo('/quiz'), route: '/quiz' });
  const [doc, missing] = useDoc<QuizDoc>('quiz', loadQuiz);
  const [exp, setExp] = useState('all');
  const [diff, setDiff] = useState('all');
  const [cat, setCat] = useState('all');
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [marks, setMarks] = useLocalStorage<MarkMap>('rv-quiz-marks', {});

  const deck = useMemo(() => {
    if (!doc) return [];
    return doc.questions.filter((x) =>
      (exp === 'all' || x.exp === exp) &&
      (diff === 'all' || x.difficulty === diff) &&
      (cat === 'all' || x.category === cat));
  }, [doc, exp, diff, cat]);

  useEffect(() => { setIdx(0); setRevealed(false); }, [exp, diff, cat]);
  const cur = deck[Math.min(idx, Math.max(deck.length - 1, 0))];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea')) return;
      if (e.code === 'Space') { e.preventDefault(); setRevealed((r) => !r); }
      if (e.key === 'ArrowRight') { setIdx((i) => Math.min(i + 1, deck.length - 1)); setRevealed(false); }
      if (e.key === 'ArrowLeft') { setIdx((i) => Math.max(i - 1, 0)); setRevealed(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deck.length]);

  if (missing) return <Chrome acc="#c9a227" sidebarHtml=""><div className="rv-empty"><p>Not found.</p><Link to="/">← Back</Link></div></Chrome>;
  if (!doc) return <Chrome acc="#c9a227" sidebarHtml=""><div className="rv-loading">Loading flashcards…</div></Chrome>;

  const exps = uniq(doc.questions.map((x) => x.exp).filter(Boolean));
  const diffs = uniq(doc.questions.map((x) => x.difficulty).filter(Boolean));
  const cats = uniq(doc.questions.map((x) => x.category).filter(Boolean));
  const answered = Object.keys(marks).length;
  const got = Object.values(marks).filter((m) => m === 'got').length;
  const rev = Object.values(marks).filter((m) => m === 'review').length;
  const chip = (v: string, curV: string, set: (v: string) => void) => (
    <button key={v} className={`rv-chip${curV === v ? ' active' : ''}`} onClick={() => set(v)}>{v === 'all' ? 'All' : v}</button>
  );
  const mark = (v: string) => cur && setMarks((m) => ({ ...m, [cur.id]: m[cur.id] === v ? undefined : v }));

  const navHtml = `<div class="brand"><h5>Interview Quiz</h5><small>${doc.questions.length} flashcards</small></div>`;

  return (
    <Chrome acc="#c9a227" sidebarHtml={navHtml} label="Interview Quiz">
      <div className="rv-pagehead">
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Interview Quiz</h1>
        <p className="text-muted" style={{ fontSize: '.85rem' }}>{doc.questions.length} questions · {deck.length} shown · {answered} answered</p>
        <div className="rv-progress"><div style={{ width: `${doc.questions.length ? Math.round((answered / doc.questions.length) * 100) : 0}%` }} /></div>
        <div style={{ fontSize: '.78rem' }}>Got it: <b style={{ color: '#17b26a' }}>{got}</b> · To review: <b style={{ color: '#b45309' }}>{rev}</b></div>
      </div>
      <div><div className="rv-results">Experience</div>{['all', ...exps].map((v) => chip(v, exp, setExp))}</div>
      <div><div className="rv-results">Difficulty</div>{['all', ...diffs].map((v) => chip(v, diff, setDiff))}</div>
      <div><div className="rv-results">Category ({cats.length})</div>
        <div style={{ maxHeight: 132, overflowY: 'auto', border: '1px solid var(--bs-border-color)', borderRadius: 10, padding: '.4rem .4rem 0' }}>
          {['all', ...cats].map((v) => chip(v, cat, setCat))}
        </div>
      </div>
      {!deck.length && <div className="rv-empty">No cards match these filters.</div>}
      {cur && (
        <>
          <div className="rv-flash" onClick={() => setRevealed((r) => !r)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setRevealed((r) => !r); }}
            aria-label={revealed ? 'Hide answer' : 'Reveal answer'}>
            <div className="rv-results">Card {idx + 1} / {deck.length} · {cur.category} · {cur.difficulty} · {cur.exp}</div>
            <div className="fq">{cur.q}</div>
            {revealed ? <div className="fa" dangerouslySetInnerHTML={{ __html: cur.a }} />
              : <div className="fa">Click, press <kbd>Space</kbd>, or hit Reveal to see the answer.</div>}
          </div>
          <div className="rv-flash-nav">
            <button onClick={() => { setIdx((i) => Math.max(i - 1, 0)); setRevealed(false); }} disabled={idx === 0}>← Prev</button>
            <button className="primary" onClick={() => setRevealed((r) => !r)}>{revealed ? 'Hide' : 'Reveal'}</button>
            <button onClick={() => { setIdx(Math.floor(Math.random() * deck.length)); setRevealed(false); }}>Shuffle</button>
            <button onClick={() => { setIdx((i) => Math.min(i + 1, deck.length - 1)); setRevealed(false); }} disabled={idx >= deck.length - 1}>Next →</button>
          </div>
          <div className="rv-flash-nav">
            <button style={marks[cur.id] === 'got' ? { borderColor: '#17b26a', color: '#17b26a' } : undefined} onClick={() => mark('got')}>✓ Got it</button>
            <button style={marks[cur.id] === 'review' ? { borderColor: '#b45309', color: '#b45309' } : undefined} onClick={() => mark('review')}>To review</button>
          </div>
        </>
      )}
    </Chrome>
  );
}
