import type { Metadata } from "next";
import { InstallmentsManager } from "@/components/dashboard/installments-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import { getCreditCards, getInstallments } from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Parcelamentos no Cartão" };

export default async function InstallmentsPage() {
  const [installments, cards] = await Promise.all([
    getInstallments(),
    getCreditCards(),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="Compromissos"
        title="Parcelamentos no Cartão"
        description="Acompanhe compras parceladas por cartão, valores restantes e previsão de término."
      />
      <InstallmentsManager installments={installments} cards={cards} />
    </>
  );
}
