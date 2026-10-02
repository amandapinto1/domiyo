// Shared class strings for the Perfil controls; full strings so Tailwind can see them.
export const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const PILL = `flex h-12 cursor-pointer items-center justify-center rounded-full px-6 text-body-small font-medium transition-transform motion-safe:active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

export const PRIMARY_PILL = `${PILL} bg-lavender-900 text-white dark:bg-lime-500 dark:text-lavender-900`;
export const OUTLINE_PILL = `${PILL} border-[1.5px] border-lavender-600 text-text`;
export const DANGER_PILL = `${PILL} bg-danger-600 text-white dark:bg-danger-300 dark:text-lavender-900`;

// Inputs on a lavender-900 surface use the page color in dark mode, as in the Convidar membro design.
export const CARD = "rounded-xl bg-white p-5 dark:bg-lavender-900 dark:[--app-input:var(--color-lavender-950)]";
export const ICON_BUTTON = `grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-lavender-100 text-lavender-900 dark:bg-lavender-800 dark:text-white ${FOCUS_RING}`;
