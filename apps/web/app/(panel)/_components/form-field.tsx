import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FormFieldProps = {
  label: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, required = false, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("grid gap-2 text-[10px] font-bold text-[#536562]", className)}>
      <span className="flex items-center gap-1">
        {label}
        {required && (
          <span aria-hidden="true" className="text-[#c44d4d]">
            *
          </span>
        )}
      </span>
      {children}
      {hint && <small className="font-normal text-[#899793]">{hint}</small>}
      {error && (
        <small className="font-normal text-[#c44d4d]" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
