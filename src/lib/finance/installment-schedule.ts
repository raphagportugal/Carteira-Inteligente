import type { CreditCard, Installment } from "./types";

export type InstallmentScheduleEntry = {
  number: number;
  dueDate: string;
  amount: number;
};

function dateWithSafeDay(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

export function getFirstInstallmentDate(
  purchaseDate: string,
  closingDay: number,
  dueDay: number,
) {
  const purchase = new Date(`${purchaseDate}T00:00:00.000Z`);
  const statementOffset = purchase.getUTCDate() > closingDay ? 1 : 0;
  const dueAfterClosingOffset = dueDay <= closingDay ? 1 : 0;
  const monthOffset = statementOffset + dueAfterClosingOffset;
  return dateWithSafeDay(
    purchase.getUTCFullYear(),
    purchase.getUTCMonth() + monthOffset,
    dueDay,
  );
}

export function buildInstallmentSchedule({
  purchaseDate,
  totalAmount,
  totalInstallments,
  closingDay,
  dueDay,
}: {
  purchaseDate: string;
  totalAmount: number;
  totalInstallments: number;
  closingDay: number;
  dueDay: number;
}) {
  const firstDate = getFirstInstallmentDate(purchaseDate, closingDay, dueDay);
  const baseAmount = Math.floor((totalAmount / totalInstallments) * 100) / 100;
  const entries: InstallmentScheduleEntry[] = [];

  for (let index = 0; index < totalInstallments; index += 1) {
    const dueDate = dateWithSafeDay(
      firstDate.getUTCFullYear(),
      firstDate.getUTCMonth() + index,
      dueDay,
    );
    const amount =
      index === totalInstallments - 1
        ? Math.round((totalAmount - baseAmount * (totalInstallments - 1)) * 100) /
          100
        : baseAmount;
    entries.push({
      number: index + 1,
      dueDate: dueDate.toISOString().slice(0, 10),
      amount,
    });
  }

  return entries;
}

export function getInstallmentSchedule(
  installment: Installment,
  card?: CreditCard,
) {
  if (installment.purchase_date && installment.total_amount && card) {
    return buildInstallmentSchedule({
      purchaseDate: installment.purchase_date,
      totalAmount: Number(installment.total_amount),
      totalInstallments: installment.total_installments,
      closingDay: card.closing_day,
      dueDay: card.due_day,
    });
  }

  const start = new Date(`${installment.start_date}T00:00:00.000Z`);
  return Array.from({ length: installment.total_installments }, (_, index) => {
    const date = dateWithSafeDay(
      start.getUTCFullYear(),
      start.getUTCMonth() + index,
      start.getUTCDate(),
    );
    return {
      number: index + 1,
      dueDate: date.toISOString().slice(0, 10),
      amount: Number(installment.installment_amount),
    };
  });
}

export function getRemainingSchedule(
  schedule: InstallmentScheduleEntry[],
  referenceDate = new Date(),
) {
  const reference = referenceDate.toISOString().slice(0, 10);
  return schedule.filter((entry) => entry.dueDate >= reference);
}
