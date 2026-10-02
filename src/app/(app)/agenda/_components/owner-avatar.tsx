import type { ItemOwner } from "../_data-access/get-agenda-view";

/** "Avatar mini": the owner's photo or initials, never a per-user color (docs/PRD.md). */
export function OwnerAvatar({ owner, size = "small" }: { owner: ItemOwner; size?: "small" | "large" }) {
  return (
    <span
      role="img"
      aria-label={owner.name}
      title={owner.name}
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-white leading-none font-semibold text-lavender-900 ${
        size === "large" ? "size-10 text-body-small" : "size-6 text-[0.625rem]"
      }`}
    >
      {owner.photoUrl ? (
        // Private, authenticated photo: it must not go through the shared image optimizer cache.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={owner.photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{owner.initials}</span>
      )}
    </span>
  );
}
