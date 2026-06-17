import type { CreditCard, Transaction } from "./types";
import { getFirstInstallmentDate } from "./installment-schedule";

export function calculateCreditCardCashFlowDate(
  transactionDate: string,
  card: Pick<CreditCard, "closing_day" | "due_day">,
) {
  return getFirstInstallmentDate(
    transactionDate,
    card.closing_day,
    card.due_day,
  )
    .toISOString()
    .slice(0, 10);
}

export function getTransactionCashFlowDate(
  transaction: Pick<Transaction, "cash_flow_date" | "transaction_date">,
) {
  return transaction.cash_flow_date ??transaction.transaction_date;
}
