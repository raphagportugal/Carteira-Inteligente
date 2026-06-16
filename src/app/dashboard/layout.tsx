import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getBankAccounts, getCreditCards, getMonthlyBills } from "@/lib/finance/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const fullName = typeof user.user_metadata?.name === "string"
    ? user.user_metadata.name
    : "Investidor";
  const name = fullName.split(" ")[0] || "Investidor";
  const avatar = typeof user.user_metadata?.avatar === "string"
    ? user.user_metadata.avatar
    : "teal";
  const [cards, accounts, monthlyBills] = await Promise.all([
    getCreditCards(),
    getBankAccounts(),
    getMonthlyBills(),
  ]);

  return <DashboardShell name={name} fullName={fullName} avatar={avatar} cards={cards} accounts={accounts} monthlyBills={monthlyBills}>{children}</DashboardShell>;
}
