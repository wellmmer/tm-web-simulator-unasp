'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { SimulatorState, SimulatorStore } from '../store';

const StoreContext = createContext<SimulatorStore | null>(null);

export function SimulatorStoreProvider({ store, children }: { store: SimulatorStore; children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** The store itself, for event handlers that read the latest state with getState(). */
export function useSimulatorStore(): SimulatorStore {
  const store = useContext(StoreContext);
  if (store === null) throw new Error('useSimulator needs a SimulatorStoreProvider');
  return store;
}

/** Reads from the simulator store. Select `version` too when you read the run: the engine changes it in place. */
export function useSimulator<T>(selector: (state: SimulatorState) => T): T {
  return useStore(useSimulatorStore(), selector);
}
