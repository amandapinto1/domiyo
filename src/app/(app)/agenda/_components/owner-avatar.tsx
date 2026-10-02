import type { ItemOwner } from "../_data-access/get-agenda-view";

/** "Avatar mini": the owner's photo or initials, never a per-user color (docs/PRD.md). */
export function OwnerAvatar({ owner }: { owner: ItemOwner }) {
  return (
    <span
      role="img"
      aria-label={owner.name}
      title={owner.name}
      className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-[0.625rem] leading-none font-semibold text-lavender-900"
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
