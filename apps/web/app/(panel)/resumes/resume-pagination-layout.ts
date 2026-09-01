// Keep these synchronized with the 4.535% / 9.525mm block padding in
// `documentClass`. The rendered paginator treats both areas as unavailable on
// every page, regardless of the template layout.
export const PAGE_TOP_RESERVE = 36;
export const PAGE_BOTTOM_RESERVE = 36;
const A4_PAGE_HEIGHT_PX = 793.700787 * (297 / 210);
const PAGE_EDGE_TOLERANCE = 0.5;

// Decorative layers are deliberately excluded. Only semantic content may
// decide whether a page or one of its columns is full.
const CONTENT_SELECTOR =
  "section,header,h1,h2,h3,p,ul,ol,li,time,strong,img,span";

function getScaledReserve(reserve: number, pageRect: DOMRect) {
  return reserve * (pageRect.height / A4_PAGE_HEIGHT_PX);
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

function getFlowContentBounds(flow: HTMLElement, pageRect: DOMRect) {
  const elements = Array.from(
    flow.querySelectorAll<HTMLElement>(CONTENT_SELECTOR),
  ).filter((element) => element.offsetParent !== null);
  if (!elements.length) {
    return {
      hasContent: false,
      contentTop: pageRect.top,
      contentBottom: pageRect.top,
    };
  }
  return elements.reduce(
    (bounds, element) => {
      const rect = element.getBoundingClientRect();
      return {
        hasContent: true,
        contentTop: Math.min(bounds.contentTop, rect.top),
        contentBottom: Math.max(bounds.contentBottom, rect.bottom),
      };
    },
    {
      hasContent: true,
      contentTop: Number.POSITIVE_INFINITY,
      contentBottom: Number.NEGATIVE_INFINITY,
    },
  );
}

/**
 * Measures each visual column independently against the real A4 safe area.
 * This prevents a short main column from being treated as full merely because
 * its sibling sidebar is tall, and applies the same rule to every template.
 */
export function getRenderedPageLayout(page: HTMLElement) {
  const pageRect = page.getBoundingClientRect();
  const safeTop =
    pageRect.top + getScaledReserve(PAGE_TOP_RESERVE, pageRect);
  const safeBottom =
    pageRect.bottom - getScaledReserve(PAGE_BOTTOM_RESERVE, pageRect);
  const flows = getPageFlows(page).map((flow) => {
    const bounds = getFlowContentBounds(flow, pageRect);
    const fits =
      !bounds.hasContent ||
      (bounds.contentTop >= safeTop - PAGE_EDGE_TOLERANCE &&
        bounds.contentBottom <= safeBottom + PAGE_EDGE_TOLERANCE);
    return { element: flow, ...bounds, fits };
  });
  const overflowingFlows = flows.filter(({ fits }) => !fits);

  return {
    fits: overflowingFlows.length === 0,
    flows,
    overflowingFlows,
    pageRect,
    safeTop,
    safeBottom,
  };
}
