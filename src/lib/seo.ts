import { useEffect } from 'react';
import type { SeoMeta } from '../types';
import seoDataRaw from '../data/seo.json';

const seoData = seoDataRaw as import('../types').SeoData;

const SITE_NAME = seoData.siteName;
const SITE_URL = seoData.siteUrl;
const DEFAULT_IMAGE = seoData.defaultImage;

function setMeta(name: string, content: string, property = false): void {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function useSeo(meta: Partial<SeoMeta> & { route?: string }): void {
  useEffect(() => {
    const title = meta.title ? `${meta.title} | ${SITE_NAME}` : SITE_NAME;
    document.title = title;

    setMeta('description', meta.description || '');
    setMeta('keywords', meta.keywords || '');

    const ogTitle = meta.ogTitle || meta.title || SITE_NAME;
    const ogDesc = meta.ogDescription || meta.description || '';
    const ogType = meta.type || 'website';
    const ogUrl = SITE_URL + (meta.route || '');
    const ogImage = DEFAULT_IMAGE;

    setMeta('og:title', ogTitle, true);
    setMeta('og:description', ogDesc, true);
    setMeta('og:type', ogType, true);
    setMeta('og:url', ogUrl, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:site_name', SITE_NAME, true);

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', ogTitle);
    setMeta('twitter:description', ogDesc);
    setMeta('twitter:image', ogImage);

    setCanonical(ogUrl);
  }, [meta.title, meta.description, meta.route]);
}

export function getStaticSeo(route: string): SeoMeta | undefined {
  return seoData.routes[route];
}

export function getGuideSeo(slug: string): SeoMeta | undefined {
  return seoData.guides[slug];
}
