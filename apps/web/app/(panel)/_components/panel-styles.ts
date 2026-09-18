/** Shared visual tokens for panel pages. Keep page-specific layout classes local. */
export const panelSurface =
  "rounded-[17px] border border-[#e7ebe6] bg-white shadow-[0_12px_36px_rgba(27,55,50,.055)]";
export const panelSurfacePadded = `${panelSurface} p-[22px]`;
export const primaryAction =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0f7b62] px-[15px] text-[11px] font-bold whitespace-nowrap text-white shadow-[0_7px_17px_rgba(15,123,98,.17)] transition-colors duration-200 hover:bg-[#0b6954] disabled:cursor-not-allowed disabled:opacity-45";
export const secondaryAction =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#dfe5df] bg-white px-[15px] text-[10px] font-bold text-[#526461] transition-colors duration-200 hover:bg-[#f3f7f4]";
export const emptyState =
  "grid min-h-[220px] place-items-center gap-3 rounded-[17px] border border-dashed border-[#d9e2dd] bg-white p-10 text-center text-[#758582] [&_h3]:m-0 [&_h3]:text-[15px] [&_h3]:text-[#19312f] [&_p]:m-0 [&_p]:text-[11px]";
export const scoreWidthClass = (value: number) => {
  if (value < 20) return "w-1/5";
  if (value < 40) return "w-2/5";
  if (value < 60) return "w-3/5";
  if (value < 80) return "w-4/5";
  return "w-full";
};
