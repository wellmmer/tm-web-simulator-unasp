import { render } from '@testing-library/react';
import { NextIntlClientProvider, type Locale } from 'next-intl';
import type { ReactNode } from 'react';
import en from '../../messages/en.json';

/**
 * Renders components with the English texts, as the pages do. Another `locale` changes the numbers
 * and the currency, not the texts, so a screen test checks the logic without the translations.
 */
export function renderWithIntl(ui: ReactNode, locale: Locale = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={en}>
      {ui}
    </NextIntlClientProvider>,
  );
}
