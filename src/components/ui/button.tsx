"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styled, { css, keyframes } from "styled-components";

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const primaryStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 10px 10px 10px 28px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--app-primary);
  color: var(--app-on-primary);
  font: 500 1rem / 1.5rem var(--font-sans);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: transform 120ms ease-out;

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 2px var(--app-surface),
      0 0 0 4px var(--app-focus);
  }
  &:disabled {
    cursor: not-allowed;
  }
  &[aria-busy="true"] {
    cursor: progress;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:active:not(:disabled) {
      transform: none;
    }
  }
`;

const StyledButton = styled.button`
  ${primaryStyles}
`;

const StyledLink = styled(NextLink)`
  ${primaryStyles}
`;

const IconCircle = styled.span`
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--app-primary-accent);
  color: var(--app-on-primary-accent);
`;

const Spinner = styled(LoaderCircle)`
  animation: ${spin} 0.8s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2.4s;
  }
`;

type ButtonProps = ComponentProps<"button"> & {
  children: ReactNode;
  isPending?: boolean;
  /** Label shown while pending, e.g. "Entrando…". */
  pendingLabel?: string;
};

/** Primary pill button with the arrow circle from the design. */
export function Button({ children, isPending = false, pendingLabel, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <StyledButton type={type} disabled={disabled || isPending} aria-busy={isPending} {...props}>
      <span>{isPending && pendingLabel ? pendingLabel : children}</span>
      <IconCircle aria-hidden="true">
        {isPending ? <Spinner className="size-5" /> : <ArrowRight className="size-5" strokeWidth={2} />}
      </IconCircle>
    </StyledButton>
  );
}

/** Navigation that looks like the primary button (e.g. "Ir para o login"). */
export function ButtonLink({ children, ...props }: ComponentProps<typeof NextLink> & { children: ReactNode }) {
  return (
    <StyledLink {...props}>
      <span>{children}</span>
      <IconCircle aria-hidden="true">
        <ArrowRight className="size-5" strokeWidth={2} />
      </IconCircle>
    </StyledLink>
  );
}
