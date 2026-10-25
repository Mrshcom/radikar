import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "user" as "user" | "admin" | "superadmin",
  logout: vi.fn(),
  notify: vi.fn(),
  put: vi.fn(),
  remove: vi.fn(),
  jobs: [] as Array<{ role: string; company: string; match: number }>,
  adminEvents: [] as Array<{ id: string; type: string; createdAt: string; user: Record<string, string>; details: Record<string, unknown> }>,
  profiles: [
    { id: "profile-default", workspaceName: "فضای کاری شخصی", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  ],
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/app/_components/auth", () => ({
  useAuth: () => ({ user: { id: "u1", role: state.role, fullName: "کاربر آزمایشی", phone: "0912" } }),
  useLogout: () => state.logout,
}));
vi.mock("@/app/_components/toast", () => ({ useToast: () => state.notify }));
vi.mock("@/lib/field-direction", () => ({ useFieldDirectionManager: () => undefined }));
vi.mock("@/lib/admin-stats", () => ({ useAdminEvents: () => ({ data: { items: state.adminEvents } }) }));
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
  jobStore: { list: async () => state.jobs },
  removeWorkspace: state.remove,
}));

import { PanelShell } from "./panel-shell";

function renderShell() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PanelShell>
        <main>محتوای صفحه</main>
      </PanelShell>
    </QueryClientProvider>,
  );
}

