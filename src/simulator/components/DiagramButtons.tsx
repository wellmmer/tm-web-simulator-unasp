'use client';

import { LocateFixed, Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DiagramButtonsProps {
  /** True when the diagram follows the run for this machine and panel size: "Follow the run" shows. */
  canFollow: boolean;
  /** True while the view follows the run: "Follow the run" shows as pressed. */
  following: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onWholeMachine: () => void;
  onToggleFollow: () => void;
}

/** The look of the small buttons on the page, such as Slower and Faster. Pressed buttons are ink with paper text. */
const button = 'inline-flex items-center gap-1.5 border-2 border-ink bg-cell px-2 py-1 text-sm font-medium text-ink aria-pressed:bg-ink aria-pressed:text-paper';

/**
 * The buttons above the state diagram (spec section 3). They are normal buttons in the tab order. The
 * diagram itself still takes no keys, so Space and the arrows still run the machine.
 */
export function DiagramButtons({ canFollow, following, onZoomIn, onZoomOut, onWholeMachine, onToggleFollow }: DiagramButtonsProps) {
  const t = useTranslations('simulator.diagram');
  return (
    <div role="group" aria-label={t('view')} className="mb-2 flex flex-wrap items-center gap-2">
      <button type="button" onClick={onZoomIn} aria-label={t('zoomIn')} title={t('zoomIn')} className={`${button} px-1`}>
        <ZoomIn aria-hidden className="size-4" />
      </button>
      <button type="button" onClick={onZoomOut} aria-label={t('zoomOut')} title={t('zoomOut')} className={`${button} px-1`}>
        <ZoomOut aria-hidden className="size-4" />
      </button>
      <button type="button" onClick={onWholeMachine} className={button}>
        <Maximize aria-hidden className="size-4" />
        {t('wholeMachine')}
      </button>
      {canFollow && (
        <button type="button" onClick={onToggleFollow} aria-pressed={following} className={button}>
          <LocateFixed aria-hidden className="size-4" />
          {t('follow')}
        </button>
      )}
    </div>
  );
}
