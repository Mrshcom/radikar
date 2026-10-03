import { cn } from "@/lib/cn";

type RadicoinIconProps = {
  className?: string;
  size?: number;
};

export function RadicoinIcon({ className, size = 32 }: RadicoinIconProps) {
  return (
    <svg
      className={cn("shrink-0 object-contain", className)}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M7.5 15.8V9.5c0-.7.9-1 1.4-.4l3.1 3.7 3.1-3.7c.5-.6 1.4-.3 1.4.4v6.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M12 5.4v1.1M12 17.5v1.1" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
