"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { Input } from "./input";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type" | "trailing">;

/** Password field with an eye toggle to show or hide what was typed. */
export function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <Input
      {...props}
      type={isVisible ? "text" : "password"}
      trailing={
        <button
          type="button"
          aria-controls={props.id}
          aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setIsVisible((wasVisible) => !wasVisible)}
          className="grid size-10 cursor-pointer place-items-center rounded-sm text-text-secondary transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
        >
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      }
    />
  );
}
