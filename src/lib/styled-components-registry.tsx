"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

/** Collects styled-components CSS during server rendering (Next.js CSS-in-JS guide). */
export function StyledComponentsRegistry({ children }: { children: ReactNode }) {
  const [styleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styleSheet.getStyleElement();
    styleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") return <>{children}</>;

  return <StyleSheetManager sheet={styleSheet.instance}>{children}</StyleSheetManager>;
}
