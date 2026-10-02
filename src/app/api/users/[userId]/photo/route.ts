import { z } from "zod";
import { getSession } from "@/server/auth";
import { getVisiblePhoto } from "@/server/photos";

const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

/** A member's photo, only for themselves and people in the same household; anyone else gets 404. */
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  const userId = z.uuid().safeParse((await params).userId);
  if (!userId.success) return notFound();

  let photo: Buffer | null;
  try {
    photo = await getVisiblePhoto(session.user.id, userId.data);
  } catch {
    console.error("photo.read.failed");
    return new Response(null, { status: 500 });
  }
  if (!photo) return notFound();

  return new Response(new Uint8Array(photo), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" },
  });
}
