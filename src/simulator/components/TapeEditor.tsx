'use client';

import { PencilLine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { symbolsOf } from '@/engines/turing';
import { writeInputCell } from '../tape-edit';
import { Kbd } from './Controls';
import { useSimulator, useSimulatorStore } from './store-context';

/** The id of the help line in Notices; the editor points to it with aria-describedby. */
export const TAPE_HELP_ID = 'tape-edit-help';
/** The id of the "Edit the tape" button; focus goes back to it when editing ends with Esc. */
export const EDIT_TAPE_BUTTON_ID = 'edit-tape-button';

/**
 * The tape editor (spec 5.4): it covers the tape while the visitor edits it, and takes every key.
 * Each handled key calls preventDefault, so the simulator's shortcuts ignore it.
 */
export function TapeEditor({ cell }: { cell: number }) {
  const t = useTranslations('simulator.tape');
  const store = useSimulatorStore();
  const machine = useSimulator((s) => s.machine);
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => editor.current?.focus(), []);

  const symbol = symbolsOf(machine.input)[cell] ?? machine.blank;
  const write = (at: number, value: string) => store.getState().setInput(writeInputCell(machine.input, machine.blank, at, value));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // AltGr (reported as Ctrl+Alt) and Option on a Mac type symbols such as @ [ {, so Alt with one symbol writes it.
    // Other keys with Ctrl, Alt or Cmd are the browser's, such as Ctrl+C or Alt+← for Back.
    const altSymbol = event.altKey && symbolsOf(event.key).length === 1;
    if (event.metaKey || ((event.ctrlKey || event.altKey) && !altSymbol)) return;
    const { moveTapeCursor, endTapeEdit } = store.getState();
    if (event.key === 'ArrowLeft') moveTapeCursor(cell - 1);
    else if (event.key === 'ArrowRight') moveTapeCursor(cell + 1);
    else if (event.key === 'Backspace') {
      // As in a text field: Backspace clears the cell left of the cursor and moves there.
      const at = Math.max(0, cell - 1);
      write(at, machine.blank);
      moveTapeCursor(at);
    } else if (event.key === 'Delete' || event.key === ' ') {
      // Space writes the blank too: a space character looks like the blank but no rule reads it.
      write(cell, machine.blank);
    } else if (event.key === 'Escape' || event.key === 'Enter') {
      endTapeEdit();
      document.getElementById(EDIT_TAPE_BUTTON_ID)?.focus();
    } else if (symbolsOf(event.key).length === 1) {
      write(cell, event.key);
      moveTapeCursor(cell + 1);
    } else return;
    event.preventDefault();
  };

  return (
    <div
      ref={editor}
      role="textbox"
      tabIndex={0}
      aria-label={t('editor')}
      aria-describedby={TAPE_HELP_ID}
      data-testid="tape-editor"
      onKeyDown={onKeyDown}
      onBlur={() => store.getState().endTapeEdit()}
      className="pointer-events-none absolute inset-0 z-20"
    >
      <span aria-live="polite" className="sr-only">
        {t('cursor', { cell, symbol })}
      </span>
    </div>
  );
}

/** "Edit the tape", the button for `E` (spec 5.4). */
export function EditTapeButton() {
  const t = useTranslations('simulator.tape');
  const startTapeEdit = useSimulator((s) => s.startTapeEdit);
  return (
    <button
      id={EDIT_TAPE_BUTTON_ID}
      type="button"
      onClick={() => startTapeEdit()}
      aria-keyshortcuts="e"
      className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold text-muted underline underline-offset-4"
    >
      <PencilLine aria-hidden className="size-4" />
      {t('edit')}
      <Kbd>E</Kbd>
    </button>
  );
}
