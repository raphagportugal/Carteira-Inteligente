import { getInvestmentPosition } from "@/lib/finance/investment-position";
import type {
  Goal,
  GoalInvestmentAllocation,
  Investment,
  InvestmentContribution,
} from "@/lib/finance/types";

export function buildEffectiveAllocationAmounts(
  allocations: GoalInvestmentAllocation[],
  investments: Investment[],
  contributions: InvestmentContribution[],
) {
  const effectiveAmounts = new Map<string, number>();

  for (const investment of investments) {
    const position = Math.max(0, getInvestmentPosition(investment, contributions));
    let available = position;
    const investmentAllocations = allocations
      .filter((allocation) => allocation.investment_id === investment.id)
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

    for (const allocation of investmentAllocations) {
      const amount = Math.max(0, Number(allocation.allocated_amount));
      const effectiveAmount = Math.min(amount, available);
      effectiveAmounts.set(allocation.id, effectiveAmount);
      available = Math.max(0, Math.round((available - effectiveAmount) * 100) / 100);
    }
  }

  for (const allocation of allocations) {
    if (!effectiveAmounts.has(allocation.id)) {
      effectiveAmounts.set(allocation.id, 0);
    }
  }

  return effectiveAmounts;
}

export function getGoalAllocatedAmount(
  goalId: string,
  allocations: GoalInvestmentAllocation[],
  effectiveAllocationAmounts: Map<string, number>,
) {
  return allocations
    .filter((allocation) => allocation.goal_id === goalId)
    .reduce(
      (sum, allocation) =>
        sum + (effectiveAllocationAmounts.get(allocation.id) ?? Number(allocation.allocated_amount)),
      0,
    );
}

export function getGoalEffectiveCurrentAmount(
  goal: Goal,
  allocations: GoalInvestmentAllocation[],
  effectiveAllocationAmounts: Map<string, number>,
) {
  const allocatedAmount = getGoalAllocatedAmount(goal.id, allocations, effectiveAllocationAmounts);
  return allocatedAmount > 0 ? allocatedAmount : Number(goal.current_amount);
}
