'use client';

import { useEffect, useState } from 'react';
import { createBrowserStorage, createMemoryStorage } from '@/storage/machine-storage';
import { createSimulatorStore } from '../store';
import { SimulatorView } from './SimulatorView';
import { SimulatorStoreProvider } from './store-context';

/**
 * Drops a share link from the URL and keeps the path and search. The machine is saved now,
 * so a reload must not undo later changes.
 */
function dropLinkFromUrl() {
  if (window.location.hash.startsWith('#m=')) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
}

/**
 * The simulator with its own store. The server renders Binary +1; after hydration, the store opens
 * the machine from a share link or from browser storage. A link pasted into the address bar later opens too.
 */
export function Simulator() {
  const [store] = useState(() =>
    createSimulatorStore({ storage: typeof window === 'undefined' ? createMemoryStorage() : createBrowserStorage() }),
  );

  useEffect(() => {
    store.getState().boot(window.location.hash);
    dropLinkFromUrl();
    // Pasting a link into the address bar of an open tab changes only the hash; the page does not reload.
    const onHashChange = () => {
      store.getState().openLink(window.location.hash);
      dropLinkFromUrl();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      store.getState().pause();
    };
  }, [store]);

  return (
    <SimulatorStoreProvider store={store}>
      <SimulatorView />
    </SimulatorStoreProvider>
  );
}
