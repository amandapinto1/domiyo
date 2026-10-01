"use client";

import { useEffect, useRef } from "react";
import styled, { css, keyframes } from "styled-components";
import { WORDMARK_DOT, WORDMARK_PATH, WORDMARK_VIEW_BOX } from "./logo-paths";

// Choreography from the approved prototype (docs/design/logo/animacao-splash.html), then a hold and a fade that reveals the page behind.
const EXIT_DELAY = "2.1s";
const EXIT_DURATION = "0.6s";
const REDUCED_EXIT_DELAY = "0.9s";

const stemRise = keyframes`
  from { transform: translateY(35%) scaleY(0.3); opacity: 0; }
  to { transform: none; opacity: 1; }
`;
const discUnfold = keyframes`
  from { transform: scaleX(0); opacity: 0; }
  to { transform: none; opacity: 1; }
`;
const dotDrop = keyframes`
  0% { transform: translateY(-180%) scale(0.6); opacity: 0; }
  60% { transform: translateY(12%) scale(1.05); opacity: 1; }
  100% { transform: none; opacity: 1; }
`;
const wordmarkRise = keyframes`
  from { transform: translateY(12px); opacity: 0; }
  to { transform: none; opacity: 1; }
`;
const pop = keyframes`
  from { transform: scale(0); opacity: 0; }
  to { transform: none; opacity: 1; }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; visibility: hidden; }
`;

const part = css`
  transform-box: fill-box;
  @media (prefers-reduced-motion: reduce) {
    animation: ${fadeIn} 0.3s ease-out 0s both;
  }
`;

const Stage = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: var(--app-splash);
  animation: ${fadeOut} ${EXIT_DURATION} ease-in-out ${EXIT_DELAY} both;
  @media (prefers-reduced-motion: reduce) {
    animation-delay: ${REDUCED_EXIT_DELAY};
  }
`;

const Lockup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const Stem = styled.rect`
  fill: var(--app-logo-stem);
  transform-origin: 50% 100%;
  animation: ${stemRise} 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both;
  ${part}
`;
const Disc = styled.path`
  fill: var(--app-logo-accent);
  transform-origin: 0% 50%;
  animation: ${discUnfold} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s both;
  ${part}
`;
const Dot = styled.circle`
  fill: var(--app-logo-accent);
  transform-origin: 50% 50%;
  animation: ${dotDrop} 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) 0.75s both;
  ${part}
`;
const Wordmark = styled.path`
  fill: var(--app-logo-text);
  animation: ${wordmarkRise} 0.5s ease-out 1.05s both;
  ${part}
`;
const WordmarkDot = styled.circle`
  fill: var(--app-logo-accent);
  transform-origin: 50% 50%;
  animation: ${pop} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.4s both;
  ${part}
`;

type LogoSplashProps = {
  /** Called once the overlay has fully faded out; unmount it then. */
  onFinish: () => void;
};

/** Full-screen logo intro over the page; it fades out to reveal what is rendered behind it. CSS-only, honors reduced motion. */
export function LogoSplash({ onFinish }: LogoSplashProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  // The CSS starts before hydration, so an animationend listener could miss it; `finished` cannot.
  useEffect(() => {
    let isActive = true;
    const exit = stageRef.current?.getAnimations()[0];
    const done = () => {
      if (isActive) onFinish();
    };
    if (exit) exit.finished.then(done, () => {});
    else done();
    return () => {
      isActive = false;
    };
  }, [onFinish]);

  return (
    <Stage ref={stageRef} data-testid="logo-splash">
      <Lockup role="img" aria-label="Domiyo">
        <svg viewBox="0 0 100 100" aria-hidden="true" className="size-28 overflow-visible">
          <Stem x="16" y="41" width="24" height="45" rx="12" />
          <Disc d="M44 14H48A36 36 0 0 1 48 86H44Z" />
          <Dot cx="28" cy="25" r="11" />
        </svg>
        <svg viewBox={WORDMARK_VIEW_BOX} aria-hidden="true" className="h-16.5 w-49 overflow-visible">
          <Wordmark d={WORDMARK_PATH} />
          <WordmarkDot {...WORDMARK_DOT} />
        </svg>
      </Lockup>
    </Stage>
  );
}
