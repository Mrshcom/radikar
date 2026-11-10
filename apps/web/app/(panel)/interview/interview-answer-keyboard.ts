import type { KeyboardEvent } from "react";

export function submitInterviewAnswerOnEnter(event: KeyboardEvent<HTMLTextAreaElement>, busy: boolean) {
  if (
    event.key !== "Enter" ||
    event.shiftKey ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.nativeEvent.isComposing ||
    event.nativeEvent.keyCode === 229
  )
    return;

  event.preventDefault();
  if (!busy) event.currentTarget.form?.requestSubmit();
}
