import { randomInt } from "node:crypto";

const INVITATION_TOKEN_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const INVITATION_TOKEN_LENGTH = 8;

export function generateInvitationToken(): string {
  return Array.from({ length: INVITATION_TOKEN_LENGTH }, () =>
    INVITATION_TOKEN_ALPHABET[randomInt(INVITATION_TOKEN_ALPHABET.length)],
  ).join("");
}