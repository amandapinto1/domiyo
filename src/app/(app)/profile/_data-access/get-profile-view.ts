import "server-only";
import { notFound } from "next/navigation";
import { formatShortDate } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";
import { requireCurrentMembership, requireSession } from "@/server/auth";
import { getHouseholdOverview, getSentInvitations } from "@/server/households";
import { summarizeInvitation, type InvitationItemView } from "../_components/invitation-summary";

export type MemberView = {
  memberId: string;
  firstName: string;
  roleLabel: string;
  isYou: boolean;
  photoUrl: string | null;
};

export type ProfileView = {
  account: { firstName: string; surname: string; email: string; photoUrl: string | null };
  household: {
    id: string;
    name: string;
    members: MemberView[];
    invitations: InvitationItemView[];
    /** Leaving would delete the household and all of its data. */
    isLastMember: boolean;
  };
};

/** Perfil for the signed-in member: their account and their household's members and invitations. */
export async function getProfileView(): Promise<ProfileView> {
  const session = await requireSession();
  const { householdId, userId } = await requireCurrentMembership();
  const [overview, invitations] = await Promise.all([getHouseholdOverview(householdId), getSentInvitations(householdId)]);
  if (!overview) notFound();

  const members = overview.members
    .map(({ memberId, userId: memberUserId, firstName, role, photoUpdatedAt }) => {
      const isYou = memberUserId === userId;
      const roleLabel = role === "admin" ? "admin" : "membro";
      return {
        memberId,
        firstName,
        isYou,
        roleLabel: isYou ? `Você · ${roleLabel}` : capitalize(roleLabel),
        photoUrl: photoUpdatedAt ? ROUTES.userPhoto(memberUserId, photoUpdatedAt.getTime()) : null,
      };
    })
    .sort((first, second) => Number(second.isYou) - Number(first.isYou));

  return {
    account: {
      firstName: session.user.name,
      surname: session.user.surname,
      email: session.user.email,
      photoUrl: members.find((member) => member.isYou)?.photoUrl ?? null,
    },
    household: {
      id: householdId,
      name: overview.name,
      members,
      invitations: invitations.map((invitation) => summarizeInvitation(invitation, (date) => formatShortDate(date))),
      isLastMember: members.length === 1,
    },
  };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
