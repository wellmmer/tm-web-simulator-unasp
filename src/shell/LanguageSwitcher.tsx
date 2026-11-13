'use client';

import { Check, ChevronDown, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { saveLanguageChoice, setLanguageBarShown } from '@/i18n/language-choice';
import { LANGUAGE_NAMES } from '@/i18n/languages';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * The language switcher in the menu (spec 4.2): a button that opens a list of links, one per
 * language, each to the same page. Links, not a select, because picking a language opens a new page.
 */
export function LanguageSwitcher() {
  const t = useTranslations('shell');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // A click or a tap outside the switcher closes the list.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return;
    // The Esc is used here, so the tour stays open.
    event.preventDefault();
    setOpen(false);
    button.current?.focus();
  };

  // Tab out of the list closes it.
  const onBlur = (event: FocusEvent) => {
    if (!(event.relatedTarget instanceof Node && root.current?.contains(event.relatedTarget))) setOpen(false);
  };

  const choose = (code: string) => {
    saveLanguageChoice(code);
    setLanguageBarShown(false);
    setOpen(false);
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={button}
        type="button"
        // "Language: Português" holds the visible name, as WCAG 2.5.3 asks.
        aria-label={`${t('languageSwitcher')}: ${LANGUAGE_NAMES[locale]}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-1.5 border-2 border-ink bg-cell px-2.5 font-semibold text-ink"
      >
        <Languages aria-hidden className="size-[18px] shrink-0" strokeWidth={1.8} />
        <span lang={locale}>{LANGUAGE_NAMES[locale]}</span>
        <ChevronDown aria-hidden className={`size-4 shrink-0 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <ul id={listId} hidden={!open} className="absolute right-0 z-30 mt-1 min-w-44 border-2 border-ink bg-cell py-1">
        {routing.locales.map((code) => (
          <li key={code}>
            <Link
              href={pathname}
              locale={code}
              lang={code}
              aria-current={code === locale ? 'true' : undefined}
              onClick={() => choose(code)}
              className="flex items-center justify-between gap-3 px-3 py-2 text-ink hover:bg-soft aria-[current]:font-semibold"
            >
              {LANGUAGE_NAMES[code]}
              {code === locale && <Check aria-hidden className="size-4 text-pencil" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
