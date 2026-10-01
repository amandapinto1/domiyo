"use client";

import type { ComponentProps, ReactNode } from "react";
import styled from "styled-components";

const StyledInput = styled.input<{ $hasTrailing: boolean }>`
  width: 100%;
  height: 54px;
  padding: 0 ${({ $hasTrailing }) => ($hasTrailing ? "56px" : "16px")} 0 16px;
  border: 1.5px solid var(--app-border-interactive);
  border-radius: var(--radius-md);
  background: var(--app-input);
  color: var(--app-text);
  font: 400 1rem / 1.5rem var(--font-sans);
  transition:
    border-color 120ms ease-out,
    box-shadow 120ms ease-out;

  &::placeholder {
    color: var(--app-text-secondary);
    opacity: 1;
  }
  &:focus-visible {
    outline: none;
    border-color: var(--app-focus);
    box-shadow: 0 0 0 1px var(--app-focus);
  }
  &[aria-invalid="true"] {
    border-color: var(--app-danger);
  }
  &[aria-invalid="true"]:focus-visible {
    box-shadow: 0 0 0 1px var(--app-danger);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

type InputProps = Omit<ComponentProps<"input">, "children"> & {
  /** Control rendered inside the field on the right (e.g. the password eye toggle). */
  trailing?: ReactNode;
};

export function Input({ trailing, ...props }: InputProps) {
  if (!trailing) return <StyledInput $hasTrailing={false} {...props} />;

  return (
    <div className="relative">
      <StyledInput $hasTrailing {...props} />
      <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>
    </div>
  );
}
