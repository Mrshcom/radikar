import type { ComponentType } from "react";

type PageTitleIcon = ComponentType<{ className?: string; size?: number }>;

export function PanelPageTitle({
  title,
  icon: Icon,
  description,
}: {
  title: string;
  icon: PageTitleIcon;
  description?: string;
}) {
  return (
    <header>
      <h1 className="mb-0 flex items-center gap-2 text-[26px] font-black text-[#19312f]">
        <Icon size={22} />
        {title}
      </h1>
      {description && <p className="mb-0 mt-2 text-[10px] leading-6 text-[#788783]">{description}</p>}
    </header>
  );
}
