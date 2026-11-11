import { describe, expect, it } from 'vitest';
import { createAnnouncer } from './announcer';

describe('createAnnouncer', () => {
  it('lets through at most one throttled message per second', () => {
    let now = 0;
    const announcer = createAnnouncer(1000, () => now);
    const heard = [0, 300, 600, 900, 1200, 1500, 2200].filter((time) => {
      now = time;
      return announcer.shouldAnnounce(true);
    });
    expect(heard).toEqual([0, 1200, 2200]);
  });

  it('always lets through a message that is not throttled, such as the final result', () => {
    let now = 0;
    const announcer = createAnnouncer(1000, () => now);
    expect(announcer.shouldAnnounce(true)).toBe(true);
    now = 10;
    expect(announcer.shouldAnnounce(false)).toBe(true);
  });
});
