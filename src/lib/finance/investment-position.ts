import type {
  Investment,
  InvestmentContribution,
} from "./types";

export function getInvestmentInitialValue(investment: Investment) {
  return Number(investment.initial_value ?? investment.current_value);
}

export function getInvestmentInitialDate(investment: Investment) {
  return investment.initial_date ?? investment.reference_date;
}

export function getInvestmentPosition(
  investment: Investment,
  contributions: InvestmentContribution[],
) {
  if (investment.current_position !== null) {
    return Number(investment.current_position);
  }
  return (
    getInvestmentInitialValue(investment) +
    contributions
      .filter((item) => item.investment_id === investment.id)
      .reduce((sum, item) => sum + Number(item.amount), 0)
  );
}

export function getInvestmentCurrentDate(investment: Investment) {
  return investment.current_position_date ?? investment.reference_date;
}
