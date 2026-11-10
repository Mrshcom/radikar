import type { InterviewDepth } from "@radikar/shared-types";
import { ArrowLeft, Clock3, Layers3, ScanSearch } from "lucide-react";

const options: Array<{
  id: InterviewDepth;
  title: string;
  description: string;
  icon: typeof Clock3;
}> = [
  { id: "quick", title: "سریع", description: "۸ دقیقه پاسخ‌گویی · مرور مهارت‌های اصلی", icon: Clock3 },
  { id: "standard", title: "استاندارد", description: "۱۵ دقیقه پاسخ‌گویی · تجربه‌ها و تصمیم‌ها", icon: Layers3 },
  { id: "deep", title: "عمیق", description: "۲۵ دقیقه پاسخ‌گویی · مثال‌ها، چرایی و نتیجه‌ها", icon: ScanSearch },
];

export function interviewDepthLabel(depth?: InterviewDepth) {
  return options.find((option) => option.id === depth)?.title;
}

export function InterviewDepthChooser({ onSelect }: { onSelect: (depth: InterviewDepth) => void }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center gap-8 py-8">
      <div className="text-center">
        <h2 className="m-0 text-2xl font-bold text-[#19312f]">چه نوع مصاحبه‌ای می‌خواهی؟</h2>
        <p className="mb-0 mt-3 text-sm leading-7 text-[#61746f]">
          یکی از سه مدت پاسخ‌گویی را انتخاب کن؛ گفت‌وگو تا جمع‌بندی ادامه دارد و زمان فکرکردن مصاحبه‌گر از زمان تو کم نمی‌شود.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {options.map(({ id, title, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="group flex min-h-56 flex-col items-start rounded-3xl border border-[#dce9df] bg-white p-6 text-right shadow-[0_12px_36px_rgba(27,55,50,.055)] transition-colors hover:border-[#87c9a9] hover:bg-[#f7fcf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e6f4ee] text-[#0f7b62]">
                <Icon aria-hidden="true" size={23} />
              </span>
              <strong className="text-lg text-[#19312f]">{title}</strong>
            </span>
            <span className="mt-4 text-sm leading-7 text-[#61746f]">{description}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-[#0f7b62]">
              انتخاب {title} <ArrowLeft aria-hidden="true" size={17} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
