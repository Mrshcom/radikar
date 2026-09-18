import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PanelShell } from "./_components/panel-shell";
import { AuthGate } from "../_components/auth";
import { Providers } from "../providers";

export const metadata: Metadata = {
  title: "پنل کاربری",
  robots: { index: false, follow: false, nocache: true },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AuthGate>
        <PanelShell>{children}</PanelShell>
      </AuthGate>
    </Providers>
  );
}
