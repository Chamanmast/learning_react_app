import type { GuideEntry, GuideDoc, TipsDoc, QaDoc, QuizDoc, McqDoc, CasesDoc } from '../types';
import guides from '../data/guides.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const guideMods: Record<string, () => Promise<any>> = import.meta.glob('../content/guide-*.json');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tipsMods: Record<string, () => Promise<any>> = import.meta.glob('../content/tips-*.json');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const qaMods: Record<string, () => Promise<any>> = import.meta.glob('../content/qa-*.json');

const pick = async <T,>(mods: Record<string, () => Promise<{ default: T }>>, prefix: string, slug: string): Promise<T> => {
  const loader = mods[`../content/${prefix}-${slug}.json`];
  if (!loader) throw new Error(`missing ${prefix}-${slug}`);
  const mod = await loader();
  return mod.default;
};

export const loadGuide = (slug: string): Promise<GuideDoc> => pick<GuideDoc>(guideMods, 'guide', slug);
export const loadTips = (slug: string): Promise<TipsDoc> => pick<TipsDoc>(tipsMods, 'tips', slug);
export const loadQa = (slug: string): Promise<QaDoc> => pick<QaDoc>(qaMods, 'qa', slug);
export const loadQuiz = (): Promise<QuizDoc> => import('../content/quiz.json').then((m) => m.default as QuizDoc);
export const loadMcq = (): Promise<McqDoc> => import('../content/mcq.json').then((m) => m.default as McqDoc);
export const loadCases = (): Promise<CasesDoc> => import('../content/cases.json').then((m) => m.default as CasesDoc);

export const getEntry = (slug: string): GuideEntry | undefined => (guides as GuideEntry[]).find((g) => g.slug === slug);
export const routeForFile = (file: string): string => {
  const hit = (guides as GuideEntry[]).find((g) => g.file === file);
  return hit ? '#' + hit.route : file;
};

export { guides };
