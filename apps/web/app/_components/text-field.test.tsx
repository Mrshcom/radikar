import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { LocalizedNumberInput, TextField } from "./text-field";

function NumberForm({ onSubmit }: { onSubmit: (values: { amount: number }) => void }) {
  const { register, handleSubmit } = useForm<{ amount: number }>({ defaultValues: { amount: 0 } });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField aria-label="مقدار" type="number" {...register("amount", { valueAsNumber: true })} />
      <button type="submit">ثبت</button>
    </form>
  );
}

describe("localized numeric fields", () => {
  it("accepts Persian and Arabic digits and submits a real number", async () => {
    const onSubmit = vi.fn();
    render(<NumberForm onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "مقدار" });

    fireEvent.change(input, { target: { value: "۱۲٣" } });
    expect(input).toHaveValue("123");
    fireEvent.click(screen.getByRole("button", { name: "ثبت" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ amount: 123 }, expect.anything()));
  });

  it("keeps a minus sign for fields that allow negative values", () => {
    render(<LocalizedNumberInput aria-label="اعتبار" type="number" />);
    const input = screen.getByRole("textbox", { name: "اعتبار" });

    fireEvent.change(input, { target: { value: "-۵۰" } });
    expect(input).toHaveValue("-50");
  });

  it("normalizes numeric text fields before passing their value to callers", () => {
    const onChange = vi.fn();
    render(<TextField aria-label="سکه" inputMode="numeric" onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "سکه" }), { target: { value: "۴۵" } });
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0].target.value).toBe("45");
  });
});
