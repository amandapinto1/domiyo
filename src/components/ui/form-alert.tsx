import { CircleAlert, CircleCheck } from "lucide-react";

type FormAlertProps = { message: string; tone?: "danger" | "success" };

const TONES = {
  danger: {
    role: "alert",
    Icon: CircleAlert,
    className: "bg-danger-subtle text-danger dark:border dark:border-danger",
  },
  success: {
    role: "status",
    Icon: CircleCheck,
    className:
      "bg-success-100 text-success-600 dark:border dark:border-success-300 dark:bg-transparent dark:text-success-300",
  },
} as const;

/** Form-level message, announced to assistive technology when it appears. */
export function FormAlert({ message, tone = "danger" }: FormAlertProps) {
  const { role, Icon, className } = TONES[tone];

  return (
    <div role={role} className={`flex items-start gap-2 rounded-sm px-4 py-3 text-body-small ${className}`}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
