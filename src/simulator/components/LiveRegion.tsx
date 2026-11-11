'use client';

import { useSimulator } from './store-context';
import { useSimText } from './use-sim-text';

/** Screen readers hear each step here; the store spaces messages out while the machine runs (spec 5.4). */
export function LiveRegion() {
  const announcement = useSimulator((s) => s.announcement);
  const { plain } = useSimText();
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {/* The key replaces the text node on every announcement, so a screen reader speaks the same words again. */}
      {announcement !== null && <span key={announcement.id}>{announcement.messages.map(plain).join(' ')}</span>}
    </div>
  );
}
