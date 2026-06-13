import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-10 w-10",
        variant === "primary" && "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
        variant === "secondary" && "border bg-[var(--card)] hover:bg-[var(--muted)]",
        variant === "ghost" && "hover:bg-[var(--muted)]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}
