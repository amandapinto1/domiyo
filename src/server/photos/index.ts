import "server-only";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { userPhotos } from "@/db/schema";
import { decryptBytea, encryptBytea } from "@/server/crypto";

/** Stores (or replaces) the user's photo, already validated as a 512×512 JPEG. */
export async function saveUserPhoto(userId: string, jpeg: Buffer): Promise<void> {
  const { ciphertext, keyVersion } = encryptBytea(jpeg);
  await db
    .insert(userPhotos)
    .values({ userId, photo: ciphertext, keyVersion })
    .onConflictDoUpdate({
      target: userPhotos.userId,
      set: { photo: sql`excluded.photo`, keyVersion: sql`excluded.key_version`, updatedAt: new Date() },
    });
}

/** The photo, if the requester is its owner or shares a household with them; otherwise null, as if it did not exist. */
export async function getVisiblePhoto(requesterId: string, ownerId: string): Promise<Buffer | null> {
  const sharesHousehold = sql`exists (
    select 1 from household_members requester_membership
    join household_members owner_membership on owner_membership.household_id = requester_membership.household_id
    where requester_membership.user_id = ${requesterId}::uuid and owner_membership.user_id = ${userPhotos.userId}
  )`;
  const [row] = await db
    .select({ photo: decryptBytea(userPhotos.photo, userPhotos.keyVersion) })
    .from(userPhotos)
    .where(and(eq(userPhotos.userId, ownerId), or(eq(userPhotos.userId, requesterId), sharesHousehold)))
    .limit(1);
  return row?.photo ?? null;
}
