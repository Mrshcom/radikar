"use client";

import { useEffect } from "react";

const PERSIAN_SCRIPT_PATTERN = /\p{Script=Arabic}/u;
const NUMERIC_CONTENT_PATTERN = /^[\s0-9۰-۹٠-٩+().,،٫٬/%٪:\-–—/]+$/u;
const ALWAYS_LTR_INPUT_TYPES = new Set(["tel", "number", "date", "datetime-local", "month", "time", "week"]);
const IGNORED_INPUT_TYPES = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"]);

type DirectionalField = HTMLInputElement | HTMLTextAreaElement;

function isDirectionalField(element: Element): element is DirectionalField {
  if (element instanceof HTMLTextAreaElement) return true;
  return element instanceof HTMLInputElement && !IGNORED_INPUT_TYPES.has(element.type);
}

function shouldAlwaysUseLtr(field: DirectionalField) {
  if (field instanceof HTMLTextAreaElement) return false;
  return ALWAYS_LTR_INPUT_TYPES.has(field.type)
    || ["decimal", "numeric", "tel"].includes(field.inputMode);
}

export function getFieldDirection(field: DirectionalField): "rtl" | "ltr" {
  if (shouldAlwaysUseLtr(field)) return "ltr";
  if (!field.value.trim()) return "rtl";
  if (field.value.trim() && NUMERIC_CONTENT_PATTERN.test(field.value)) return "ltr";
  return PERSIAN_SCRIPT_PATTERN.test(field.value) ? "rtl" : "ltr";
}

export function applyFieldDirection(field: DirectionalField) {
  const direction = getFieldDirection(field);
  field.dir = direction;
  field.style.textAlign = direction === "rtl" ? "right" : "left";
}

function applyWithin(root: ParentNode) {
  if (root instanceof Element && isDirectionalField(root)) applyFieldDirection(root);
  root.querySelectorAll("input, textarea").forEach((element) => {
    if (isDirectionalField(element)) applyFieldDirection(element);
  });
}

export function refreshFieldDirections() {
  if (typeof document === "undefined") return;
  applyWithin(document);
}

export function scheduleFieldDirectionRefresh() {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(refreshFieldDirections);
}

export function useFieldDirectionManager() {
  useEffect(() => {
    const updateFromEvent = (event: Event) => {
      if (event.target instanceof Element && isDirectionalField(event.target)) {
        applyFieldDirection(event.target);
      }
    };
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) applyWithin(node);
      }));
    });

    refreshFieldDirections();
    document.addEventListener("input", updateFromEvent, true);
    document.addEventListener("change", updateFromEvent, true);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("input", updateFromEvent, true);
      document.removeEventListener("change", updateFromEvent, true);
      observer.disconnect();
    };
  }, []);
}
