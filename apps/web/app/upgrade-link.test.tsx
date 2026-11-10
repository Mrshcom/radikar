import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { isPlanUpgradeMessage, UpgradeLink } from "./_components/upgrade-link";

describe("UpgradeLink", () => {
  it("links quota and expired-plan errors to the upgrade page", () => {
    const quota = "سهمیه مصاحبه این پلن تمام شده است؛ برای ادامه پلن را ارتقا دهید.";
    render(<UpgradeLink message={quota} />);
    expect(screen.getByRole("link", { name: /مشاهده و ارتقای پلن/ })).toHaveAttribute("href", "/upgrade");
    expect(isPlanUpgradeMessage("اعتبار پلن فعلی شما به پایان رسیده است.")).toBe(true);
  });

  it("does not add an upgrade link to unrelated errors", () => {
    render(<UpgradeLink message="ارتباط با سرویس برقرار نشد." />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
