'use client';

import { useState, type InputHTMLAttributes } from 'react';

/** A small field in the rule table or the machine settings. A field with a mistake gets a red border. */
export function fieldClass(invalid: boolean): string {
  return `w-full min-w-10 border-2 bg-cell px-1.5 py-0.5 font-mono text-ink ${invalid ? 'border-pencil' : 'border-soft hover:border-muted'}`;
}

type DraftInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onFocus' | 'onBlur'> & {
  /** The text the machine gives for this field, such as "P0, R". */
  value: string;
  /** Called on every change, with the text as typed. */
  onText: (text: string) => void;
};

/**
 * A field whose text is read into another form, such as "P0, " into ["P0"]. While the field has
 * focus, it shows the text as typed; otherwise it shows `value`. Without this, typing ", " would vanish.
 */
export function DraftInput({ value, onText, ...props }: DraftInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      {...props}
      value={draft ?? value}
      onFocus={() => setDraft(value)}
      onChange={(event) => {
        setDraft(event.target.value);
        onText(event.target.value);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

/** The short hint under a marked field (spec 8). `id` links it to the field with aria-describedby. */
export function FieldHintText({ id, text }: { id: string; text: string }) {
  return (
    <span id={id} className="mt-0.5 block font-sans text-xs font-medium text-pencil">
      {text}
    </span>
  );
}

/** Text inputs for symbols and states: no spelling marks, no capital letters added by phones. */
export const plainTextProps = { spellCheck: false, autoComplete: 'off', autoCapitalize: 'off', autoCorrect: 'off' } as const;
