import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DataTable, DataTableEmptyState, DataTableErrorState } from "./data-table";

describe("حالت‌های مشترک جدول داده", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
  });

  it("پیام مناسب حالت بدون داده و فیلترشده را نمایش می‌دهد", () => {
    const { rerender } = render(<DataTableEmptyState />);
    expect(screen.getByText("هنوز اطلاعاتی ثبت نشده است")).toBeInTheDocument();

    rerender(<DataTableEmptyState filtered />);
    expect(screen.getByText("نتیجه‌ای با این فیلترها پیدا نشد")).toBeInTheDocument();
  });

  it("خطای جدول را قابل مشاهده و قابل تلاش مجدد می‌کند", () => {
    let retries = 0;
    render(
      <DataTableErrorState
        error={new Error("خطای سرویس")}
        onRetry={() => { retries += 1; }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("خطای سرویس");
    screen.getByRole("button", { name: "تلاش مجدد" }).click();
    expect(retries).toBe(1);
  });

  it("وقتی API خطا دارد، جدول به‌جای رندر ردیف‌ها همان حالت خطا را استفاده می‌کند", () => {
    render(
      <DataTable
        columns={[{ key: "name", title: "نام", render: (row: { name: string }) => row.name }]}
        rows={[{ name: "نباید دیده شود" }]}
        getRowKey={(row) => row.name}
        error={new Error("خطای خواندن")}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("خطای خواندن");
    expect(screen.queryByText("نباید دیده شود")).not.toBeInTheDocument();
  });
});
