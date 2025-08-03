"use client";

import { ThirdwebProvider } from "thirdweb/react";
import ErrorBoundary from "@/components/app/ErrorBoundary";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ThirdwebProvider>
  );
}