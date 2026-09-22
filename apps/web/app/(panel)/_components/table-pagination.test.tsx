import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TablePagination } from "./table-pagination";

describe("TablePagination", () => {
  it("disables the previous control on the first page and changes page with the next control", () => {
    const onPageChange = vi.fn();
    render(
      <TablePagination
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
        page={1}
        pageSize={10}
        total={30}
      />,
    );

    expect(screen.getByLabelText("صفحه قبل")).toBeDisabled();
    fireEvent.click(screen.getByLabelText("صفحه بعد"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("sends the selected page size to its owner", () => {
    const onPageSizeChange = vi.fn();
    render(
      <TablePagination
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
        page={1}
        pageSize={10}
        total={30}
      />,
    );

    fireEvent.change(screen.getByLabelText("تعداد ردیف در هر صفحه"), {
      target: { value: "50" },
    });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
