import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { guides } from '../lib/content';
import { useTheme } from '../lib/hooks';
import { useSeo, getStaticSeo } from '../lib/seo';
import type { GuideEntry } from '../types';

const LEVEL_WORD: Record<number, string> = { 1: 'Gentle', 2: 'Steady', 3: 'Steep' };
const NOTES: Record<string, string> = {
  all: 'Start with one route — finish one guide before stamping the next.',
  websites: 'Websites route: HTML + CSS → JavaScript → one of Vue or React. Ignore the backend shelf for now.',
  backend: 'Backend route: PHP deeply (or Python) → Laravel (or Django) → MySQL → interview shelf.',
  data: 'Apps + data route: Python → one database → Node or React Native. Small steps, working projects.',
};
const HELLO_POOL = ['python.html', 'phplearn.html', 'javascript-jquery.html', 'html-css.html', 'laravel13.html', 'django.html', 'node-express.html', 'react19.html'];

function dots(level: number) {
  return (
    <span className="rv-dots">
      {[1, 2, 3].map((i) => (
        <i key={i} style={i <= level ? { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#e4572e', marginRight: 3 } : { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#ccc', marginRight: 3 }} />
      ))}
      {' '}{LEVEL_WORD[level]}
    </span>
  );
}

export default function Home() {
  useSeo({ ...getStaticSeo('/'), route: '/' });
  const [theme, toggleTheme] = useTheme();
  const [route, setRoute] = useState('all');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [helloIdx, setHelloIdx] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim().toLowerCase()), 120);
    return () => clearTimeout(t);
  }, [q]);

  const pool = useMemo(() => HELLO_POOL.map((f) => (guides as GuideEntry[]).find((g) => g.file === f)).filter(Boolean) as GuideEntry[], []);
  const hello = pool[helloIdx % Math.max(pool.length, 1)];
  useEffect(() => {
    if (!pool.length) return;
    const t = setInterval(() => setHelloIdx((i) => i + 1), 2600);
    return () => clearInterval(t);
  }, [pool.length]);

  const term = debounced;
  const filtered = useMemo(() => {
    const words = term.split(/\s+/).filter(Boolean);
    return (guides as GuideEntry[]).filter((g) => {
      if (route !== 'all' && !g.routes.includes(route)) return false;
      if (!words.length) return true;
      const hay = `${g.name} ${g.desc} ${g.file} ${g.tags} ${g.shelf}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [route, term]);

  const order = useMemo(() => {
    const seen: string[] = [];
    filtered.forEach((g) => { if (!seen.includes(g.shelf)) seen.push(g.shelf); });
    return seen;
  }, [filtered]);

  return (
    <div className="rv-home">
      <div className="rv-topbar">
        <Link className="rv-btn" to="/" aria-label="Learn home">⌂ Learn</Link>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search guides — try "python" or "job"…' aria-label="Search guides" />
        <span className="rv-btn" style={{ background: '#101a2e', color: '#f6efe0' }}><i className="bi bi-passport" /> {filtered.length} guides</span>
        <button className="rv-btn icon" onClick={toggleTheme} aria-label="Toggle dark or light mode">
          <i className={theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill'} />
        </button>
      </div>

      <header className="rv-hero">
        <div className="rv-hero-inner">
          <div>
            <span className="rv-eyebrow">Phrasebook · {(guides as GuideEntry[]).length} guides</span>
            <h1>Pick a language.<br /><em>Learn its first sentence.</em></h1>
            <p className="lede">Every programming language is a country. This page is the passport office: choose what you want to build, read each language&rsquo;s version of &ldquo;hello&rdquo;, then open the full guide and stay a while.</p>
            <div className="rv-route-row" role="group" aria-label="Choose a learning route">
              <button className={`rv-route-btn${route === 'websites' ? ' active' : ''}`} onClick={() => setRoute('websites')}>I want to build websites</button>
              <button className={`rv-route-btn${route === 'backend' ? ' active' : ''}`} onClick={() => setRoute('backend')}>I want a backend job</button>
              <button className={`rv-route-btn${route === 'data' ? ' active' : ''}`} onClick={() => setRoute('data')}>I want apps &amp; data</button>
              <button className={`rv-route-btn ghost${route === 'all' ? ' active' : ''}`} onClick={() => setRoute('all')}>Show everything</button>
            </div>
            <p className="font-mono" style={{ marginTop: '.9rem', fontSize: '.7rem', letterSpacing: '.06em', color: '#b9ad93' }}>{NOTES[route]?.toUpperCase()}</p>
          </div>
          <div className="rv-passport" aria-label="Live hello demo">
            <div className="rv-passport-head"><span>First-sentence desk</span><span className="rv-seal">✓ Admit</span></div>
            <div className="rv-passport-body">
              <div className="rv-hello-lang">{hello ? `${hello.name} · ${LEVEL_WORD[hello.level].toLowerCase()}` : ''}</div>
              <div className="rv-hello-code">{hello?.hello}</div>
            </div>
            <div className="rv-passport-foot">
              <button onClick={() => setHelloIdx((i) => (i - 1 + pool.length) % pool.length)}>← Prev hello</button>
              {hello && <Link to={hello.route} className="rv-passport-foot" style={{ flex: 1, textDecoration: 'none' }}><button className="primary" style={{ width: '100%' }}>Open this guide →</button></Link>}
              <button onClick={() => setHelloIdx((i) => (i + 1) % pool.length)}>Next hello →</button>
            </div>
          </div>
        </div>
      </header>

      <div className="rv-stats">
        <div className="rv-stat"><span className="k">Guides</span><div className="v">{(guides as GuideEntry[]).length}</div><span className="n">Every page works offline.</span></div>
        <div className="rv-stat"><span className="k">Routes</span><div className="v">3</div><span className="n">Websites · backend · data.</span></div>
        <div className="rv-stat"><span className="k">First step</span><div className="v font-mono" style={{ fontSize: '1.15rem' }}>hello</div><span className="n">One sentence per language.</span></div>
        <div className="rv-stat"><span className="k">Cost</span><div className="v">₹0</div><span className="n">No sign-up, no tracking.</span></div>
      </div>

      <div className="d-flex justify-content-between flex-wrap gap-2 mt-3 mb-1 px-1">
        <span className="rv-results">{filtered.length} guides shown{route !== 'all' ? ` · ${route} route` : ''}{term ? ` · "${q.trim()}"` : ''}</span>
        <span className="rv-results">Gentle ●○○ · Steady ●●○ · Steep ●●●</span>
      </div>

      <main>
        {order.map((shelf) => (
          <section className="rv-shelf" key={shelf} aria-label={shelf}>
            <span className="rv-shelf-label">{shelf}</span>
            <h2>{shelf}</h2>
            <div className="rv-cards">
              {filtered.filter((g) => g.shelf === shelf).map((g) => (
                <Link className="rv-stamp" key={g.file} to={g.route}>
                  <div className="rv-stamp-top">
                    <span className="rv-seal2">{g.code}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="rv-stamp-name d-block">{g.name}</span>
                      <span className="rv-stamp-sub">{g.sub} · {g.time}</span>
                    </span>
                    <span className="rv-admit">Admit</span>
                  </div>
                  <p className="rv-stamp-desc">{g.desc}</p>
                  <div className="rv-hello-chip">hello → {g.hello}</div>
                  <div className="rv-stamp-meta">{dots(g.level)}<span className="rv-go">Open guide →</span></div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {!filtered.length && <div className="rv-empty">No guide matches that search. Clear the search box or pick "Show everything".</div>}
      </main>

      <footer className="rv-site">
        <span>Learn Home (React) — the beginner door into Jap App Hub</span>
        <span><Link to="/mcq">Test yourself</Link> · © 2026</span>
      </footer>
    </div>
  );
}
