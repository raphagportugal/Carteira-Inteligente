export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  transaction_date: string;
  credit_card_id: string | null;
  bank_account_id: string | null;
  monthly_bill_id: string | null;
  cash_flow_date: string | null;
  created_at: string;
};

export type BankAccount = {
  id: string;
  user_id: string;
  bank: string;
  account_number: string | null;
  balance: number;
  created_at: string;
};

export type AccountTransfer = {
  id: string;
  user_id: string;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  transfer_date: string;
  created_at: string;
};

export type Installment = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  credit_card_id: string | null;
  purchase_date: string | null;
  total_amount: number | null;
  installment_amount: number;
  current_installment: number;
  total_installments: number;
  start_date: string;
  end_date: string;
  created_at: string;
};

export type CreditCard = {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  last_four_digits: string;
  closing_day: number;
  due_day: number;
  created_at: string;
};

export type MonthlyBillStatus = "active" | "inactive";

export type MonthlyBill = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  monthly_amount: number;
  payment_method: string;
  bank_account_id: string | null;
  credit_card_id: string | null;
  due_day: number;
  start_date: string;
  end_date: string | null;
  status: MonthlyBillStatus;
  created_at: string;
};

export type Financing = {
  id: string;
  user_id: string;
  name: string;
  type: FinancingType | null;
  outstanding_balance: number;
  monthly_payment: number;
  interest_rate: number;
  remaining_months: number;
  start_date: string | null;
  end_date: string | null;
  monthly_due_day: number | null;
  estimated_rate: number | null;
  financed_amount: number | null;
  current_outstanding_balance: number | null;
  rate_type: FinancingRateType | null;
  rate_index: FinancingRateIndex | null;
  estimated_monthly_rate: number | null;
  created_at: string;
};

export type FinancingType =
  | "property"
  | "car"
  | "motorcycle"
  | "personal_loan"
  | "custom_plan"
  | "other";

export type FinancingRateType = "fixed" | "variable" | "unknown";
export type FinancingRateIndex = "ipca" | "igpm" | "cub" | "tr" | "other";

export type FinancingCustomPayment = {
  id: string;
  financing_id: string;
  user_id: string;
  due_date: string;
  amount: number;
  description: string;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  current_amount: number;
  target_amount: number;
  target_date: string;
  priority: GoalPriority;
  status: GoalStatus;
  created_at: string;
};

export type GoalPriority = "low" | "medium" | "high";
export type GoalStatus = "active" | "completed" | "paused";

export type InvestmentType =
  | "emergency_reserve"
  | "fixed_income"
  | "stocks"
  | "funds"
  | "pension"
  | "crypto"
  | "property"
  | "vehicle"
  | "business_stake"
  | "other_asset"
  | "other";

export type Investment = {
  id: string;
  user_id: string;
  name: string;
  type: InvestmentType;
  asset_type: InvestmentType | null;
  institution: string;
  current_value: number;
  reference_date: string;
  initial_value: number | null;
  initial_date: string | null;
  current_position: number | null;
  current_position_date: string | null;
  notes: string | null;
  cash_outflow: boolean;
  created_at: string;
};

export type InvestmentContribution = {
  id: string;
  investment_id: string;
  bank_account_id: string;
  user_id: string;
  amount: number;
  contribution_date: string;
  impacts_cash_flow: boolean;
  created_at: string;
};

export type InvestmentValuation = {
  id: string;
  investment_id: string;
  user_id: string;
  amount: number;
  valuation_date: string;
  notes: string | null;
  created_at: string;
};

export type FinancialPlan = {
  id: string;
  user_id: string;
  month: string;
  category: string;
  planned_amount: number;
  created_at: string;
};

export type FinancingPaymentStatus = {
  id: string;
  financing_id: string;
  user_id: string;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
};

export type IncomeForecast = {
  id: string;
  user_id: string;
  month: string;
  expected_income: number;
  created_at: string;
};
