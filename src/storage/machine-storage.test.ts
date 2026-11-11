import { describe, expect, it } from 'vitest';
import { machine } from '@/engines/turing/test-helpers';
import { createBrowserStorage, createMemoryStorage, MACHINE_KEY } from './machine-storage';

/** A Storage backed by a Map, like localStorage in a browser that allows it. */
function fakeStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, String(value)),
  };
}

/** A Storage that throws on every write, like Safari in a private window with storage blocked. */
function blockedStorage(): Storage {
  return { ...fakeStorage(), setItem: () => { throw new DOMException('blocked', 'SecurityError'); } };
}

const binary = machine([{ state: 'q0', read: '1', write: '0', move: 'R', next: 'qA' }], { name: 'Mine', input: '1' });

describe('createBrowserStorage', () => {
  it('saves a machine and loads it back', () => {
    const backing = fakeStorage();
    createBrowserStorage(() => backing).saveMachine(binary);
    const again = createBrowserStorage(() => backing);
    expect(again.persistent).toBe(true);
    expect(again.loadMachine()).toEqual(binary);
  });

  it('loads nothing when the saved text is not a machine', () => {
    const backing = fakeStorage();
    backing.setItem(MACHINE_KEY, '{"format":"something else"}');
    expect(createBrowserStorage(() => backing).loadMachine()).toBeNull();
  });

  it('remembers that a note was seen', () => {
    const backing = fakeStorage();
    createBrowserStorage(() => backing).markSeen('left-edge');
    expect(createBrowserStorage(() => backing).hasSeen('left-edge')).toBe(true);
  });

  it('keeps working in memory when the browser blocks writes', () => {
    const storage = createBrowserStorage(() => blockedStorage());
    expect(storage.persistent).toBe(false);
    storage.saveMachine(binary);
    expect(storage.loadMachine()).toEqual(binary);
  });

  it('keeps working in memory when reading localStorage itself throws', () => {
    const storage = createBrowserStorage(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(storage.persistent).toBe(false);
    storage.markSeen('left-edge');
    expect(storage.hasSeen('left-edge')).toBe(true);
  });

  it('switches to memory when a later write fails, for example when storage is full', () => {
    const backing = fakeStorage();
    const storage = createBrowserStorage(() => backing);
    backing.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
    storage.saveMachine(binary);
    expect(storage.persistent).toBe(false);
    expect(storage.loadMachine()).toEqual(binary);
  });
});

describe('createMemoryStorage', () => {
  it('starts empty and is not persistent', () => {
    const storage = createMemoryStorage();
    expect(storage.persistent).toBe(false);
    expect(storage.loadMachine()).toBeNull();
    expect(storage.hasSeen('left-edge')).toBe(false);
  });
});
