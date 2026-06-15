import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getBankAccounts, getCreditCards } from "@/lib/finance/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = typeof user.user_metadata?.name === "string"
    ? user.user_metadata.name.split(" ")[0]
    : "Investidor";
  const [cards, accounts] = await Promise.all([getCreditCards(), getBankAccounts()]);

  return <DashboardShell name={name} cards={cards} accounts={accounts}>{children}</DashboardShell>;
}
