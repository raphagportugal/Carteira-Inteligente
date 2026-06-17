import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

export function Button({
  children,
  className = "",
  pendingLabel,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex h-12 items-center justify-center rounded-xl bg-moss-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-moss-900 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {pendingLabel ??children}
    </button>
  );
}
