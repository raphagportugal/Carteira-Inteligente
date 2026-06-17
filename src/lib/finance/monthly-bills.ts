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

function addMonthsToDate(date: string, monthsToAdd: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + monthsToAdd, 1));
  const targetMonth = next.toISOString().slice(0, 7);
  return dateWithSafeDay(targetMonth, day);
}

function monthsBetween(startMonth: string, month: string) {
  const [startYear, startMonthIndex] = startMonth.split("-").map(Number);
  const [year, monthIndex] = month.split("-").map(Number);
  return (year - startYear) * 12 + (monthIndex - startMonthIndex);
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
  const startMonth = bill.start_date.slice(0, 7);
  const endMonth = bill.end_date?.slice(0, 7);
  const occurrenceOffset = monthsBetween(startMonth, month);
  const occurrenceDate =
    occurrenceOffset > 0 ?addMonthsToDate(bill.start_date, occurrenceOffset) : bill.start_date;
  const linkedTransaction = transactions.find(
    (transaction) =>
      transaction.monthly_bill_id === bill.id &&
      transaction.transaction_date.slice(0, 7) === month,
  );

  if (month < startMonth) {
    return { dueDate: occurrenceDate, cashFlowDate: occurrenceDate, status: "not_started" as const, linkedTransaction };
  }

  if (bill.status !== "active" || (endMonth && month > endMonth)) {
    return { dueDate: occurrenceDate, cashFlowDate: occurrenceDate, status: "inactive" as const, linkedTransaction };
  }

  const card = bill.credit_card_id ?cardsById.get(bill.credit_card_id) : undefined;
  const cashFlowDate = card
    ?calculateCreditCardCashFlowDate(occurrenceDate, card)
    : occurrenceDate;

  if (linkedTransaction) {
    return { dueDate: occurrenceDate, cashFlowDate, status: "paid" as const, linkedTransaction };
  }

  if (occurrenceDate < today) {
    return { dueDate: occurrenceDate, cashFlowDate, status: "overdue" as const, linkedTransaction };
  }

  return {
    dueDate: occurrenceDate,
    cashFlowDate,
    status: month > today.slice(0, 7) ?"future" as const : "pending" as const,
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
