'use client';

import { TriangleAlert } from 'lucide-react';
import { describeIssue, describeWarning } from '../describe';
import { useSimulator } from './store-context';
import { useSimText } from './use-sim-text';

/** Compile issues (the machine cannot run) and warnings, as text above the rule table (spec 8). */
export function MachineMessages() {
  const compile = useSimulator((s) => s.compile);
  const importWarnings = useSimulator((s) => s.importWarnings);
  const { plain } = useSimText();

  const issues = compile.ok ? [] : compile.issues.map(describeIssue);
  const warnings = [...compile.warnings, ...importWarnings].map(describeWarning);
  if (issues.length === 0 && warnings.length === 0) return null;
  return (
    <ul className="mb-4 flex flex-col gap-2 text-sm">
      {issues.map((message, index) => (
        <li key={`issue-${index}`} className="flex items-start gap-2 border-l-4 border-pencil bg-cell px-3 py-2 text-pencil">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 flex-none" />
          {plain(message)}
        </li>
      ))}
      {warnings.map((message, index) => (
        <li key={`warning-${index}`} className="flex items-start gap-2 bg-cell px-3 py-2 text-muted">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 flex-none" />
          {plain(message)}
        </li>
      ))}
    </ul>
  );
}
