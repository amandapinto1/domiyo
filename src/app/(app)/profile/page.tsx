import { Bell, Camera } from "lucide-react";
import type { Metadata } from "next";
import { AccountCard } from "./_components/account-card";
import { Avatar } from "./_components/avatar";
import { HouseholdCard } from "./_components/household-card";
import { getProfileView } from "./_data-access/get-profile-view";

export const metadata: Metadata = { title: "Perfil · Domiyo" };

export default async function ProfilePage() {
  const { account, household } = await getProfileView();

  return (
    <main className="flex min-h-dvh flex-col px-6 pt-14 pb-28 md:px-10 md:pt-12 md:pb-12 lg:px-16">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title font-medium text-heading">Perfil</h1>
          <p className="mt-1 hidden text-body-small text-text-secondary md:block">Sua conta e o seu household</p>
        </div>
        {/* Notifications are not built yet; the bell keeps its place in the header. */}
        <button
          type="button"
          disabled
          aria-label="Notificações (em breve)"
          className="hidden size-12 shrink-0 place-items-center rounded-full bg-white text-lavender-900 md:grid dark:bg-lavender-900 dark:text-white"
        >
          <Bell aria-hidden="true" className="size-6" strokeWidth={1.75} />
        </button>
      </header>

      <div className="mt-6 flex w-full max-w-150 flex-col gap-6 md:mt-8 xl:grid xl:max-w-none xl:grid-cols-[26.25rem_minmax(0,37.5rem)] xl:items-start xl:gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar firstName={account.firstName} size="large" isYou />
              {/* Profile photos need encrypted storage (docs/ARCHITECTURE.md), which is not built yet. */}
              <button
                type="button"
                disabled
                aria-label="Alterar foto (em breve)"
                className="absolute -right-1 bottom-0 grid size-8 place-items-center rounded-full border-2 border-lavender-100 bg-white text-lavender-900 dark:border-lavender-950"
              >
                <Camera aria-hidden="true" className="size-4" strokeWidth={2} />
              </button>
            </div>
            <p className="mt-3 text-section-heading font-medium break-words text-heading">{account.firstName}</p>
            <p className="mt-1 text-body-small break-all text-text-secondary">{account.email}</p>
          </div>
          <AccountCard firstName={account.firstName} surname={account.surname} email={account.email} />
        </div>
        <HouseholdCard household={household} />
      </div>
    </main>
  );
}
