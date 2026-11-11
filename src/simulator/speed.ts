export type SpeedLevel = 1 | 2 | 3 | 4 | 5;

export interface Speed {
  /** Time between two ticks of the run loop. */
  delayMs: number;
  /** Steps per tick. Level 5 runs many steps per tick, so the step limit is reached in seconds. */
  stepsPerTick: number;
  /** How long the tape takes to slide to the next cell. */
  slideMs: number;
}

export const SPEEDS: Record<SpeedLevel, Speed> = {
  1: { delayMs: 1500, stepsPerTick: 1, slideMs: 350 },
  2: { delayMs: 1000, stepsPerTick: 1, slideMs: 350 },
  3: { delayMs: 700, stepsPerTick: 1, slideMs: 350 },
  4: { delayMs: 150, stepsPerTick: 1, slideMs: 100 },
  5: { delayMs: 16, stepsPerTick: 50, slideMs: 0 },
};

export const DEFAULT_SPEED: SpeedLevel = 3;

const FASTER: Record<SpeedLevel, SpeedLevel> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 5 };
const SLOWER: Record<SpeedLevel, SpeedLevel> = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4 };

export function faster(level: SpeedLevel): SpeedLevel {
  return FASTER[level];
}

export function slower(level: SpeedLevel): SpeedLevel {
  return SLOWER[level];
}

/** Reads a level from a range input's value, or null when it is not 1 to 5. */
export function toSpeedLevel(value: number): SpeedLevel | null {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : null;
}
