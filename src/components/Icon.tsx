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
  | 'check'
  | 'moon'
  | 'timer'
  | 'sound'
  | 'soundOff'
  | 'snowflake'
  | 'wall'
  | 'portal'
  | 'back'
  | 'map'
  | 'share'
  | 'palette'
  | 'album'
  | 'gift'
  | 'shield'
  | 'reset'
  | 'home'
  | 'undo'
  | 'gear'
  | 'chart'
  | 'vibrate';

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
  moon: (
    <>
      <path d="M19.5 13.8A8 8 0 1 1 10.2 4.5 6.4 6.4 0 0 0 19.5 13.8z" />
      <circle className="fill" cx="15.5" cy="8.5" r="1" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.2" />
      <path d="M12 13.5V9.8" />
      <path d="M9.8 2.8h4.4" />
      <path d="M12 2.8v3.5" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9.5v5h3.2L12 18.5v-13L7.2 9.5H4z" />
      <path d="M15.2 9.2a4 4 0 0 1 0 5.6" />
      <path d="M17.8 6.8a7.4 7.4 0 0 1 0 10.4" />
    </>
  ),
  soundOff: (
    <>
      <path d="M4 9.5v5h3.2L12 18.5v-13L7.2 9.5H4z" />
      <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
    </>
  ),
  snowflake: (
    <>
      <path d="M12 2.8v18.4M4 7.4l16 9.2M20 7.4L4 16.6" />
      <path d="M9.6 4.6L12 7l2.4-2.4M9.6 19.4L12 17l2.4 2.4" />
      <circle className="fill" cx="12" cy="12" r="1.4" />
    </>
  ),
  wall: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="M3 9.5h18M3 14.5h18" />
      <path d="M9 4.5v5M15 9.5v5M9 14.5v5" />
    </>
  ),
  portal: (
    <>
      <path d="M12 2.8a9.2 9.2 0 1 1-9.2 9.2" />
      <path d="M12 7a5 5 0 1 1-5 5" />
      <circle className="fill" cx="12" cy="12" r="1.6" />
    </>
  ),
  back: (
    <>
      <path d="M15 5l-7 7 7 7" />
      <path d="M8 12h11" />
    </>
  ),
  map: (
    <>
      <path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="17.5" cy="5.5" r="2.6" />
      <circle cx="17.5" cy="18.5" r="2.6" />
      <path d="M8.4 10.8l6.8-4M8.4 13.2l6.8 4" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2.2-.9 2.2-2 0-1-.7-1.6-.7-2.5 0-1.2 1-2 2.2-2h1.8A3.5 3.5 0 0 0 21 11c-.4-4.5-4.3-8-9-8z" />
      <circle className="fill" cx="7.8" cy="10.5" r="1.4" />
      <circle className="fill" cx="12" cy="7.6" r="1.4" />
      <circle className="fill" cx="16.2" cy="10" r="1.4" />
    </>
  ),
  album: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M9.2 10v10M14.8 10v10" />
      <path d="M8 5V3.4M16 5V3.4" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="10" width="16" height="10.5" rx="1.5" />
      <path d="M4 14h16M12 10v10.5" />
      <path d="M12 10c-4 0-5.5-1.3-5.5-3A2.4 2.4 0 0 1 9 4.6c2 0 3 2.4 3 5.4zm0 0c4 0 5.5-1.3 5.5-3A2.4 2.4 0 0 0 15 4.6c-2 0-3 2.4-3 5.4z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v6c0 4.4-3 7.6-7.5 9-4.5-1.4-7.5-4.6-7.5-9V6z" />
      <path d="M9 11.8l2.2 2.2 4-4.2" />
    </>
  ),
  reset: (
    <>
      <path d="M5.2 12a6.8 6.8 0 1 0 2-4.8" />
      <path d="M5 4.2v3.6h3.6" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.2 12 4l8 7.2" />
      <path d="M6.2 10.2V20h11.6v-9.8" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  undo: (
    <>
      <path d="M6 9.5h8.5a4.5 4.5 0 0 1 0 9H9" />
      <path d="M8.8 5.5 5 9.3l3.8 3.8" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5.4 5.4l2.1 2.1M16.5 16.5l2.1 2.1M18.6 5.4l-2.1 2.1M7.5 16.5l-2.1 2.1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </>
  ),
  vibrate: (
    <>
      <rect x="8.5" y="5" width="7" height="14" rx="1.6" />
      <path d="M3.5 9v6M6 7.5v9M18 7.5v9M20.5 9v6" />
    </>
  ),
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
