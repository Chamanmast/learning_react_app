/* ── Guide metadata (from guides.json) ── */
export interface GuideEntry {
  shelf: string;
  shelfHint?: string;
  file: string;
  code: string;
  name: string;
  sub: string;
  desc: string;
  hello: string;
  level: 1 | 2 | 3;
  time: string;
  routes: string[];
  tags: string;
  route: string;
  kind: 'guide' | 'tips' | 'qa' | 'quiz' | 'mcq' | 'cases';
  slug: string;
}

/* ── Guide page content (guide-*.json) ── */
export interface GuideDoc {
  slug: string;
  title: string;
  acc: string;
  sidebar: string;
  content: string;
}

/* ── Tips page content (tips-*.json) ── */
export type TipTuple = [title: string, description: string, code: string];

export interface TipsSection {
  id: string;
  title: string;
  desc?: string;
}

export interface TipsDoc {
  slug: string;
  title: string;
  acc: string;
  pageKey: string;
  guideLink: string;
  sections: TipsSection[];
  tips: Record<string, TipTuple[]>;
}

/* ── Q&A page content (qa-*.json) ── */
export interface QaQuestion {
  id: number;
  s: string;
  d: 'easy' | 'med' | 'hard';
  q: string;
  a: string;
}

export interface QaDoc {
  slug: string;
  title: string;
  acc: string;
  sidebar: string;
  questions: QaQuestion[];
  names: Record<string, string>;
  parents: Record<string, string>;
  parentLabels: Record<string, string>;
  descs: Record<string, string>;
  icons: Record<string, string>;
  order: string[];
}

/* ── Quiz flashcard content (quiz.json) ── */
export interface QuizQuestion {
  id: number;
  category: string;
  difficulty: 'easy' | 'med' | 'hard';
  exp: string;
  tags?: string[];
  q: string;
  a: string;
}

export interface QuizDoc {
  slug: string;
  title: string;
  questions: QuizQuestion[];
}

/* ── MCQ content (mcq.json) ── */
export interface McqQuestion {
  id: number;
  category: string;
  difficulty: 'easy' | 'med' | 'hard';
  exp: string;
  q: string;
  a: string;
  options: string[];
  correct: number;
}

export interface McqDoc {
  slug: string;
  title: string;
  questions: McqQuestion[];
}

/* ── Case problems content (cases.json) ── */
export interface CaseQuestion {
  id: number;
  category: string;
  difficulty: 'easy' | 'med' | 'hard';
  exp: string;
  tags: string[];
  q: string;
  a: string;
}

export interface CasesDoc {
  slug: string;
  title: string;
  acc: string;
  questions: CaseQuestion[];
}

/* ── Union type for any loaded document ── */
export type AnyDoc = GuideDoc | TipsDoc | QaDoc | QuizDoc | McqDoc | CasesDoc;

/* ── Chrome component props ── */
export interface ChromeProps {
  acc?: string;
  inkDeep?: string;
  sidebarHtml: string;
  children: React.ReactNode;
  label?: string;
}

/* ── Marks map used by Q&A, Quiz, Tips ── */
export type MarkMap = Record<string, string | undefined>;

/* ── SEO metadata (from seo.json) ── */
export interface SeoMeta {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  type?: string;
}

export interface SeoData {
  siteName: string;
  siteUrl: string;
  defaultImage: string;
  routes: Record<string, SeoMeta>;
  guides: Record<string, SeoMeta>;
}
