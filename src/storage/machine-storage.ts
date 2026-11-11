import { parseMachine, serializeMachine, type Machine } from '@/engines/turing';

/** A one-time note the app shows once per browser. */
export type NoteId = 'left-edge';

/**
 * Where the simulator keeps the current machine (spec 5.6). Plan R5 adds accounts behind this
 * same interface, so the simulator never talks to localStorage directly.
 */
export interface MachineStorage {
  /** False when the browser blocks storage. The machine then lives in memory until the tab closes. */
  readonly persistent: boolean;
  loadMachine(): Machine | null;
  saveMachine(machine: Machine): void;
  hasSeen(note: NoteId): boolean;
  markSeen(note: NoteId): void;
}

export const MACHINE_KEY = 'computable.machine';
const PROBE_KEY = 'computable.probe';
const seenKey = (note: NoteId) => `computable.seen.${note}`;

/** Returns the browser storage, or null when reading or writing it throws. */
function openStorage(getStorage: () => Storage): Storage | null {
  try {
    const storage = getStorage();
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return null;
  }
}

/**
 * Keeps every value in memory and, while the browser allows it, in `getStorage()` too.
 * When a read or write throws (blocked storage, a full quota), it keeps working from memory.
 */
function createStorage(getStorage: (() => Storage) | null): MachineStorage {
  const memory = new Map<string, string>();
  let backing = getStorage === null ? null : openStorage(getStorage);

  const read = (key: string): string | null => {
    if (backing !== null) {
      try {
        return backing.getItem(key);
      } catch {
        backing = null;
      }
    }
    return memory.get(key) ?? null;
  };

  const write = (key: string, value: string): void => {
    memory.set(key, value);
    if (backing === null) return;
    try {
      backing.setItem(key, value);
    } catch {
      backing = null;
    }
  };

  return {
    get persistent() {
      return backing !== null;
    },
    loadMachine() {
      const text = read(MACHINE_KEY);
      if (text === null) return null;
      const result = parseMachine(text);
      return result.ok ? result.machine : null;
    },
    saveMachine(machine) {
      write(MACHINE_KEY, serializeMachine(machine));
    },
    hasSeen(note) {
      return read(seenKey(note)) === '1';
    },
    markSeen(note) {
      write(seenKey(note), '1');
    },
  };
}

/** Storage in the browser's localStorage, with an in-memory fallback. */
export function createBrowserStorage(getStorage: () => Storage = () => window.localStorage): MachineStorage {
  return createStorage(getStorage);
}

/** Storage that only lives in memory: for the server render and for tests. */
export function createMemoryStorage(): MachineStorage {
  return createStorage(null);
}
