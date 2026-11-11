/**
 * Decides when the live region speaks. While the machine runs, it speaks at most once per
 * `minGapMs`, so a screen reader is not flooded (spec 5.4). Other messages always pass.
 */
export function createAnnouncer(minGapMs = 1000, now: () => number = () => Date.now()) {
  let last = -Infinity;
  return {
    shouldAnnounce(throttle: boolean): boolean {
      const time = now();
      if (throttle && time - last < minGapMs) return false;
      last = time;
      return true;
    },
  };
}
