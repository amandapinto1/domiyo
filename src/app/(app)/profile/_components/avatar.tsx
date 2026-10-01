type AvatarProps = { firstName: string; size: "large" | "small"; isYou: boolean };

const SIZES = { large: "size-24 text-[2.5rem] font-medium", small: "size-9 text-body-small font-medium" } as const;

/** Initial of the first name; profile photos come later (they need encrypted storage). Decorative: the name is next to it. */
export function Avatar({ firstName, size, isYou }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full text-white ${SIZES[size]} ${
        isYou ? "bg-lavender-700" : "bg-lavender-500"
      }`}
    >
      {Array.from(firstName)[0]?.toUpperCase()}
    </span>
  );
}
