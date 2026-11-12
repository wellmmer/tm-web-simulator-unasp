'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

// React Flow measures the page, so it draws in the browser only. It also loads in its own file.
// Until then, an empty block keeps the place of the buttons and the drawing.
const StateDiagram = dynamic(() => import('./StateDiagram'), { ssr: false, loading: () => <div className="h-[260px] sm:h-[360px]" /> });

/**
 * The right panel of the bench (spec 5.1). For screen readers the drawing is one image whose
 * description says that the rule table holds the same rules as text.
 */
export function DiagramPanel() {
  const t = useTranslations('simulator.diagram');
  return (
    <section aria-labelledby="diagram-title" className="min-w-0 self-start bg-cell px-4 pt-4 pb-5 lg:sticky lg:top-4">
      <h2 id="diagram-title" className="font-display text-xl font-semibold">
        {t('title')}
      </h2>
      <p id="diagram-hint" className="mb-3 text-sm text-muted">
        {t('hint')}
      </p>
      <StateDiagram />
    </section>
  );
}
