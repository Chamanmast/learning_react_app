import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import Chrome from '../components/Chrome';
import { useAnchorScroll, useDoc, useScrollSpy } from '../components/doc';
import { loadGuide } from '../lib/content';
import { useSeo, getGuideSeo } from '../lib/seo';
import type { GuideDoc } from '../types';

export default function Guide() {
  const { slug } = useParams<{ slug: string }>();
  const [doc, missing] = useDoc<GuideDoc>(slug, loadGuide);
  useSeo({ ...getGuideSeo(slug || ''), route: `/guide/${slug}` });
  const mainRef = useRef<HTMLDivElement>(null);
  useAnchorScroll(mainRef);
  useScrollSpy(mainRef, !!doc);

  if (missing)
    return (
      <Chrome acc="#e4572e" sidebarHtml="" label="Not found">
        <div className="rv-empty">
          <p>Guide not found.</p>
          <Link to="/">← Back to Learn Home</Link>
        </div>
      </Chrome>
    );
  if (!doc)
    return (
      <Chrome acc="#e4572e" sidebarHtml="" label="Loading">
        <div className="rv-loading">Loading guide…</div>
      </Chrome>
    );
  return (
    <Chrome acc={doc.acc} sidebarHtml={doc.sidebar} label={doc.title}>
      <div ref={mainRef} className="rv-doc" dangerouslySetInnerHTML={{ __html: doc.content }} />
    </Chrome>
  );
}
