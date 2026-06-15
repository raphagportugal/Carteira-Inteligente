import type {
  Financing,
  FinancingCustomPayment,
} from "./types";

function utcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthDifference(start: Date, end: Date) {
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    start.getUTCMonth()
  );
}

function dateInMonth(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

export type FinancingScheduleEntry = {
  number: number;
  dueDate: string;
  amount: number;
  description: string;
  status: "past" | "current" | "future";
};

export function buildMonthlyFinancingSchedule(input: {
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  dueDay?: number | null;
  referenceDate?: Date;
}) {
  const start = utcDate(input.startDate);
  const end = utcDate(input.endDate);
  const total = Math.max(1, monthDifference(start, end) + 1);
  const dueDay = input.dueDay ?? start.getUTCDate();
  const reference = input.referenceDate ?? new Date();
  const referenceMonth = `${reference.getUTCFullYear()}-${String(reference.getUTCMonth() + 1).padStart(2, "0")}`;

  return Array.from({ length: total }, (_, index) => {
    const month = start.getUTCMonth() + index;
    const dueDate = dateInMonth(
      start.getUTCFullYear() + Math.floor(month / 12),
      ((month % 12) + 12) % 12,
      dueDay,
    );
    const dueDateValue = isoDate(dueDate);
    const dueMonth = dueDateValue.slice(0, 7);
    return {
      number: index + 1,
      dueDate: dueDateValue,
      amount: input.monthlyPayment,
      description: `Parcela ${index + 1}`,
      status:
        dueMonth === referenceMonth
          ? "current"
          : dueDateValue < isoDate(reference)
            ? "past"
            : "future",
    } satisfies FinancingScheduleEntry;
  });
}

export function getFinancingSchedule(
  financing: Financing,
  customPayments: FinancingCustomPayment[] = [],
  referenceDate = new Date(),
) {
  if (financing.type === "custom_plan" && customPayments.length > 0) {
    const referenceMonth = isoDate(referenceDate).slice(0, 7);
    return [...customPayments]
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .map((payment, index) => ({
        number: index + 1,
        dueDate: payment.due_date,
        amount: Number(payment.amount),
        description: payment.description,
        status:
          payment.due_date.slice(0, 7) === referenceMonth
            ? "current"
            : payment.due_date < isoDate(referenceDate)
              ? "past"
              : "future",
      }) satisfies FinancingScheduleEntry);
  }

  if (financing.start_date && financing.end_date) {
    return buildMonthlyFinancingSchedule({
      startDate: financing.start_date,
      endDate: financing.end_date,
      monthlyPayment: Number(financing.monthly_payment),
      dueDay: financing.monthly_due_day,
      referenceDate,
    });
  }

  const start = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
  );
  return Array.from(
    { length: Math.max(0, Number(financing.remaining_months)) },
    (_, index) => ({
      number: index + 1,
      dueDate: isoDate(
        dateInMonth(
          start.getUTCFullYear(),
          start.getUTCMonth() + index,
          financing.monthly_due_day ?? 1,
        ),
      ),
      amount: Number(financing.monthly_payment),
      description: `Parcela ${index + 1}`,
      status: index === 0 ? "current" : "future",
    }),
  ) satisfies FinancingScheduleEntry[];
}

export function getFinancingProgress(
  financing: Financing,
  customPayments: FinancingCustomPayment[] = [],
  referenceDate = new Date(),
) {
  const schedule = getFinancingSchedule(financing, customPayments, referenceDate);
  const elapsed = schedule.filter((entry) => entry.status === "past").length;
  const current = Math.min(schedule.length, elapsed + (schedule.length ? 1 : 0));
  const remaining = schedule.filter((entry) => entry.status !== "past").length;
  return {
    total: schedule.length,
    current,
    remaining,
    percentage: schedule.length
      ? Math.min(100, Math.round((elapsed / schedule.length) * 100))
      : 0,
    schedule,
  };
}

export function estimateCet(
  principal: number,
  payment: number,
  months: number,
) {
  if (
    principal <= 0 ||
    payment <= 0 ||
    months <= 0 ||
    payment * months <= principal
  ) {
    return null;
  }

  const presentValue = (monthlyRate: number) =>
    payment * ((1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate);
  let low = 0.00000001;
  let high = 1;
  if (presentValue(high) > principal) return null;

  for (let index = 0; index < 100; index += 1) {
    const middle = (low + high) / 2;
    if (presentValue(middle) > principal) low = middle;
    else high = middle;
  }

  const monthly = (low + high) / 2;
  const annual = Math.pow(1 + monthly, 12) - 1;
  if (!Number.isFinite(monthly) || !Number.isFinite(annual)) return null;
  return {
    monthly: Number((monthly * 100).toFixed(4)),
    annual: Number((annual * 100).toFixed(4)),
  };
}

export function getFinancingRemainingMonths(
  financing: Financing,
  customPayments: FinancingCustomPayment[] = [],
  referenceDate = new Date(),
) {
  return getFinancingProgress(financing, customPayments, referenceDate).remaining;
}

export function financingAmountInMonth(
  financing: Financing,
  customPayments: FinancingCustomPayment[],
  monthStart: string,
  monthEnd: string,
) {
  return getFinancingSchedule(financing, customPayments)
    .filter((entry) => entry.dueDate >= monthStart && entry.dueDate <= monthEnd)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function financingOccursInMonth(
  financing: Financing,
  monthStart: string,
  monthEnd: string,
) {
  return financingAmountInMonth(financing, [], monthStart, monthEnd) > 0;
}
