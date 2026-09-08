import type { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen overflow-x-hidden bg-[#f7f8f3] text-[#19312f]">{children}</div>;
}
