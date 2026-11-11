import { describe, expect, it } from 'vitest';
import { DEFAULT_SPEED, faster, slower, SPEEDS, toSpeedLevel } from './speed';

describe('speed levels', () => {
  it('has 5 levels, from 1 step every 1.5 seconds to about 3,000 steps a second', () => {
    expect(Object.keys(SPEEDS)).toEqual(['1', '2', '3', '4', '5']);
    expect(SPEEDS[1]).toEqual({ delayMs: 1500, stepsPerTick: 1, slideMs: 350 });
    expect((SPEEDS[5].stepsPerTick * 1000) / SPEEDS[5].delayMs).toBeGreaterThan(3000);
  });

  it('starts at level 3, the 700 ms pace of the approved mockup', () => {
    expect(DEFAULT_SPEED).toBe(3);
    expect(SPEEDS[DEFAULT_SPEED].delayMs).toBe(700);
  });

  it('stops at the slowest and the fastest level', () => {
    expect(faster(4)).toBe(5);
    expect(faster(5)).toBe(5);
    expect(slower(2)).toBe(1);
    expect(slower(1)).toBe(1);
  });

  it('reads a level from the range input and refuses anything else', () => {
    expect(toSpeedLevel(4)).toBe(4);
    expect(toSpeedLevel(0)).toBeNull();
    expect(toSpeedLevel(2.5)).toBeNull();
  });
});
