import type { ReactNode } from 'react';

interface IconProps {
  className?: string;
}

/** The menu icons drawn for this app (spec 6): a 24px grid, a 1.8px line, round ends. Screen readers skip them. */
function DrawnIcon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Learn: an open book. */
export function BookIcon({ className }: IconProps) {
  return (
    <DrawnIcon className={className}>
      <path d="M3 5.5c3-1.2 6-1 9 1v13c-3-2-6-2.2-9-1z" />
      <path d="M21 5.5c-3-1.2-6-1-9 1v13c3-2 6-2.2 9-1z" />
    </DrawnIcon>
  );
}

/** Simulator: three tape cells with the head's pointer above the middle one. */
export function TapeIcon({ className }: IconProps) {
  return (
    <DrawnIcon className={className}>
      <path d="M12 2.5l-2.6 3.6h5.2z" fill="currentColor" />
      <rect x="1.5" y="9" width="21" height="8" />
      <path d="M8.5 9v8M15.5 9v8" />
    </DrawnIcon>
  );
}

/** Enigma: a rotor with its hub and the contacts round the edge. */
export function RotorIcon({ className }: IconProps) {
  return (
    <DrawnIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </DrawnIcon>
  );
}

/** Bombe: the cabinet's front with two rows of three drums. */
export function BombeIcon({ className }: IconProps) {
  return (
    <DrawnIcon className={className}>
      <rect x="2" y="3.5" width="20" height="17" rx="1.2" />
      <circle cx="7" cy="9" r="1.9" />
      <circle cx="12" cy="9" r="1.9" />
      <circle cx="17" cy="9" r="1.9" />
      <circle cx="7" cy="15" r="1.9" />
      <circle cx="12" cy="15" r="1.9" />
      <circle cx="17" cy="15" r="1.9" />
    </DrawnIcon>
  );
}

/** Support the dev: a cup with steam. */
export function CupIcon({ className }: IconProps) {
  return (
    <DrawnIcon className={className}>
      <path d="M4 9.5h12v4.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M16 10.5h1.6a2.4 2.4 0 0 1 0 4.8H16" />
      <path d="M8 3.5c-.9.9.9 1.8 0 3M12 3.5c-.9.9.9 1.8 0 3" />
    </DrawnIcon>
  );
}
