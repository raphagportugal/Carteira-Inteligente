import type { HTMLAttributes } from "react";

type DashboardCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
};

export function DashboardCard({
  as: Component = "article",
  className = "",
  ...props
}: DashboardCardProps) {
  return (
    <Component
      className={`dashboard-card p-5 sm:p-6 ${className}`}
      {...props}
    />
  );
}

