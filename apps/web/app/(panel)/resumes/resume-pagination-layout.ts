// Keep this synchronized with the 4.535% / 9.525mm block padding in
// `documentClass`. The rendered paginator treats this area as unavailable on
// every page, regardless of the template layout.
export const PAGE_BOTTOM_RESERVE = 36;
const A4_PAGE_HEIGHT_PX = 793.700787 * (297 / 210);

// Decorative layers are deliberately excluded. Only semantic content may
// decide whether a page or one of its columns is full.
const CONTENT_SELECTOR =
  "section,header,h1,h2,h3,p,ul,ol,li,time,strong,img,span";

function getScaledBottomReserve(pageRect: DOMRect) {
  return PAGE_BOTTOM_RESERVE * (pageRect.height / A4_PAGE_HEIGHT_PX);
}

function getPageFlows(page: HTMLElement) {
  const declaredFlows = Array.from(
    page.querySelectorAll<HTMLElement>(":scope [data-resume-flow]"),
  ).filter((flow) => flow.offsetParent !== null);
  if (declaredFlows.length) return declaredFlows;

  const columnFlows = Array.from(
    page.querySelectorAll<HTMLElement>(":scope > main, :scope > aside"),
  ).filter((flow) => flow.offsetParent !== null);

  return columnFlows.length ? columnFlows : [page];
}

function getFlowContentBottom(flow: HTMLElement, pageTop: number) {
  return Array.from(flow.querySelectorAll<HTMLElement>(CONTENT_SELECTOR))
    .filter((element) => element.offsetParent !== null)
    .reduce(
      (bottom, element) =>
        Math.max(bottom, element.getBoundingClientRect().bottom),
      pageTop,
    );
}

/**
 * Measures each visual column independently against the real A4 safe area.
 * This prevents a short main column from being treated as full merely because
 * its sibling sidebar is tall, and applies the same rule to every template.
 */
export function getRenderedPageLayout(page: HTMLElement) {
  const pageRect = page.getBoundingClientRect();
  const safeBottom = pageRect.bottom - getScaledBottomReserve(pageRect);
  const flows = getPageFlows(page).map((flow) => ({
    element: flow,
    contentBottom: getFlowContentBottom(flow, pageRect.top),
  }));
  const overflowingFlows = flows.filter(
    ({ contentBottom }) => contentBottom > safeBottom,
  );

  return {
    fits: overflowingFlows.length === 0,
    flows,
    overflowingFlows,
    pageRect,
    safeBottom,
  };
}
