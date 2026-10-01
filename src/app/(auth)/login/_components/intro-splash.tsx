"use client";

import { useCallback, useState } from "react";
import { LogoSplash } from "@/components/ui/logo-splash";

/** Logo intro over the already-rendered sign-in screen; it fades away to reveal it. */
export function IntroSplash() {
  const [isVisible, setIsVisible] = useState(true);
  const handleFinish = useCallback(() => setIsVisible(false), []);

  return isVisible ? <LogoSplash onFinish={handleFinish} /> : null;
}
