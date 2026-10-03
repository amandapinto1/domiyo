import type { ItemOwner } from "../_data-access/get-agenda-view";

/** "Avatar mini": the owner's photo or initials, never a per-user color (docs/PRD.md). */
export function OwnerAvatar({ owner, size = "small", borderColor }: { owner: ItemOwner; size?: "small" | "large"; borderColor?: string }) {
  return (
    <span
      role="img"
      aria-label={owner.name}
      title={owner.name}
      style={size === "small" && borderColor ? { borderColor } : undefined}
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-white leading-none font-semibold text-lavender-900 ${
        size === "large" ? "size-10 border-2 border-white text-body-small dark:border-lavender-900" : "size-6 border-2 text-[0.625rem]"
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

export function OwnersAvatar({ owners, size = "small", borderColor }: { owners: ItemOwner[]; size?: "small" | "large"; borderColor?: string }) {
  const visibleOwners = size === "large" ? owners : owners.slice(0, 3);
  const remainingOwners = size === "large" ? [] : owners.slice(3);
  const sizeClass = size === "large" ? "size-10 text-body-small" : "size-6 text-[0.625rem]";

  return (
    <span
      className={`flex shrink-0 items-center -space-x-2 ${size === "large" ? "max-w-full flex-wrap justify-end" : ""}`}
      aria-label={owners.map((owner) => owner.name).join(", ")}
    >
      {visibleOwners.map((owner) => <OwnerAvatar key={owner.id} owner={owner} size={size} borderColor={borderColor} />)}
      {remainingOwners.length > 0 ? (
        <span
          role="img"
          aria-label={`${remainingOwners.length} outros membros: ${remainingOwners.map((owner) => owner.name).join(", ")}`}
          title={remainingOwners.map((owner) => owner.name).join(", ")}
          style={borderColor ? { borderColor } : undefined}
          className={`grid shrink-0 place-items-center rounded-full border-2 bg-white font-semibold text-lavender-900 ${sizeClass}`}
        >
          +{remainingOwners.length}
        </span>
      ) : null}
    </span>
  );
}
