export type GtmEventProperties = Record<string, boolean | number | string | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function hasGoogleTagManager() {
  return /^GTM-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "");
}

export function trackGtmEvent(event: string, properties: GtmEventProperties = {}) {
  if (typeof window === "undefined" || !hasGoogleTagManager()) return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...properties });
}
