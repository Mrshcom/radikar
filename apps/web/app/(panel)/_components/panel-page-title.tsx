export function PanelPageTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <h1 className="m-0 text-[30px] font-black leading-[1.4] tracking-[-1px] text-[#19312f]">{title}</h1>
      <p className="m-0 mt-1 text-[12px] leading-7 text-[#758582]">{description}</p>
    </header>
  );
}