describe("PanelShell behavior", () => {
  afterEach(() => {
    vi.clearAllMocks();
    state.role = "user";
    state.jobs = [];
    state.adminEvents = [];
    window.localStorage.clear();
    state.put.mockResolvedValue(undefined);
    state.remove.mockResolvedValue(undefined);
  });

  it("renders user navigation and hides management navigation for a user", async () => {
    renderShell();
    await waitFor(() => expect(screen.getAllByRole("link", { name: /فرصت‌های مناسب من/ })[0]).toBeVisible());
    expect(screen.queryByRole("link", { name: "تنظیمات" })).toBeNull();
    expect(screen.getAllByRole("link", { name: "پیگیری اپلای‌ها" })[0]).toHaveAttribute(
      "data-tour",
      "nav-applications",
    );
    expect(screen.getAllByRole("link", { name: "آمادگی مصاحبه" })[0]).toHaveAttribute("data-tour", "nav-interview");
    expect(within(screen.getByRole("navigation", { name: "منوی اصلی" })).queryByRole("link", { name: "کیف پول رادیکوین" })).toBeNull();
    expect(
      within(screen.getByRole("navigation", { name: "منوی اصلی" })).queryByRole("link", { name: /مشاهدهٔ تغییرات/ }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: /نسخه 0\.1\.0؛ مشاهدهٔ تغییرات/ })).toBeNull();
    fireEvent.click(screen.getByLabelText("منوی حساب کاربری"));
    const accountCenter = screen.getByRole("link", { name: "مرکز حساب" });
    expect(accountCenter).toHaveAttribute("href", "/account-center");
    expect(accountCenter.querySelector("span")?.className).not.toContain("group-hover:shadow");
    expect(screen.getByRole("link", { name: /موجودی رادیکوین/ })).toHaveAttribute("href", "/radicoins");
    expect(screen.queryByRole("link", { name: "سفارش‌ها" })).toBeNull();
    const versionLink = screen.getByRole("link", { name: /نسخه 0\.1\.0؛ مشاهدهٔ تغییرات/ });
    expect(versionLink).toHaveAttribute("href", "/updates");
    expect(versionLink.className).not.toMatch(/\bborder\b|\bbg-\[/);
    expect(versionLink).toHaveClass("text-[#536762]");
    expect(versionLink.querySelector("svg")).toHaveClass("lucide-tag", "text-current");
    versionLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(versionLink);
    expect(screen.queryByRole("link", { name: /نسخه 0\.1\.0؛ مشاهدهٔ تغییرات/ })).toBeNull();
    expect(screen.getByTitle("فضای کاری شخصی").closest("button")?.parentElement).toHaveClass("border-t");
    expect(screen.getByLabelText("منوی حساب کاربری")).toHaveAttribute("data-tour", "account-menu");
  });

  it("renders management navigation for an admin", async () => {
    state.role = "admin";
    renderShell();
    await waitFor(() => expect(screen.getAllByRole("link", { name: "داشبورد مدیریتی" })[0]).toBeVisible());
    expect(screen.queryByRole("link", { name: "کاربران و دسترسی‌ها" })).toBeNull();
    fireEvent.click(screen.getByLabelText("منوی حساب کاربری"));
    expect(screen.queryByRole("link", { name: /نسخه .* مشاهدهٔ تغییرات/ })).toBeNull();
  });

  it("shows a compact clickable job notification with its match", async () => {
    state.jobs = [{ role: "Frontend Engineer", company: "WebstaurantStore", match: 82 }];
    renderShell();
    await waitFor(() => expect(screen.getAllByRole("link", { name: /فرصت‌های مناسب من/ })[0]).toHaveTextContent("۱"));
    fireEvent.click(screen.getByRole("button", { name: "اعلان‌ها" }));
    const jobLink = screen.getByTitle("Frontend Engineer").closest("a");
    expect(jobLink).toHaveAttribute("href", "/jobs");
    expect(jobLink).toHaveTextContent("تطابق ۸۲٪");
    expect(jobLink).toHaveTextContent("WebstaurantStore");
    expect(jobLink).not.toHaveTextContent("مشاهده فرصت‌ها");
  });

  it("persists seen superadmin events after a page refresh", async () => {
    state.role = "superadmin";
    state.adminEvents = [
      {
        id: "admin-event-1",
        type: "signup",
        createdAt: "2026-10-17T12:00:00.000Z",
        user: { id: "new-user", fullName: "کاربر جدید", phone: "09120000000" },
        details: {},
      },
    ];
    const firstRender = renderShell();
    const noticeButton = screen.getByRole("button", { name: "اعلان‌های آماری مدیریت" });
    await waitFor(() => expect(noticeButton).toHaveTextContent("۱"));

    fireEvent.click(noticeButton);
    expect(JSON.parse(window.localStorage.getItem("radikar:admin-events:seen:u1") ?? "[]")).toEqual(["admin-event-1"]);

    firstRender.unmount();
    renderShell();
    await waitFor(() => expect(screen.getByRole("button", { name: "اعلان‌های آماری مدیریت" })).not.toHaveTextContent("۱"));
  });

  it("opens and closes the mobile menu with Escape and restores overflow", () => {
    renderShell();
    fireEvent.click(screen.getByLabelText("بازکردن منوی اصلی"));
    expect(screen.getByLabelText("منوی کامل پنل")).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("opens the search dialog with Ctrl+K", () => {
    renderShell();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("logs out and reports a logout failure", async () => {
    state.logout.mockRejectedValueOnce(new Error("offline"));
    renderShell();
    fireEvent.click(screen.getByLabelText("منوی حساب کاربری"));
    const logoutButton = screen.getByRole("button", { name: "خروج از حساب" });
    expect(logoutButton).toHaveClass("text-[#536762]", "hover:text-[#a13f37]", "hover:bg-[#fff1ef]");
    expect(logoutButton.previousElementSibling).toHaveAttribute("aria-label", "دسترسی‌های حساب");
    expect(logoutButton.querySelector("span")?.className).toContain("bg-[#f2f6f4]");
    expect(logoutButton.querySelector("span")?.className).toContain("group-hover:bg-white");
    fireEvent.click(logoutButton);
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith("خروج از حساب ناموفق بود؛ دوباره تلاش کن.", "error"));
  });

  it("reports workspace creation failure", async () => {
    state.put.mockRejectedValueOnce(new Error("offline"));
    renderShell();
    await waitFor(() => expect(screen.getByTitle("فضای کاری شخصی")).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: /فضای کاری شخصی/ }));
    fireEvent.click(screen.getByRole("button", { name: /افزودن فضای کاری جدید/ }));
    fireEvent.change(screen.getByLabelText("نام فضای کاری"), { target: { value: "تیم" } });
    fireEvent.click(screen.getByRole("button", { name: "ساخت و ورود به فضا" }));
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith("ساخت فضای کاری جدید ناموفق بود.", "error"));
  });

  it("reports workspace rename failure", async () => {
    state.put.mockRejectedValueOnce(new Error("offline"));
    renderShell();
    await waitFor(() => expect(screen.getByTitle("فضای کاری شخصی")).toBeVisible());
    fireEvent.click(screen.getByTitle("فضای کاری شخصی"));
    fireEvent.click(screen.getByLabelText("ویرایش فضای کاری شخصی"));
    fireEvent.change(screen.getByDisplayValue("فضای کاری شخصی"), { target: { value: "تیم" } });
    fireEvent.click(screen.getByRole("button", { name: "ذخیره" }));
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith("ویرایش نام فضای کاری ناموفق بود.", "error"));
  });

  it("requires a second confirmation before deleting a workspace", async () => {
    renderShell();
    await waitFor(() => expect(screen.getByTitle("فضای کاری شخصی")).toBeVisible());
    fireEvent.click(screen.getByTitle("فضای کاری شخصی"));
    fireEvent.click(screen.getByLabelText("حذف فضای کاری شخصی"));
    fireEvent.click(screen.getByRole("button", { name: "بله، حذف شود" }));
    await waitFor(() =>
      expect(state.notify).toHaveBeenCalledWith("برای حذف فضای کاری، دکمه تأیید را یک‌بار دیگر بزن.", "info"),
    );
  });

  it("reports delete failure after the confirmation guard", async () => {
    state.remove.mockRejectedValue(new Error("offline"));
    renderShell();
    await waitFor(() => expect(screen.getByTitle("فضای کاری شخصی")).toBeVisible());
    fireEvent.click(screen.getByTitle("فضای کاری شخصی"));
    fireEvent.click(screen.getByLabelText("حذف فضای کاری شخصی"));
    const confirm = screen.getByRole("button", { name: "بله، حذف شود" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith("حذف فضای کاری ناموفق بود.", "error"));
  });

  it("closes the account menu from Escape", () => {
    renderShell();
    fireEvent.click(screen.getByLabelText("منوی حساب کاربری"));
    expect(screen.getByText("خروج از حساب")).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("خروج از حساب")).toBeNull();
  });
});
