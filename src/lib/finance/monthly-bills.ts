import type { CreditCard, MonthlyBill, Transaction } from "./types";
import { calculateCreditCardCashFlowDate } from "./transaction-cash-flow";

export type MonthlyBillOccurrenceStatus =
  | "not_started"
  | "paid"
  | "overdue"
  | "pending"
  | "future"
  | "inactive";

function dateWithSafeDay(month: string, day: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  return `${month}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export function getMonthlyBillOccurrence({
  bill,
  month,
  cardsById,
  transactions,
  today = new Date().toISOString().slice(0, 10),
}: {
  bill: MonthlyBill;
  month: string;
  cardsById: Map<string, CreditCard>;
  transactions: Transaction[];
  today?: string;
}) {
  const dueDate = dateWithSafeDay(month, bill.due_day);
  const startMonth = bill.start_date.slice(0, 7);
  const endMonth = bill.end_date?.slice(0, 7);
  const linkedTransaction = transactions.find(
    (transaction) =>
      transaction.monthly_bill_id === bill.id &&
      transaction.transaction_date.slice(0, 7) === month,
  );

  if (month < startMonth) {
    return { dueDate, cashFlowDate: dueDate, status: "not_started" as const, linkedTransaction };
  }

  if (bill.status !== "active" || (endMonth && month > endMonth)) {
    return { dueDate, cashFlowDate: dueDate, status: "inactive" as const, linkedTransaction };
  }

  const card = bill.credit_card_id ? cardsById.get(bill.credit_card_id) : undefined;
  const cashFlowDate = card
    ? calculateCreditCardCashFlowDate(dueDate, card)
    : dueDate;

  if (linkedTransaction) {
    return { dueDate, cashFlowDate, status: "paid" as const, linkedTransaction };
  }

  if (dueDate < today) {
    return { dueDate, cashFlowDate, status: "overdue" as const, linkedTransaction };
  }

  return {
    dueDate,
    cashFlowDate,
    status: month > today.slice(0, 7) ? "future" as const : "pending" as const,
    linkedTransaction,
  };
}

export function projectedMonthlyBillAmountInRange({
  bills,
  cardsById,
  transactions,
  start,
  end,
}: {
  bills: MonthlyBill[];
  cardsById: Map<string, CreditCard>;
  transactions: Transaction[];
  start: string;
  end: string;
}) {
  const months = new Set<string>();
  const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00.000Z`);
  cursor.setUTCMonth(cursor.getUTCMonth() - 2);
  const last = new Date(`${end.slice(0, 7)}-01T00:00:00.000Z`);
  while (cursor <= last) {
    months.add(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return bills.reduce((sum, bill) => {
    return sum + Array.from(months).reduce((billSum, month) => {
      const occurrence = getMonthlyBillOccurrence({
        bill,
        month,
        cardsById,
        transactions,
      });
      if (
        occurrence.linkedTransaction ||
        occurrence.status === "not_started" ||
        occurrence.status === "inactive" ||
        occurrence.cashFlowDate < start ||
        occurrence.cashFlowDate > end
      ) {
        return billSum;
      }
      return billSum + Number(bill.monthly_amount);
    }, 0);
  }, 0);
}
