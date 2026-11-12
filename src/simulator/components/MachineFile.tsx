'use client';

import { Download, FilePlus, FolderOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { serializeMachine } from '@/engines/turing';
import { downloadMachine, readMachineFile, type MachineFileError } from '@/files/machine-file';
import { newMachine } from '../rule-edit';
import { fieldClass, plainTextProps } from './fields';
import { useSimulator, useSimulatorStore } from './store-context';

/** `unreadable`: the browser could not read the file at all, for example because it was moved. */
type FileError = MachineFileError | { code: 'unreadable' };
type FileStatus = { kind: 'opened'; name: string } | { kind: 'error'; error: FileError } | null;

const button = 'inline-flex items-center gap-2 border-2 border-ink bg-cell px-3 py-1.5 font-medium text-ink';

/** The third view of spec 5.1: the machine as JSON, with Download, Open file and New machine (spec 5.6). */
export function MachineFile() {
  const t = useTranslations('simulator.file');
  const store = useSimulatorStore();
  const machine = useSimulator((s) => s.machine);
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<FileStatus>(null);

  const errorText = (error: FileError) => {
    switch (error.code) {
      case 'unreadable':
        return t('error.unreadable');
      case 'not-json':
        return t('error.notJson');
      case 'not-a-machine':
        return t('error.notAMachine');
      case 'missing-field':
        return t('error.missingField', { field: error.field });
      case 'bad-field':
        return t('error.badField', { field: error.field });
      case 'legacy-too-short':
        return t('error.legacyTooShort');
      case 'legacy-bad-row':
        return t('error.legacyBadRow', { row: error.row });
    }
  };

  const open = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus({ kind: 'error', error: { code: 'unreadable' } });
      return;
    }
    const result = readMachineFile(file.name, text);
    if (!result.ok) {
      setStatus({ kind: 'error', error: result.error });
      return;
    }
    store.getState().loadMachine(result.machine, result.warnings);
    setStatus({ kind: 'opened', name: result.machine.name });
  };

  return (
    <details className="mt-5 bg-cell px-4 py-3">
      <summary className="cursor-pointer font-display text-xl font-semibold">
        <h2 className="inline">{t('title')}</h2>
      </summary>
      <p className="mt-1 mb-3 text-sm text-muted">{t('hint')}</p>
      <div className="flex flex-wrap items-end gap-2.5">
        <label className="flex flex-col gap-0.5 text-[13px] font-semibold text-muted">
          {t('name')}
          <input
            {...plainTextProps}
            value={machine.name}
            onChange={(event) => store.getState().renameMachine(event.target.value)}
            className={`${fieldClass(false)} w-64 font-sans text-[15px] font-medium`}
          />
        </label>
        <button type="button" onClick={() => downloadMachine(store.getState().machine)} className={button}>
          <Download aria-hidden className="size-4" />
          {t('download')}
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className={button}>
          <FolderOpen aria-hidden className="size-4" />
          {t('open')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,.txt,application/json,text/plain"
          hidden
          data-testid="open-file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Clear the field, so the same file can be opened again after a change.
            event.target.value = '';
            if (file !== undefined) void open(file);
          }}
        />
        <button
          type="button"
          onClick={() => {
            store.getState().loadMachine(newMachine(t('newName')));
            setStatus(null);
          }}
          className={button}
        >
          <FilePlus aria-hidden className="size-4" />
          {t('newMachine')}
        </button>
      </div>
      <p role="status" className={`mt-2 min-h-5 text-sm ${status?.kind === 'error' ? 'font-semibold text-pencil' : 'text-muted'}`}>
        {status?.kind === 'opened' && t('opened', { name: status.name })}
        {status?.kind === 'error' && errorText(status.error)}
      </p>
      {/* The arrows and Space scroll this block, so the keyboard shortcuts stay off while it has focus. */}
      <pre tabIndex={0} data-no-shortcuts aria-label={t('json')} className="mt-2 max-h-80 overflow-auto border-2 border-soft bg-paper p-3 font-mono text-[13px]">
        {serializeMachine(machine)}
      </pre>
    </details>
  );
}
