import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthGate } from "../_components/auth";
import { Providers } from "../providers";
import { PanelShell } from "../(panel)/_components/panel-shell";

export const metadata: Metadata = {
  title: "پنل کارفرما",
  robots: { index: false, follow: false, nocache: true },
};

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AuthGate>
        <PanelShell>{children}</PanelShell>
      </AuthGate>
    </Providers>
  );
}
