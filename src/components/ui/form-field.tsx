import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  /** Id of the error message; pass it to the control's aria-describedby (see `describedBy`). */
  errorId: string;
  error?: string;
  /** Helper text below the control, e.g. "Use pelo menos 8 caracteres." */
  hint?: string;
  hintId?: string;
  children: ReactNode;
};

/** Ids for the control's aria-describedby: the hint (if any) and the error (when shown). */
export function describedBy(ids: { hintId?: string; errorId: string; hasError: boolean }): string | undefined {
  return [ids.hintId, ids.hasError ? ids.errorId : undefined].filter(Boolean).join(" ") || undefined;
}

/** Visible label above the control, optional hint and inline error below it. */
export function FormField({ label, htmlFor, errorId, error, hint, hintId, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-body-small font-medium text-text">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-body-small text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-center gap-1.5 text-body-small text-danger">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
