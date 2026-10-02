import { z } from "zod";

// Accept new 8-character codes and link lengths issued by previous versions.
export const invitationTokenSchema = z.string().regex(/^(?:[\w-]{8}|[\w-]{16}|[\w-]{43})$/);
