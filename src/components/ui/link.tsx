import NextLink from "next/link";
import type { ComponentProps } from "react";

// docs/DESIGN_SYSTEM.md > Links: SemiBold 14/20, never underlined, color only from link tokens.
const linkBaseClassName =
  "cursor-pointer rounded-[4px] text-body-small font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link-focus disabled:cursor-not-allowed disabled:opacity-60";
export const linkClassName = `${linkBaseClassName} text-link hover:text-link-hover`;
/** "Perigo" tone, for destructive actions such as "Revogar link". */
export const dangerLinkClassName = `${linkBaseClassName} text-danger hover:text-danger-700 dark:hover:text-danger-100`;

/** Navigation link. */
export function Link({ className = "", ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink className={`${linkClassName} ${className}`} {...props} />;
}
