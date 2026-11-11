'use client';

import { Minus, Pause, Play, Plus, RotateCcw, StepBack, StepForward, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { toSpeedLevel } from '../speed';
import { useSimulator } from './store-context';

interface ControlButtonProps {
  icon: LucideIcon;
  label: string;
  /** The key shown on the button, such as "→". */
  keyLabel: string;
  /** The key for aria-keyshortcuts, such as "ArrowRight". */
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}

function ControlButton({ icon: Icon, label, keyLabel, shortcut, onClick, disabled, primary }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-keyshortcuts={shortcut}
      className={`inline-flex items-center justify-center gap-2 border-2 border-ink px-4 py-2 font-semibold active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${
        primary ? 'min-w-28 bg-ink text-paper' : 'bg-cell text-ink'
      }`}
    >
      <Icon aria-hidden className="size-4" />
      {label}
      <Kbd>{keyLabel}</Kbd>
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd aria-hidden className="border border-current px-1.5 font-sans text-xs font-medium opacity-80">
      {children}
    </kbd>
  );
}

/** Reset, Step back, Run/Pause, Step and the speed control (spec 5.1). */
export function Controls() {
  const t = useTranslations('simulator.controls');
  const run = useSimulator((s) => s.run);
  const loop = useSimulator((s) => s.loop);
  const speed = useSimulator((s) => s.speed);
  const actions = useSimulator((s) => s);
  useSimulator((s) => s.version);

  const running = loop === 'running';
  const canStep = run !== null && run.status === 'running';
  const canStepBack = run !== null && run.history.length > 0;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
      <ControlButton icon={RotateCcw} label={t('reset')} keyLabel="R" shortcut="r" onClick={actions.reset} disabled={run === null} />
      <ControlButton icon={StepBack} label={t('stepBack')} keyLabel="←" shortcut="ArrowLeft" onClick={actions.stepBack} disabled={!canStepBack} />
      <ControlButton
        icon={running ? Pause : Play}
        label={running ? t('pause') : t('run')}
        keyLabel={t('spaceKey')}
        shortcut="Space"
        onClick={actions.toggleRun}
        disabled={run === null}
        primary
      />
      <ControlButton icon={StepForward} label={t('step')} keyLabel="→" shortcut="ArrowRight" onClick={actions.stepForward} disabled={!canStep} />
      <div role="group" aria-label={t('speed')} className="flex items-center gap-2 text-muted sm:ml-2.5">
        <span aria-hidden>{t('speed')}</span>
        <button type="button" onClick={actions.slower} aria-label={t('slower')} aria-keyshortcuts="-" className="border-2 border-ink bg-cell p-1 text-ink">
          <Minus aria-hidden className="size-4" />
        </button>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={speed}
          aria-label={t('speed')}
          aria-valuetext={t('speedValue', { level: speed })}
          onChange={(event) => {
            const level = toSpeedLevel(Number(event.target.value));
            if (level !== null) actions.setSpeed(level);
          }}
          className="w-24 accent-pencil"
        />
        <button type="button" onClick={actions.faster} aria-label={t('faster')} aria-keyshortcuts="+" className="border-2 border-ink bg-cell p-1 text-ink">
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
