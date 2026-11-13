'use client';

import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import type { SupportHandles } from '@/config/support';
import { AMOUNTS, amountText, parseAmount } from './amount';
import { PixPanel } from './PixPanel';
import { providerLink, supportOptions, type ProviderId } from './providers';

type Choice = number | 'other';

/** One amount, drawn as a tape cell. The chosen one gets the red pencil ring of the head. */
function AmountCell({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="relative -ml-0.5 cursor-pointer first:ml-0">
      <input type="radio" name="amount" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="grid h-[58px] min-w-[58px] place-items-center border-2 border-ink bg-cell px-3 font-mono text-lg font-bold text-ink peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-4 peer-focus-visible:outline-pencil">
        {label}
      </span>
      <span aria-hidden className="pointer-events-none absolute -inset-1.5 z-10 hidden rounded-full border-4 border-pencil peer-checked:block" />
    </label>
  );
}

function ProviderRow({ id, handles, amount }: { id: ProviderId; handles: SupportHandles; amount: number | null }) {
  const t = useTranslations('support');
  const name = t(`provider.${id}`);
  if (id === 'pix') {
    return (
      <li className="py-5">
        <p className="mb-3 font-semibold">{name}</p>
        <PixPanel pix={handles.pix} />
      </li>
    );
  }
  const link = providerLink(id, handles, amount ?? AMOUNTS.USD.preset);
  const shown = amount === null ? null : amountText(amount);
  const note = link.carriesAmount && shown !== null ? t('carries', { amount: shown }) : shown === null ? t('typeAny') : t('typeIt', { amount: shown });
  const label = !link.carriesAmount ? t('open', { provider: name }) : shown === null ? t('payNoAmount', { provider: name }) : t('pay', { amount: shown, provider: name });
  const button = 'inline-flex items-center gap-2 border-2 border-ink px-4 py-2 font-semibold';
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-muted">{note}</p>
      </div>
      {/* Without a valid amount, PayPal's link would carry a wrong one, so it is a disabled button until the amount is fixed. */}
      {link.carriesAmount && amount === null ? (
        <button type="button" disabled className={`${button} cursor-not-allowed bg-cell text-ink opacity-50`}>
          {label}
        </button>
      ) : (
        <a href={link.href} className={`${button} ${link.carriesAmount ? 'bg-ink text-paper' : 'bg-cell text-ink'}`}>
          {label}
          <ArrowRight aria-hidden className="size-4" />
        </a>
      )}
    </li>
  );
}

/**
 * Support the dev below the title (spec 7): the amount, then the providers that have a handle, in
 * the order for the visitor's language. With no handle filled in, one honest line and no links.
 */
export function SupportView({ handles }: { handles: SupportHandles }) {
  const t = useTranslations('support');
  const locale = useLocale();
  const otherId = useId();
  const otherHintId = useId();
  const [choice, setChoice] = useState<Choice>(AMOUNTS.USD.preset);
  const [otherText, setOtherText] = useState('');
  const { first, more } = supportOptions(locale, handles);

  if (first.length === 0) {
    return (
      <div className="mt-10 space-y-1 border-l-4 border-pencil bg-cell px-4 py-3">
        <p>{t('notReady')}</p>
        <p className="text-muted">{t('notReadyShare')}</p>
      </div>
    );
  }

  const amount = choice === 'other' ? parseAmount(otherText, 'USD') : choice;
  const otherInvalid = choice === 'other' && otherText.trim() !== '' && amount === null;
  const rows = (ids: ProviderId[]) => ids.map((id) => <ProviderRow key={id} id={id} handles={handles} amount={amount} />);

  return (
    <div className="mt-10 space-y-8">
      <fieldset>
        <legend className="font-semibold">{t('amount')}</legend>
        <div className="mt-4 flex flex-wrap gap-y-4 pl-1.5">
          {AMOUNTS.USD.presets.map((preset) => (
            <AmountCell key={preset} label={t('preset', { amount: preset })} checked={choice === preset} onChange={() => setChoice(preset)} />
          ))}
          <AmountCell label={t('other')} checked={choice === 'other'} onChange={() => setChoice('other')} />
        </div>
        {choice === 'other' && (
          <div className="mt-5">
            <label htmlFor={otherId} className="block text-sm font-medium">
              {t('otherField')}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <span aria-hidden className="font-mono text-lg font-bold">
                $
              </span>
              <input
                id={otherId}
                inputMode="decimal"
                autoComplete="off"
                value={otherText}
                onChange={(event) => setOtherText(event.target.value)}
                aria-invalid={otherInvalid}
                aria-describedby={otherHintId}
                className="w-32 border-2 border-ink bg-cell px-2.5 py-1.5 font-mono text-lg text-ink aria-invalid:border-pencil"
              />
            </div>
            <p id={otherHintId} className={`mt-1 text-sm ${otherInvalid ? 'text-pencil' : 'text-muted'}`}>
              {t('otherHint')}
            </p>
          </div>
        )}
      </fieldset>

      <section aria-labelledby="pay-title" className="bg-cell px-5 pt-5 sm:px-8">
        <h2 id="pay-title" className="font-display text-2xl/tight font-semibold">
          {t('payWith')}
        </h2>
        <ul className="divide-y divide-soft">{rows(first)}</ul>
        {more.length > 0 && (
          <details className="border-t border-soft py-4">
            <summary className="cursor-pointer font-semibold">{t('more')}</summary>
            <ul className="divide-y divide-soft">{rows(more)}</ul>
          </details>
        )}
      </section>

      <div className="space-y-2">
        <p className="font-display text-xl">{t('thanks')}</p>
        <p className="text-sm text-muted">{t('noData')}</p>
      </div>
    </div>
  );
}
