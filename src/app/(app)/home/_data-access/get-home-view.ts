import "server-only";
import { requireCurrentMembership, requireSession } from "@/server/auth";

/** Times are "HH:mm" in the app time zone; `color` is the subject's "#RRGGBB" from the imported legend. */
export type AgendaItemView = {
  id: string;
  subject: string;
  type: string;
  startTime: string;
  endTime: string;
  color: string;
};

export type HomeView = { firstName: string; items: AgendaItemView[] };

/** Início for the signed-in member: their first name and their own agenda items for the selected day. */
export async function getHomeView(): Promise<HomeView> {
  const session = await requireSession();
  await requireCurrentMembership();
  // Agenda items are only written by the cronograma import, which is not built yet, so every day is empty for now.
  return { firstName: session.user.name, items: [] };
}
