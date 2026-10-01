import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getSession } from "@/server/auth";

// App entry; the logo intro plays over the sign-in screen.
export default async function EntryPage() {
  redirect((await getSession()) ? ROUTES.home : ROUTES.signIn);
}
