import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { useSeo } from './lib/seo';

const Home = lazy(() => import('./pages/Home'));
const Guide = lazy(() => import('./pages/Guide'));
const Tips = lazy(() => import('./pages/Tips'));
const Qa = lazy(() => import('./pages/Qa'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Mcq = lazy(() => import('./pages/Mcq'));
const Problems = lazy(() => import('./pages/Problems'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  useSeo({ title: 'Page Not Found', description: 'The page you are looking for does not exist.', route: '' });
  return (
    <div className="rv-home">
      <div className="rv-empty" style={{ marginTop: '4rem' }}>
        <h1>Nothing here.</h1>
        <p>That page stamped the wrong passport.</p>
        <Link to="/">← Back to Learn Home</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<div className="rv-loading">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guide/:slug" element={<Guide />} />
          <Route path="/tips/:slug" element={<Tips />} />
          <Route path="/qa/:slug" element={<Qa />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/mcq" element={<Mcq />} />
          <Route path="/cases" element={<Problems />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
