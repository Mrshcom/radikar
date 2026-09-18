import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "../providers";

export const metadata: Metadata = {
  title: "ورود به حساب کاربری",
  robots: { index: false, follow: false, nocache: true },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
