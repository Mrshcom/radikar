import Link from "next/link";
import { Tag } from "lucide-react";
import appPackage from "@/package.json";

const appVersion = appPackage.version;

export function ProductUpdatesNavLink({ active, onClick }: { active: boolean; onClick?: () => void }) {
  return (
    <Link
      href="/updates"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={`نسخه ${appVersion}؛ مشاهدهٔ تغییرات و مسیر رادیکار`}
      data-tour="nav-updates"
      title="مشاهدهٔ تغییرات و مسیر رادیکار"
      className="group inline-flex min-h-8 w-fit items-center justify-center gap-1.5 justify-self-center text-[11px] text-[#536762] no-underline transition-colors hover:text-[#19312f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
    >
      <Tag
        aria-hidden="true"
        size={13}
        strokeWidth={1.8}
        className="text-current"
      />
      <span>نسخه</span>
      <span dir="ltr" className="font-semibold tabular-nums underline-offset-4 group-hover:underline">
        {appVersion}
      </span>
    </Link>
  );
}
