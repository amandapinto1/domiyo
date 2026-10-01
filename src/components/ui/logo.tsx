import { WORDMARK_DOT, WORDMARK_PATH } from "./logo-paths";

type LogoProps = { className?: string };

/** Horizontal lockup ("Ponto + D" symbol + wordmark); follows the active theme. */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="48 40 264 56" role="img" aria-label="Domiyo" className={className}>
      <circle cx="57.92" cy="49" r="7.04" fill="var(--app-logo-accent)" />
      <rect x="50.24" y="59.24" width="15.36" height="28.8" rx="7.68" fill="var(--app-logo-stem)" />
      <path d="M68.16 41.96H70.72A23.04 23.04 0 0 1 70.72 88.04H68.16Z" fill="var(--app-logo-accent)" />
      <path d={WORDMARK_PATH} fill="var(--app-logo-text)" />
      <circle {...WORDMARK_DOT} fill="var(--app-logo-accent)" />
    </svg>
  );
}
