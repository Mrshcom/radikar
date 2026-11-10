import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  notify: vi.fn(),
  user: { role: "user", accountType: "candidate" },
}));

vi.mock("@/lib/api-client", () => ({ apiRequest: mocks.apiRequest }));
vi.mock("@/app/_components/toast", () => ({ useToast: () => mocks.notify }));
vi.mock("@/app/_components/auth", () => ({ useAuth: () => ({ user: mocks.user }) }));

import { SupportWorkspace } from "./support-workspace";

function renderWorkspace(mode: "candidate" | "admin") {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SupportWorkspace mode={mode} />
    </QueryClientProvider>,
  );
}

describe("SupportWorkspace form controls", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mocks.user.role = "user";
    mocks.user.accountType = "candidate";
  });

  it("uses the shared dropdown and form controls when creating a ticket", async () => {
    mocks.apiRequest.mockResolvedValue({ tickets: [] });
    renderWorkspace("candidate");
    fireEvent.click(screen.getByRole("button", { name: /تیکت جدید/ }));

    expect(document.querySelector("select")).toBeNull();
    expect(screen.getByRole("textbox", { name: /موضوع درخواست/ })).toHaveClass("focus:ring-4");
    expect(screen.getByRole("textbox", { name: /شرح درخواست/ })).toHaveClass("focus:ring-4");
    fireEvent.click(screen.getByRole("button", { name: "دسته‌بندی تیکت" }));
    fireEvent.click(screen.getByRole("option", { name: "حساب کاربری" }));
    expect(screen.getByRole("button", { name: "دسته‌بندی تیکت" })).toHaveTextContent("حساب کاربری");
  });

  it("uses shared dropdowns for superadmin ticket filters", async () => {
    mocks.user.role = "superadmin";
    mocks.apiRequest.mockResolvedValue({ tickets: [], total: 0 });
    renderWorkspace("admin");

    await waitFor(() => expect(screen.getByText("هنوز تیکتی در این فهرست نیست.")).toBeVisible());
    expect(document.querySelector("select")).toBeNull();
    fireEvent.click(screen.getByLabelText("وضعیت"));
    fireEvent.click(screen.getByRole("option", { name: "بسته‌شده" }));
    await waitFor(() => expect(mocks.apiRequest).toHaveBeenCalledWith(expect.stringContaining("status=closed")));
  });
});
