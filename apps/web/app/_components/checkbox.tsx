import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ className, ...props }, ref) {
  return (
    <span className={cn("relative inline-flex size-5 shrink-0", className)}>
      <input
        {...props}
        ref={ref}
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0"
        type="checkbox"
      />
      <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-[6px] border-2 border-[#b9c9c2] bg-white text-white transition-[background-color,border-color,transform,box-shadow] duration-150 peer-hover:border-[#74b49d] peer-checked:border-[#0f7b62] peer-checked:bg-[#0f7b62] peer-checked:shadow-[0_3px_8px_rgba(15,123,98,.2)] peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-4 peer-focus-visible:ring-[#0f7b62]/15 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
        <Check className="size-3.5 scale-50 opacity-0 transition-[opacity,transform] duration-150" strokeWidth={3} />
      </span>
    </span>
  );
});

Checkbox.displayName = "Checkbox";
