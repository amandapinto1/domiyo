type AvatarProps = { firstName: string; size: "large" | "small"; isYou: boolean; photoUrl: string | null };

const SIZES = { large: "size-24 text-[2.5rem] font-medium", small: "size-9 text-body-small font-medium" } as const;

/** Profile photo, or the initial of the first name. Decorative: the name is always next to it. */
export function Avatar({ firstName, size, isYou, photoUrl }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full text-white ${SIZES[size]} ${
        isYou ? "bg-lavender-700" : "bg-lavender-500"
      }`}
    >
      {photoUrl ? (
        // Private, authenticated photo: it must not go through the shared image optimizer cache.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        Array.from(firstName)[0]?.toUpperCase()
      )}
    </span>
  );
}
