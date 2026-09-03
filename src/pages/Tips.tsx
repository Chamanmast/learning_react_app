import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Chrome from '../components/Chrome';
import { useDoc } from '../components/doc';
import { loadTips, routeForFile } from '../lib/content';
import { useLocalStorage } from '../lib/hooks';
import { useSeo, getGuideSeo } from '../lib/seo';
import type { TipsDoc } from '../types';

function copyText(text: string, done: () => void): void {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
    done();
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(fallback);
  else fallback();
}

export default function Tips() {
  const { slug } = useParams<{ slug: string }>();
  const [doc, missing] = useDoc<TipsDoc>(slug, loadTips);
  useSeo({ ...getGuideSeo(slug || ''), route: `/tips/${slug}` });
  const [query, setQuery] = useState('');
  const [openAll, setOpenAll] = useState(false);
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set());
  const [marks, setMarks] = useLocalStorage<Record<string, boolean>>(`rv-tips-marks:${doc?.pageKey || slug || ''}`, {});
  const [showMarks, setShowMarks] = useState(false);
  const [copied, setCopied] = useState('');

  const counts = useMemo(() => {
    if (!doc) return { total: 0, open: 0, marked: 0 };
    const total = Object.values(doc.tips).reduce((a, t) => a + t.length, 0);
    const marked = Object.keys(marks).length;
    return { total, marked };
  }, [doc, marks]);

  if (missing) return <Chrome acc="#e4572e" sidebarHtml=""><div className="rv-empty"><p>Tips page not found.</p><Link to="/">← Back</Link></div></Chrome>;
  if (!doc) return <Chrome acc="#e4572e" sidebarHtml=""><div className="rv-loading">Loading tips…</div></Chrome>;

  const q = query.trim().toLowerCase();
  const isOpen = (id: string) => openAll || openSet.has(id);
  const toggle = (id: string) => setOpenSet((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleMark = (id: string) => setMarks((m) => { const n = { ...m }; n[id] ? delete n[id] : (n[id] = true); return n; });

  let visible = 0;
  const sections = doc.sections
    .map((s) => {
      const tips = (doc.tips[s.id] || [])
        .map((tip, i) => ({ tip, id: `${s.id}_${i}` }))
        .filter(({ tip: [t, d, c], id }) => {
          if (showMarks && !marks[id]) return false;
          return !q || `${t} ${d} ${c}`.toLowerCase().includes(q);
        });
      return { ...s, tips };
    })
    .filter((s) => {
      if (!s.tips.length) return false;
      visible += s.tips.length;
      return true;
    });

  const navHtml = `<div class="brand"><h5>${doc.title.replace(/ Tips.*$/, '')} Tips</h5><small>${counts.total} inline examples</small></div>
    <div class="py-2">${doc.sections.map((s) => `<a class="nav-link" href="#${s.id}">${s.title}</a>`).join('')}</div>`;

  const random = () => {
    const all: string[] = [];
    doc.sections.forEach((s) => (doc.tips[s.id] || []).forEach((_, i) => all.push(`${s.id}_${i}`)));
    if (!all.length) return;
    const id = all[Math.floor(Math.random() * all.length)];
    setOpenSet((s) => new Set(s).add(id));
    setTimeout(() => document.getElementById(`tip_${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  return (
    <Chrome acc={doc.acc} sidebarHtml={navHtml} label={doc.title}>
      <div className="rv-pagehead">
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{doc.title}</h1>
        <p className="text-muted" style={{ fontSize: '.85rem' }}>
          {counts.total} self-contained tips with inline code. Click any tip to expand.
          {doc.guideLink && <> Full course: <Link to={routeForFile(doc.guideLink)}>open the guide →</Link></>}
        </p>
        <div className="rv-progress"><div style={{ width: `${counts.total ? Math.round((openSet.size / counts.total) * 100) : 0}%` }} /></div>
        <div className="rv-progress-label">{openSet.size} / {counts.total} tips viewed</div>
        <div className="rv-toolbar">
          <button className="rv-tbtn" onClick={() => setOpenAll(true)}>Expand all</button>
          <button className="rv-tbtn" onClick={() => { setOpenAll(false); setOpenSet(new Set()); }}>Collapse all</button>
          <button className="rv-tbtn" onClick={random}>Random tip</button>
          <button className={`rv-tbtn${showMarks ? ' active' : ''}`} onClick={() => setShowMarks((v) => !v)}>
            ★ Bookmarked ({counts.marked})
          </button>
        </div>
        <div className="rv-search">
          <i className="bi bi-search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tips…" aria-label="Search tips" />
        </div>
        <div className="rv-results">{q ? `${visible} tips found` : showMarks ? `${visible} bookmarked` : 'Showing all tips'}</div>
      </div>
      {sections.map((s) => (
        <section key={s.id} id={s.id}>
          <h2 className="rv-h2">{s.title} <span className="rv-count">{(doc.tips[s.id] || []).length}</span></h2>
          {s.desc && <p className="rv-shelf hint">{s.desc}</p>}
          <div className="card"><div className="card-body">
            {s.tips.map(({ tip: [t, d, c], id }) => {
              const open = isOpen(id);
              return (
                <div className="rv-tip" key={id} id={`tip_${id}`}>
                  <button className={`rv-tip-title${open ? ' open' : ''}`} onClick={() => toggle(id)} aria-expanded={open}>
                    <span style={{ flex: 1 }}>{t}</span>
                    <span className="rv-star" role="button" tabIndex={0} aria-label={`Bookmark ${t}`}
                      onClick={(e) => { e.stopPropagation(); toggleMark(id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleMark(id); } }}>
                      <i className={`bi bi-star${marks[id] ? '-fill' : ''}`} style={marks[id] ? { color: '#fbbf24' } : undefined} />
                    </span>
                    <span className="arrow">▸</span>
                  </button>
                  {open && (
                    <div className="rv-tip-body">
                      <p className="mb-1">{d}</p>
                      <pre><code>{c}</code><button className="rv-copy" onClick={() => copyText(c, () => { setCopied(id); setTimeout(() => setCopied(''), 1200); })}>{copied === id ? 'Copied!' : 'Copy'}</button></pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div></div>
        </section>
      ))}
    </Chrome>
  );
}
