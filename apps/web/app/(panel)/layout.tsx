import type { ReactNode } from "react";
import { PanelShell } from "./_components/panel-shell";
import { AuthGate } from "../_components/auth";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <PanelShell>{children}</PanelShell>
    </AuthGate>
  );
}
