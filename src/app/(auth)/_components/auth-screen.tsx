import type { ReactNode } from "react";

// Building blocks shared by every access screen in docs/design/login.

/** Page title and subtitle above the card. */
export function AuthIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h1 className="text-page-title font-medium text-balance text-heading">{title}</h1>
      <p className="mt-2 text-body text-text dark:text-text-secondary">{children}</p>
    </>
  );
}

// Access screens have exactly one card, so a fixed heading id is unique.
const CARD_TITLE_ID = "auth-card-title";

type AuthCardProps = { title: string; description?: string; children: ReactNode };

/** The single card of an access screen (radius.xl); never nest another card inside. */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <section aria-labelledby={CARD_TITLE_ID} className="mt-8 rounded-xl bg-surface px-6 pt-6 pb-7">
      <h2 id={CARD_TITLE_ID} className="text-section-heading font-medium text-text">
        {title}
      </h2>
      {description ? <p className="mt-6 text-body-small text-text-secondary">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Secondary path below the card, e.g. "Ainda não tem conta? Criar conta". A div, since it may hold a form. */
export function AuthFooter({ children }: { children: ReactNode }) {
  return <div className="mt-10 text-center text-body-small text-text dark:text-text-secondary">{children}</div>;
}
