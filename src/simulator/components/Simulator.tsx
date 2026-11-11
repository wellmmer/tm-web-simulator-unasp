'use client';

import { useEffect, useState } from 'react';
import { createBrowserStorage, createMemoryStorage } from '@/storage/machine-storage';
import { createSimulatorStore } from '../store';
import { SimulatorView } from './SimulatorView';
import { SimulatorStoreProvider } from './store-context';

/**
 * The simulator with its own store. The server renders Binary +1; after hydration, the store opens
 * the machine from a share link or from browser storage.
 */
export function Simulator() {
  const [store] = useState(() =>
    createSimulatorStore({ storage: typeof window === 'undefined' ? createMemoryStorage() : createBrowserStorage() }),
  );

  useEffect(() => {
    store.getState().boot(window.location.hash);
    // The machine is saved now, so drop it from the URL: a reload must not undo later changes.
    if (window.location.hash.startsWith('#m=')) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    return () => store.getState().pause();
  }, [store]);

  return (
    <SimulatorStoreProvider store={store}>
      <SimulatorView />
    </SimulatorStoreProvider>
  );
}
