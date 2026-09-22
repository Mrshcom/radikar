import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "user" as "user" | "admin" | "superadmin",
  logout: vi.fn(),
  notify: vi.fn(),
  put: vi.fn(),
  remove: vi.fn(),
  profiles: [{ id: "profile-default", workspaceName: "فضای کاری شخصی", createdAt: "2026-01-01", updatedAt: "2026-01-01" }],
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("next/image", () => ({ default: (props: any) => <img {...props} /> }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/app/_components/auth", () => ({
  useAuth: () => ({ user: { id: "u1", role: state.role, fullName: "کاربر آزمایشی", phone: "0912" } }),
  useLogout: () => state.logout,
}));
vi.mock("@/app/_components/toast", () => ({ useToast: () => state.notify }));
vi.mock("@/lib/field-direction", () => ({ useFieldDirectionManager: () => undefined }));
vi.mock("@/lib/admin-stats", () => ({ useAdminEvents: () => ({ data: { items: [] } }) }));
vi.mock("./model-task-provider", () => ({
  ModelTaskProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useModelTasks: () => ({ tasks: [], openTask: vi.fn(), cancelTask: vi.fn() }),
}));
vi.mock("@/lib/data/stores", () => ({
  appProfileStore: { list: async () => state.profiles, put: state.put, remove: state.remove },
  ensureDefaultAppProfile: async () => state.profiles,
  getActiveProfileId: async () => "profile-default",
  setActiveProfileId: vi.fn(),
  createRecordId: () => "profile-created",
  jobStore: { list: async () => [] },
  removeWorkspace: state.remove,
}));

import { PanelShell } from "./panel-shell";

function renderShell() { return render(<PanelShell><main>محتوای صفحه</main></PanelShell>); }

describe("PanelShell behavior", () => {
  afterEach(() => { vi.clearAllMocks(); state.role = "user"; state.put.mockResolvedValue(undefined); state.remove.mockResolvedValue(undefined); });

  it("renders user navigation and hides management navigation for a user", async () => {
    renderShell();
    await waitFor(() => expect(screen.getAllByRole("link", { name: /فرصت‌های مناسب من/ })[0]).toBeVisible());
    expect(screen.queryByRole("link", { name: "تنظیمات" })).toBeNull();
  });

  it("renders management navigation for an admin", async () => {
    state.role = "admin"; renderShell();
    await waitFor(() => expect(screen.getAllByRole("link", { name: "داشبورد مدیریتی" })[0]).toBeVisible());
    expect(screen.queryByRole("link", { name: "کاربران و دسترسی‌ها" })).toBeNull();
  });

  it("opens and closes the mobile menu with Escape and restores overflow", () => {
    renderShell(); fireEvent.click(screen.getByLabelText("بازکردن منوی اصلی"));
    expect(screen.getByLabelText("منوی کامل پنل")).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("opens the search dialog with Ctrl+K", () => {
    renderShell(); fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("logs out and reports a logout failure", async () => {
    state.logout.mockRejectedValueOnce(new Error("offline")); renderShell();
    fireEvent.click(screen.getByLabelText("منوی حساب کاربری"));
    fireEvent.click(screen.getByText("خروج از حساب"));
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith("خروج از حساب ناموفق بود؛ دوباره تلاش کن.", "error"));
  });

  it("reports workspace creation failure", async () => {
    state.put.mockRejectedValueOnce(new Error("offline")); renderShell();
    await waitFor(() => expect(screen.getByTitle("فضای کاری شخصی")).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: /فضای کاری شخصی/ }));
    fireEvent.click(screen.getByRole("button", { name: /افزودن فضای کاری جدید/ }));
    fireEvent.change(screen.getByLabelText("نام فضای کاری"), { target: { value: "تیم" } });
    fireEvent.click(screen.getByRole("button", { name: "ساخت و ورود به فضا" }));
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith("ساخت فضای کاری جدید ناموفق بود.", "error"));
  });

  it("reports workspace rename failure", async () => {
    state.put.mockRejectedValueOnce(new Error("offline")); renderShell();
    await waitFor(() => expect(screen.getByTitle("فضای کاری شخصی")).toBeVisible());
    fireEvent.click(screen.getByTitle("فضای کاری شخصی"));
    fireEvent.click(screen.getByLabelText("ویرایش فضای کاری شخصی"));
    fireEvent.change(screen.getByDisplayValue("فضای کاری شخصی"), { target: { value: "تیم" } });
    fireEvent.click(screen.getByRole("button", { name: "ذخیره" }));
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith("ویرایش نام فضای کاری ناموفق بود.", "error"));
  });

  it("requires a second confirmation before deleting a workspace", async () => {
    renderShell(); await waitFor(() => expect(screen.getByTitle("فضای کاری شخصی")).toBeVisible());
    fireEvent.click(screen.getByTitle("فضای کاری شخصی")); fireEvent.click(screen.getByLabelText("حذف فضای کاری شخصی"));
    fireEvent.click(screen.getByRole("button", { name: "بله، حذف شود" }));
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith("برای حذف فضای کاری، دکمه تأیید را یک‌بار دیگر بزن.", "info"));
  });

  it("reports delete failure after the confirmation guard", async () => {
    state.remove.mockRejectedValue(new Error("offline")); renderShell();
    await waitFor(() => expect(screen.getByTitle("فضای کاری شخصی")).toBeVisible());
    fireEvent.click(screen.getByTitle("فضای کاری شخصی")); fireEvent.click(screen.getByLabelText("حذف فضای کاری شخصی"));
    const confirm = screen.getByRole("button", { name: "بله، حذف شود" }); fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith("حذف فضای کاری ناموفق بود.", "error"));
  });

  it("closes the account menu from Escape", () => {
    renderShell(); fireEvent.click(screen.getByLabelText("منوی حساب کاربری")); expect(screen.getByText("خروج از حساب")).toBeVisible(); fireEvent.keyDown(document, { key: "Escape" }); expect(screen.queryByText("خروج از حساب")).toBeNull();
  });
});
