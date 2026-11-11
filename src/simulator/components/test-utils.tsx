import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import en from '../../../messages/en.json';
import { createMemoryStorage } from '@/storage/machine-storage';
import { createSimulatorStore, type SimulatorStore } from '../store';
import { SimulatorStoreProvider } from './store-context';

/** Renders simulator components in English with a fresh store that keeps nothing. */
export function renderSimulator(ui: ReactNode, store: SimulatorStore = createSimulatorStore({ storage: createMemoryStorage() })) {
  const result = render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SimulatorStoreProvider store={store}>{ui}</SimulatorStoreProvider>
    </NextIntlClientProvider>,
  );
  return { ...result, store };
}
