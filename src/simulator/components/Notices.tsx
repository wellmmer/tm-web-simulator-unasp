'use client';

import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSimulator } from './store-context';
import { TAPE_HELP_ID } from './TapeEditor';

/** Short notes above the controls: blocked storage, a bad share link, the first left-edge move, and tape editing. */
export function Notices() {
  const t = useTranslations('simulator.notes');
  const storageBlocked = useSimulator((s) => s.storageBlocked);
  const badLink = useSimulator((s) => s.badLink);
  const leftEdgeNote = useSimulator((s) => s.leftEdgeNote);
  const dismissLeftEdgeNote = useSimulator((s) => s.dismissLeftEdgeNote);
  const tapeEdit = useSimulator((s) => s.tapeEdit);
  const tTape = useTranslations('simulator.tape');

  const notes = [storageBlocked && t('storageBlocked'), badLink && t('badLink')].filter((note) => note !== false);
  if (notes.length === 0 && !leftEdgeNote && tapeEdit === null) return null;
  return (
    <ul className="mx-auto mt-4 flex max-w-[640px] flex-col gap-2 text-sm">
      {notes.map((note) => (
        <li key={note} className="flex items-start gap-2 bg-cell px-3 py-2 text-muted">
          <Info aria-hidden className="mt-0.5 size-4 flex-none" />
          {note}
        </li>
      ))}
      {tapeEdit !== null && (
        <li id={TAPE_HELP_ID} className="border-l-4 border-pencil bg-cell px-3 py-2">
          {tapeEdit.resetRun && `${t('tapeReset')} `}
          {tTape('editHelp')}
        </li>
      )}
      {leftEdgeNote && (
        <li className="flex flex-wrap items-center gap-3 border-l-4 border-pencil bg-cell px-3 py-2">
          <span className="flex-1">{t('leftEdge')}</span>
          <button type="button" onClick={dismissLeftEdgeNote} className="font-semibold underline underline-offset-4">
            {t('gotIt')}
          </button>
        </li>
      )}
    </ul>
  );
}
