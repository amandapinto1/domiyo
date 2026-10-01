import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Same origin as the app, so no public base URL is needed.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({ user: { surname: { type: "string", required: true } } })],
});
