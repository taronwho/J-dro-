import type { ReactElement } from 'react';

export type IconName =
  | 'star'
  | 'bulb'
  | 'bolt'
  | 'flame'
  | 'trophy'
  | 'calendar'
  | 'infinity'
  | 'target'
  | 'cores'
  | 'torus'
  | 'hourglass'
  | 'lock'
  | 'help'
  | 'check';

// Vlastní ikonografie hry: tahové SVG ikony 24×24 ve stylu trubek —
// tenké linky, kulatá zakončení, tečky jako energetické uzly.
const PATHS: Record<IconName, ReactElement> = {
  star: (
    <path
      className="star-path"
      d="M12 3.2l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.2l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7z"
    />
  ),
  bulb: (
    <>
      <path d="M12 3a6 6 0 0 1 3.6 10.8c-.7.5-1.1 1.3-1.1 2.2h-5c0-.9-.4-1.7-1.1-2.2A6 6 0 0 1 12 3z" />
      <path d="M10 19.5h4" />
      <path d="M10.8 22h2.4" />
      <circle className="fill" cx="12" cy="9.5" r="1.4" />
    </>
  ),
  bolt: <path d="M13.2 2.5L5.5 13.5h5l-1.7 8 7.7-11h-5l1.7-8z" />,
  flame: (
    <path d="M12 2.8c3.8 3.6 6 6.9 6 10.4a6 6 0 0 1-12 0c0-1.9.7-3.7 2-5.4.1 1.8.9 2.9 2.2 3.2-.9-2.9-.3-5.6 1.8-8.2z" />
  ),
  trophy: (
    <>
      <path d="M7 4h10v5.5a5 5 0 0 1-10 0z" />
      <path d="M7 5.5H3.8A3.2 3.2 0 0 0 7.2 9" />
      <path d="M17 5.5h3.2A3.2 3.2 0 0 1 16.8 9" />
      <path d="M12 14.5V17" />
      <path d="M9.5 20.5c0-2 1-3.5 2.5-3.5s2.5 1.5 2.5 3.5" />
      <path d="M8 20.5h8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 2.8v4.4M16 2.8v4.4M3.5 10.5h17" />
      <circle className="fill" cx="12" cy="15.5" r="1.6" />
    </>
  ),
  infinity: (
    <path d="M5.8 8.4c4 0 8.4 7.2 12.4 7.2 2 0 3.6-1.6 3.6-3.6s-1.6-3.6-3.6-3.6c-4 0-8.4 7.2-12.4 7.2-2 0-3.6-1.6-3.6-3.6s1.6-3.6 3.6-3.6z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 2.2v2.6M12 19.2v2.6M2.2 12h2.6M19.2 12h2.6" />
    </>
  ),
  cores: (
    <>
      <path className="dim" d="M12 6L6.2 17.4M12 6l5.8 11.4M6.2 17.4h11.6" />
      <circle cx="12" cy="6" r="2.4" style={{ stroke: 'var(--core-0)' }} />
      <circle cx="6" cy="17.6" r="2.4" style={{ stroke: 'var(--core-1)' }} />
      <circle cx="18" cy="17.6" r="2.4" style={{ stroke: 'var(--core-2)' }} />
    </>
  ),
  torus: (
    <>
      <circle cx="12" cy="12" r="5.8" />
      <ellipse cx="12" cy="12" rx="10.5" ry="3.6" />
    </>
  ),
  hourglass: (
    <>
      <path d="M6.8 3.2h10.4M6.8 20.8h10.4" />
      <path d="M8.2 3.2v2.9c0 2.6 3.8 3.4 3.8 5.9s-3.8 3.3-3.8 5.9v2.9" />
      <path d="M15.8 3.2v2.9c0 2.6-3.8 3.4-3.8 5.9s3.8 3.3 3.8 5.9v2.9" />
      <circle className="fill" cx="12" cy="17.8" r="1.2" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.2" />
      <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
      <circle className="fill" cx="12" cy="15.2" r="1.4" />
    </>
  ),
  help: (
    <>
      <path d="M8.8 9.2a3.2 3.2 0 1 1 4.8 2.8c-1 .6-1.6 1.3-1.6 2.5" />
      <circle className="fill" cx="12" cy="18.6" r="1.3" />
    </>
  ),
  check: <path d="M5 12.6l4.4 4.4L19 7.4" />,
};

interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
