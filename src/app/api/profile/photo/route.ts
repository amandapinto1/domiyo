import { jpegDimensions } from "@/lib/jpeg";
import { getSession } from "@/server/auth";
import { saveUserPhoto } from "@/server/photos";

// docs/ARCHITECTURE.md: photos are at most 512×512 and 1 MB; the browser crops and resizes before upload.
const PHOTO_SIZE_PX = 512;
const MAX_PHOTO_BYTES = 1024 * 1024;

const error = (status: number, message: string) => Response.json({ message }, { status });

function isTrustedOrigin(request: Request): boolean {
  // An empty APP_PUBLIC_URL (local .env) falls back to the request's own origin.
  const expected = new URL(process.env.APP_PUBLIC_URL || request.url).origin;
  return request.headers.get("origin") === expected;
}

/** Replaces the signed-in user's profile photo with a 512×512 JPEG. */
export async function PUT(request: Request) {
  if (!isTrustedOrigin(request)) return error(403, "Origem não permitida.");
  const session = await getSession();
  if (!session) return error(401, "Entre de novo para trocar a foto.");

  const declaredLength = Number(request.headers.get("content-length"));
  if (!Number.isInteger(declaredLength) || declaredLength <= 0) return error(411, "Envie a foto de novo.");
  if (declaredLength > MAX_PHOTO_BYTES) return error(413, "A foto ficou grande demais. Tente outra imagem.");

  const photo = Buffer.from(await request.arrayBuffer());
  const size = jpegDimensions(photo);
  if (photo.length > MAX_PHOTO_BYTES || size?.width !== PHOTO_SIZE_PX || size.height !== PHOTO_SIZE_PX) {
    return error(415, "Não foi possível usar essa imagem. Tente outra.");
  }

  try {
    await saveUserPhoto(session.user.id, photo);
  } catch {
    console.error("photo.upload.failed");
    return error(500, "Não foi possível salvar a foto. Tente de novo.");
  }
  return new Response(null, { status: 204 });
}
