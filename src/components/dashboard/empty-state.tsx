import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { brand } from "@/config/brand";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="dashboard-card flex flex-col items-center px-6 py-14 text-center">
      <span className="relative grid size-16 place-items-center rounded-3xl bg-moss-50 text-moss-600">
        <Image src={brand.assets.logo} alt="" width={44} height={44} className="h-11 w-11 opacity-95" />
        <Icon className="absolute -bottom-1 -right-1 size-5 rounded-full bg-white p-0.5 text-moss-600 shadow-sm" />
      </span>
      <h2 className="mt-5 font-[var(--font-manrope)] text-xl font-extrabold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
