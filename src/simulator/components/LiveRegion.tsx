'use client';

import { useSimulator } from './store-context';
import { useSimText } from './use-sim-text';

/** Screen readers hear each step here; the store spaces messages out while the machine runs (spec 5.4). */
export function LiveRegion() {
  const announcement = useSimulator((s) => s.announcement);
  const { plain } = useSimText();
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {announcement?.messages.map(plain).join(' ')}
    </div>
  );
}
