import { useEffect, useState, type RefObject } from 'react';

function useDoc<T>(slug: string | undefined, loader: (s: string) => Promise<T>): [T | null, boolean] {
  const [doc, setDoc] = useState<T | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    setDoc(null);
    setMissing(false);
    let live = true;
    if (slug) {
      loader(slug).then(
        (d) => live && setDoc(d),
        () => live && setMissing(true),
      );
    }
    return () => { live = false; };
  }, [slug, loader]);
  return [doc, missing];
}

function useAnchorScroll(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href')!;
      if (href.startsWith('#/')) return;
      e.preventDefault();
      if (href.length > 1) {
        const t = document.getElementById(decodeURIComponent(href.slice(1)));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [ref]);
}

function useScrollSpy(ref: RefObject<HTMLElement | null>, ready: boolean): void {
  useEffect(() => {
    if (!ready || !('IntersectionObserver' in window)) return;
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('#sidebar .nav-link[href^="#"]'));
    if (!links.length) return;
    const targets = links
      .map((l) => document.getElementById(decodeURIComponent(l.getAttribute('href')!.slice(1))))
      .filter(Boolean) as HTMLElement[];
    if (!targets.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = '#' + en.target.id;
          links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === id));
        });
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, [ref, ready]);
}

export { useDoc, useAnchorScroll, useScrollSpy };
