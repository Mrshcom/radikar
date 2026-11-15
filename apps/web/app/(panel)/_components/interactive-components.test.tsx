import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JalaliDatePicker } from "./jalali-date-picker";
import { TimePicker } from "./time-picker";
import { RangeSlider } from "@/app/_components/range-slider";
import { TableFilterSelect, TableToolbar } from "./table-controls";
import { TableActionButton } from "./table-action-button";
import { MembershipSummary } from "./membership-summary";
import { FormField } from "./form-field";
import { TextField } from "@/app/_components/text-field";

describe("interactive panel controls", () => {
  it("marks required fields and exposes their inline validation state", () => {
    render(
      <FormField label="نام" required error="این فیلد الزامی است.">
        <TextField aria-invalid />
      </FormField>,
    );
    expect(screen.getByText("*")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("این فیلد الزامی است.");
    expect(screen.getByRole("alert")).toHaveClass("text-[11px]");
    expect(screen.getByRole("textbox")).toHaveClass("aria-[invalid=true]:border-[#c44d4d]");
  });
  it("opens, selects and clears Jalali dates", () => {
    const change = vi.fn();
    render(<JalaliDatePicker value="2026-03-21" onChange={change} ariaLabel="تاریخ" />);
    const dateTrigger = screen.getByLabelText("تاریخ");
    expect(dateTrigger.querySelector("span")).toHaveClass("text-left", "[direction:ltr]");
    fireEvent.click(screen.getByLabelText("تاریخ"));
    const calendar = screen.getByRole("dialog");
    expect(calendar).toBeVisible();
    expect(screen.getByLabelText("تاریخ")).toHaveClass("border-[#0f7b62]", "ring-4", "ring-[#0f7b62]/10");
    expect(calendar).toHaveClass("fixed", "z-100");
    expect(screen.getByLabelText("تاریخ").parentElement).not.toContainElement(calendar);
    fireEvent.click(screen.getByLabelText("پاک‌کردن تاریخ"));
    expect(change).toHaveBeenCalledWith("");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("shows and marks today in the Jalali calendar dialog", () => {
    render(<JalaliDatePicker value="" onChange={vi.fn()} ariaLabel="تاریخ" />);

    fireEvent.click(screen.getByLabelText("تاریخ"));

    expect(screen.getByText(/^امروز:/)).toBeVisible();
    const today = screen.getByRole("button", { name: /^امروز،/ });
    expect(today).toHaveAttribute("data-today", "true");
    expect(today).toHaveClass("bg-[#e8f5ef]", "ring-1", "ring-[#0f7b62]");
  });
  it("uses a Persian themed custom time picker instead of the browser time control", () => {
    const change = vi.fn();
    render(<TimePicker value="23:59" onChange={change} ariaLabel="ساعت مهلت" />);

    expect(screen.queryByDisplayValue("23:59")).toBeNull();
    expect(screen.getByLabelText("ساعت مهلت")).toHaveTextContent("۲۳:۵۹");
    expect(screen.getByLabelText("ساعت مهلت").querySelector("span")).toHaveClass("text-left", "[direction:ltr]");
    fireEvent.click(screen.getByLabelText("ساعت مهلت"));
    expect(screen.getByRole("dialog", { name: "انتخاب ساعت ساعت مهلت" })).toBeVisible();
    expect(screen.getByRole("region", { name: "دقیقه" }).compareDocumentPosition(screen.getByRole("region", { name: "ساعت" }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    fireEvent.click(screen.getByRole("button", { name: "۵۸" }));
    fireEvent.click(screen.getByRole("button", { name: /تأیید ساعت/ }));
    expect(change).toHaveBeenCalledWith("23:58");
  });
  it("clamps slider and supports toolbar/filter actions", () => {
    const change = vi.fn();
    render(
      <>
        <RangeSlider label="امتیاز" value={10} min={0} max={10} onChange={change} />
        <TableToolbar search="x" activeFilterCount={1} onSearch={change} onResetFilters={change}>
          <span>فیلتر</span>
        </TableToolbar>
        <TableFilterSelect
          label="وضعیت"
          value="a"
          onChange={change}
          options={[
            { value: "a", label: "الف" },
            { value: "b", label: "ب" },
          ]}
        />
      </>,
    );
    expect(screen.getByLabelText("افزایش امتیاز")).toBeDisabled();
    fireEvent.click(screen.getByLabelText("کاهش امتیاز"));
    expect(change).toHaveBeenCalledWith(9);
    fireEvent.click(screen.getByText("فیلتر پیشرفته"));
    expect(screen.getByText("فیلتر")).toBeVisible();
    fireEvent.click(screen.getByText("پاک‌کردن"));
    expect(change).toHaveBeenCalledWith("");
    fireEvent.click(screen.getByLabelText("وضعیت"));
    fireEvent.click(screen.getByRole("option", { name: "ب" }));
    expect(change).toHaveBeenCalledWith("b");
  });
  it("keeps icon-only table actions accessible and disables the filter trigger when absent", () => {
    render(
      <>
        <TableToolbar search="" onSearch={vi.fn()} onResetFilters={vi.fn()} />
        <TableActionButton label="ویرایش کاربر">
          <span>ویرایش</span>
        </TableActionButton>
      </>,
    );
    expect(screen.queryByText("فیلتر پیشرفته")).toBeNull();
    expect(screen.getByRole("button", { name: "ویرایش کاربر" })).toHaveAttribute("title", "ویرایش کاربر");
  });
  it("renders finite, exhausted and unlimited membership states", () => {
    const usage: any = {
      resume: { used: 1, remaining: 0, total: 1 },
      pdf: { used: 1, remaining: null, total: null },
      ai: { used: 0, remaining: 2, total: 2 },
      match: { used: 0, remaining: 1, total: 1 },
      interview: { used: 0, remaining: 1, total: 1 },
    };
    render(
      <MembershipSummary
        showUpgradeAction
        membership={{ status: "active", expiresAt: "2030-01-01", plan: { name: "حرفه‌ای" }, usage } as any}
      />,
    );
    expect(screen.getByText("تمام شده")).toBeVisible();
    expect(screen.getByText("نامحدود")).toBeVisible();
    expect(screen.getByRole("link", { name: /خرید یا ارتقای بسته/ })).toHaveAttribute("href", "/upgrade");
  });
  it("renders employer hiring activity instead of candidate usage", () => {
    render(
      <MembershipSummary
        accountType="employer"
        employerStats={{
          positions: 2,
          activePositions: 2,
          hiredPositions: 1,
          candidates: 18,
          screenedCandidates: 12,
          interviewInvitations: 4,
          radicoinBalance: 350,
        }}
        membership={
          {
            status: "active",
            expiresAt: "2030-01-01",
            plan: { name: "جذب حرفه‌ای", features: ["ورود گروهی رزومه‌ها", "دعوت مستقیم به مصاحبه"] },
          } as any
        }
        showUpgradeAction
      />,
    );
    expect(screen.getByText("پوزیشن‌های فعال")).toBeVisible();
    expect(screen.getByText("رزومه‌های واردشده")).toBeVisible();
    expect(screen.queryByText("موجودی رادیکوین")).toBeNull();
    expect(screen.queryByText("دعوت مستقیم به مصاحبه")).toBeNull();
    expect(screen.queryByText("ساخت رزومه")).toBeNull();
    expect(screen.queryByText("دانلود PDF")).toBeNull();
    expect(screen.queryByText("تطبیق شغلی")).toBeNull();
    expect(screen.getByRole("link", { name: /خرید یا ارتقای بسته/ })).toHaveAttribute("href", "/upgrade");
  });
});
