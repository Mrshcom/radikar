import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { getServerAuthUser } from "@/lib/server-auth";

export default async function LoginLayout({ children }: { children: ReactNode }) {
  const user = await getServerAuthUser();

  if (user) {
    redirect(user.role === "user" ? "/dashboard" : "/admin");
  }

  return <Providers>{children}</Providers>;
}
