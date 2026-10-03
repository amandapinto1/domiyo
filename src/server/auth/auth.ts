import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { accounts, rateLimits, sessions, users, verifications } from "@/db/schema";
import { ROUTES } from "@/lib/routes";
import { emailFailureDetails, sendEmail, type Email } from "@/server/email";
import { passwordChangedMessage, resetPasswordMessage, verifyEmailMessage } from "@/server/email/templates";
import { hashPassword, verifyPassword } from "./password";

const appPublicUrl = process.env.APP_PUBLIC_URL;
const trustedOrigins = [
  appPublicUrl,
  ...(process.env.NODE_ENV === "development" ? ["http://192.168.100.11:3000"] : []),
].filter((origin): origin is string => Boolean(origin));
const ONE_HOUR_IN_SECONDS = 60 * 60;
const STRICT_RATE_LIMIT = { window: 60, max: 3 };

// Not awaited: waiting would make responses slower only for registered emails (account discovery by timing).
function sendInBackground(email: Email) {
  sendEmail(email).catch((error: unknown) =>
    console.error("auth.email.failed", { subject: email.subject, ...emailFailureDetails(error) }),
  );
}

export const auth = betterAuth({
  appName: "Domiyo",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: users, session: sessions, account: accounts, verification: verifications, rateLimit: rateLimits },
  }),
  user: {
    additionalFields: { surname: { type: "string", required: true, input: true } },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: ONE_HOUR_IN_SECONDS,
    password: { hash: hashPassword, verify: verifyPassword },
    sendResetPassword: async ({ user, url }) => sendInBackground(resetPasswordMessage(user.email, url)),
    onPasswordReset: async ({ user }) =>
      sendInBackground(passwordChangedMessage(user.email, new Date(), `${appPublicUrl}${ROUTES.forgotPassword}`)),
  },
  emailVerification: {
    sendOnSignUp: true,
    // An unverified user who tries to sign in gets a fresh link.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: ONE_HOUR_IN_SECONDS,
    sendVerificationEmail: async ({ user, url }) => sendInBackground(verifyEmailMessage(user.email, url)),
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/request-password-reset": STRICT_RATE_LIMIT,
      "/send-verification-email": STRICT_RATE_LIMIT,
      "/reset-password": STRICT_RATE_LIMIT,
    },
  },
  trustedOrigins,
  advanced: { database: { generateId: "uuid" } },
});
