import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JobCard, JobDetailsModal, JobLogo } from "./job-card";

vi.mock("next/image", () => ({ default: (props: any) => <img {...props} /> }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));

const job: any = { id: "job 1", company: "رادیکار", role: "توسعه‌دهنده فرانت‌اند", match: 82, place: "تهران", age: "امروز", letter: "ر", tone: "green", reason: "تطابق خوب", description: "شرح کامل آگهی", sourceUrl: "https://example.test/job" };

describe("job card and details", () => {
  it("falls back to the company letter after a remote logo error", () => {
    render(<JobLogo company="رادیکار" letter="ر" logoUrl="https://cdn.test/logo.png" />);
    fireEvent.error(screen.getByAltText("نشان رادیکار"));
    expect(screen.queryByAltText("نشان رادیکار")).toBeNull();
    expect(screen.getByText("ر")).toBeVisible();
  });

  it("opens and closes details, uses a safe match link, and prevents duplicate saves", () => {
    const save = vi.fn(); const { rerender } = render(<JobCard job={job} onSave={save} />);
    fireEvent.click(screen.getByLabelText("ذخیره فرصت")); expect(save).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /تطبیق مجدد/ })).toHaveAttribute("href", "/match?job=job%201");
    fireEvent.click(screen.getByText("نمایش کامل آگهی"));
    expect(screen.getByRole("dialog", { name: "توسعه‌دهنده فرانت‌اند" })).toBeVisible();
    expect(screen.getByRole("link", { name: /مشاهده منبع آگهی/ })).toHaveAttribute("href", "https://example.test/job");
    fireEvent.keyDown(window, { key: "Escape" }); expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<JobCard job={job} onSave={save} saving />);
    expect(screen.getByLabelText("ذخیره فرصت")).toBeDisabled();
  });

  it("renders missing description safely and delegates modal closing", () => {
    const close = vi.fn(); render(<JobDetailsModal job={{ ...job, description: "", sourceUrl: undefined }} onClose={close} />);
    expect(screen.getByText("متن کامل این آگهی ذخیره نشده است.")).toBeVisible();
    fireEvent.mouseDown(screen.getByRole("presentation")); expect(close).toHaveBeenCalledOnce();
  });
});
