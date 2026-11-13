'use client';

import { StepForward } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useStore } from 'zustand';
import { Kbd } from '@/simulator/components/Controls';
import { useSimulatorStore } from '@/simulator/components/store-context';
import { useReducedMotion } from '@/simulator/components/use-reduced-motion';
import { markTourSeen, TOUR_STEPS, tourStore, type TourStepId } from './tour';

/** Steps whose panel holds a Step button, so the visitor acts without a keyboard (spec 5.5). */
const STEP_ACTION: ReadonlySet<TourStepId> = new Set(['head', 'sentence', 'rules', 'diagram']);

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** The part of the page a step shows. The head is not there while the machine has mistakes, so the tape stands in. */
function targetOf(id: TourStepId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${id}"]`) ?? document.querySelector<HTMLElement>('[data-tour="tape"]');
}

/** Where the focus goes when the tour ends: where it was, or the menu's Tour button when that place is gone or hidden (the first-visit prompt). */
function back(opener: Element | null): HTMLElement | null {
  const visible = opener instanceof HTMLElement && opener.isConnected && (typeof opener.checkVisibility !== 'function' || opener.checkVisibility());
  return visible ? opener : document.querySelector<HTMLElement>('[data-tour-button]');
}

function sameBox(a: Box | null, b: Box): boolean {
  return a !== null && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;
}

/**
 * The tour of the simulator (spec 5.5): 7 steps, each with a spotlight on one part of the page and a
 * panel at the bottom of the window. The panel is not modal: the visitor can use the page during the
 * tour. The focus moves to each step's title, and goes back to where it was when the tour ends.
 */
export function TourPanel() {
  const t = useTranslations('tour');
  const tControls = useTranslations('simulator.controls');
  const simulator = useSimulatorStore();
  const step = useStore(tourStore, (s) => s.step);
  const requested = useStore(tourStore, (s) => s.requested);
  const reducedMotion = useReducedMotion();
  const [box, setBox] = useState<Box | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const opener = useRef<Element | null>(null);
  const wasOpen = useRef(false);
  const textId = useId();
  const id = step === null ? null : TOUR_STEPS[step];

  // The menu's Tour button or the first-visit prompt asked for the tour. The run starts again, so Step has steps to show.
  useEffect(() => {
    if (!requested) return;
    opener.current = document.activeElement;
    markTourSeen();
    simulator.getState().endTapeEdit();
    simulator.getState().reset();
    tourStore.getState().start();
  }, [requested, simulator]);

  // Each step scrolls its part into view and moves the focus to its title.
  useEffect(() => {
    if (id === null) return;
    const target = targetOf(id);
    const tall = target !== null && target.offsetHeight > window.innerHeight / 2;
    target?.scrollIntoView({ block: tall ? 'start' : 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    title.current?.focus({ preventScroll: true });
  }, [id, reducedMotion]);

  // The spotlight follows its part while the page scrolls, resizes, or draws the state diagram late.
  useEffect(() => {
    if (id === null) return;
    let frame = 0;
    const follow = () => {
      const rect = targetOf(id)?.getBoundingClientRect();
      if (rect !== undefined) {
        const next = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
        setBox((current) => (sameBox(current, next) ? current : next));
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [id]);

  // When the tour ends, the focus goes back to where it was, or to the menu's Tour button.
  useEffect(() => {
    if (step !== null) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    back(opener.current)?.focus();
  }, [step]);

  if (step === null || id === null) return null;
  const last = step === TOUR_STEPS.length - 1;

  /** The panel's Step button. A machine that has halted starts again first, so the button always shows a step. */
  const stepMachine = () => {
    const { run, reset, stepForward } = simulator.getState();
    if (run !== null && run.status !== 'running') reset();
    stepForward();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') tourStore.getState().close();
  };

  const button = 'inline-flex items-center gap-2 border-2 border-ink px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <>
      {box !== null && (
        <div
          aria-hidden
          data-testid="tour-spotlight"
          className="pointer-events-none fixed z-40 border-4 border-pencil motion-safe:transition-all motion-safe:duration-200"
          style={{
            top: box.top - 6,
            left: box.left - 6,
            width: box.width + 12,
            height: box.height + 12,
            // The shadow dims the rest of the page. Clicks still go through: the visitor acts during the tour.
            boxShadow: '0 0 0 200vmax rgb(10 15 30 / 0.45)',
          }}
        />
      )}
      <div
        role="dialog"
        aria-label={t('label')}
        aria-describedby={textId}
        onKeyDown={onKeyDown}
        className="fixed inset-x-2 bottom-2 z-50 mx-auto max-h-[60dvh] max-w-[32rem] overflow-y-auto border-2 border-ink bg-cell p-4 text-ink shadow-[4px_4px_0_var(--ink)] sm:bottom-4"
      >
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm text-muted">{t('progress', { step: step + 1, total: TOUR_STEPS.length })}</p>
          <button type="button" onClick={() => tourStore.getState().close()} className="text-sm font-semibold underline underline-offset-4">
            {t('skip')}
          </button>
        </div>
        <h2 ref={title} tabIndex={-1} className="mt-1 font-display text-xl/tight font-semibold">
          {t(`steps.${id}.title`)}
        </h2>
        <div id={textId} className="mt-2 space-y-2">
          <p>{t(`steps.${id}.text`)}</p>
          <p className="font-semibold">
            <span aria-hidden className="text-pencil">
              →{' '}
            </span>
            {t(`steps.${id}.task`)}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {STEP_ACTION.has(id) && (
            <button type="button" onClick={stepMachine} aria-keyshortcuts="ArrowRight" className={`${button} bg-cell`}>
              <StepForward aria-hidden className="size-4" />
              {tControls('step')}
              <Kbd>→</Kbd>
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => tourStore.getState().back()} disabled={step === 0} className={`${button} bg-cell`}>
              {t('back')}
            </button>
            <button type="button" onClick={() => tourStore.getState().next()} className={`${button} bg-ink text-paper`}>
              {last ? t('finish') : t('next')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
