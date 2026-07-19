import type { Lang } from '../i18n/i18n';

// Vlaječky jazyků jako inline SVG (žádné externí assety). Diagonály
// vlajky UK vedou z rohu do rohu, takže není potřeba clip.
interface FlagProps {
  lang: Lang;
  className?: string;
}

export function Flag({ lang, className }: FlagProps) {
  return (
    <span className={className ? `flag ${className}` : 'flag'} aria-hidden="true">
      {lang === 'cs' && (
        <svg viewBox="0 0 30 20">
          <rect width="30" height="10" fill="#ffffff" />
          <rect y="10" width="30" height="10" fill="#d7141a" />
          <path d="M0 0 15 10 0 20Z" fill="#11457e" />
        </svg>
      )}
      {lang === 'de' && (
        <svg viewBox="0 0 30 20">
          <rect width="30" height="20" fill="#000000" />
          <rect y="6.67" width="30" height="6.67" fill="#dd0000" />
          <rect y="13.34" width="30" height="6.66" fill="#ffce00" />
        </svg>
      )}
      {lang === 'en' && (
        <svg viewBox="0 0 30 20">
          <rect width="30" height="20" fill="#012169" />
          <path d="M0 0 30 20M30 0 0 20" stroke="#ffffff" strokeWidth="4" />
          <path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" strokeWidth="2" />
          <path d="M15 0V20M0 10H30" stroke="#ffffff" strokeWidth="6" />
          <path d="M15 0V20M0 10H30" stroke="#c8102e" strokeWidth="3.4" />
        </svg>
      )}
    </span>
  );
}
