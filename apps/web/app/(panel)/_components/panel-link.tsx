"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type PanelLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
  href: string;
  children: ReactNode;
  external?: boolean;
};

export function PanelLink({ href, children, className = "", external, ...props }: PanelLinkProps) {
  const isExternal = external ?? /^https?:\/\//i.test(href);
  const classes = `group inline-flex items-center gap-1.5 no-underline transition-colors hover:text-[#0f7b62] ${className}`;
  const content = <><ExternalLink aria-hidden="true" className="shrink-0 opacity-70 transition-opacity group-hover:opacity-100" size={13} strokeWidth={2} /> <span>{children}</span></>;
  if (isExternal) return <a className={classes} href={href} target={props.target ?? "_blank"} rel={props.rel ?? "noreferrer"} {...props}>{content}</a>;
  return <Link className={classes} href={href} {...props}>{content}</Link>;
}
