import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function isPlanUpgradeMessage(message: string) {
  return (
    /پلن.*ارتقا|ارتقا.*پلن/.test(message) ||
    /اعتبار پلن.*پایان رسیده/.test(message)
  );
}

export function UpgradeLink({ message, className }: { message: string; className?: string }) {
  if (!isPlanUpgradeMessage(message)) return null;

  return (
    <Link
      className={cn(
        "inline-flex w-fit items-center gap-1 font-bold text-[#0f7b62] underline underline-offset-4 hover:text-[#0b6652] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]",
        className,
      )}
      href="/upgrade"
    >
      مشاهده و ارتقای پلن <ArrowLeft aria-hidden="true" size={15} />
    </Link>
  );
}
