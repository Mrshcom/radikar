import { afterEach, describe, expect, it, vi } from "vitest";
import { getFieldDirection, applyFieldDirection, scheduleFieldDirectionRefresh, useFieldDirectionManager } from "@/lib/field-direction";
import { renderHook } from "@testing-library/react";
import { prioritizeSavedJobs } from "@/lib/job-order";
import { hasJobActivityInDateRange } from "@/lib/job-application-filter";
import { normalizeResumeDataInput } from "@/lib/resume-input";
import { sanitizeLtrField } from "@/lib/ltr-field";
import { toPersianServiceErrorMessage } from "@/lib/service-error-message";
import { apiUrl } from "@/lib/api-url";
import { readProfileImage } from "@/lib/image-file";
describe("remaining critical utilities", () => {
  afterEach(() => { document.body.innerHTML = ""; vi.restoreAllMocks(); });
  it("handles direction, ordering, date filters and safe text", () => {
    const field = document.createElement("input"); field.value = "سلام"; expect(getFieldDirection(field)).toBe("rtl"); applyFieldDirection(field); expect(field.dir).toBe("rtl"); field.type = "email"; expect(getFieldDirection(field)).toBe("ltr");
    expect(prioritizeSavedJobs([{ saved: false, id: 1 }, { saved: true, id: 2 }]).map((item) => item.id)).toEqual([2, 1]);
    expect(hasJobActivityInDateRange({ role: "Dev", company: "R" }, [{ role: "Dev", company: "R", appliedAt: "2026-01-10" }], "2026-01-01", "2026-01-31")).toBe(true);
    expect(sanitizeLtrField("سلام abc")).toBe(" abc"); expect(toPersianServiceErrorMessage("خطا")).toBe("خطا"); expect(apiUrl("/api/x")).toContain("/api/x");
  });
  it("normalizes resumes and rejects unsafe images", async () => {
    expect(normalizeResumeDataInput({ fullName: "A" }).fullName).toBe("A");
    await expect(readProfileImage(new File(["x"], "x.txt", { type: "text/plain" }))).rejects.toThrow("تصویر");
  });

  it("reads images through FileReader and applies directions to future DOM nodes", async () => {
    class Reader { result = "data:image/png;base64,ok"; onload: any; onerror: any; readAsDataURL() { this.onload?.(); } }
    vi.stubGlobal("FileReader", Reader);
    await expect(readProfileImage(new File(["png"], "photo.png", { type: "image/png" }))).resolves.toBe("data:image/png;base64,ok");
    const animation = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { callback(0); return 1; });
    const input = document.createElement("input"); input.value = "test@example.com"; document.body.append(input);
    scheduleFieldDirectionRefresh(); expect(animation).toHaveBeenCalled(); expect(input.dir).toBe("ltr");
    const hook = renderHook(() => useFieldDirectionManager());
    const added = document.createElement("textarea"); added.value = "سلام"; document.body.append(added);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(added.dir).toBe("rtl"); hook.unmount();
  });

  it("propagates FileReader failures", async () => {
    class Reader { onload: any; onerror: any; readAsDataURL() { this.onerror?.(); } }
    vi.stubGlobal("FileReader", Reader);
    await expect(readProfileImage(new File(["png"], "photo.png", { type: "image/png" }))).rejects.toThrow("خواندن تصویر ناموفق");
  });
});
