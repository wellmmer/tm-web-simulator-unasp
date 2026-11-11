'use client';

import { useTranslations } from 'next-intl';
import { messageValues, plainText, type SimMessage } from '../describe';

/** Turns a SimMessage into text: `rich` marks state and symbols in pencil red, `plain` is for the live region. */
export function useSimText() {
  const t = useTranslations('simulator');
  return {
    rich: (message: SimMessage) =>
      t.rich(message.key, {
        ...messageValues(t, message),
        b: (chunks) => <b className="font-semibold text-pencil">{chunks}</b>,
      }),
    plain: (message: SimMessage) => plainText(t, message),
  };
}
