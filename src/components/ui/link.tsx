import NextLink from "next/link";
import type { ComponentProps } from "react";

// docs/DESIGN_SYSTEM.md > Links: SemiBold 14/20, never underlined, color only from link tokens.
export const linkClassName =
  "cursor-pointer rounded-[4px] text-body-small font-semibold text-link no-underline transition-colors hover:text-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link-focus";

/** Navigation link. */
export function Link({ className = "", ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink className={`${linkClassName} ${className}`} {...props} />;
}
