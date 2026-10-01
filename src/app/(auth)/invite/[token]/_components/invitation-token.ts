import { z } from "zod";

// Tokens are random base64url strings; anything else cannot match a stored hash.
export const invitationTokenSchema = z.string().regex(/^[\w-]{16,256}$/);
