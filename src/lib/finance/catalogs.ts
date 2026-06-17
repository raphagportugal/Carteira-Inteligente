export const INCOME_CATEGORIES = [
  "Salário",
  "Pró-Labore",
  "Distribuição de Lucros",
  "Comissão",
  "Freelance",
  "Reembolso",
  "Estorno",
  "Saque de Investimento",
  "Empréstimo Recebido",
  "Venda de Bens",
  "Aluguel Recebido",
  "Dividendos",
  "Rendimentos",
  "Presente/Doação",
  "Transferência de Terceiros",
  "Outros recebimentos",
] as const;

export const EXPENSE_CATEGORIES = [
  "Alimentação",
  "Assinaturas",
  "Casa",
  "Educação",
  "Eletrônicos",
  "Investimentos",
  "Lazer",
  "Moradia",
  "Outros",
  "Saúde",
  "Serviços",
  "Transporte",
  "Vestuário",
] as const;

export const UNCATEGORIZED = "Sem categoria";

export const FINANCIAL_CATEGORIES = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
  UNCATEGORIZED,
] as const;

export const PAYMENT_METHODS = [
  "Pix",
  "Cartão de crédito",
  "Cartão de débito",
  "Dinheiro",
  "Transferência",
  "Boleto",
  "Débito automático",
  "Outro",
] as const;

export const CREDIT_CARD_PAYMENT_METHOD = "Cartão de crédito";

export const MONTHLY_BILL_STATUSES = [
  { value: "active", label: "Ativa" },
  { value: "inactive", label: "Inativa" },
] as const;

export const GOAL_PRIORITIES = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
] as const;

export const GOAL_STATUSES = [
  { value: "active", label: "Ativo" },
  { value: "completed", label: "Concluído" },
  { value: "paused", label: "Pausado" },
] as const;

export const INVESTMENT_TYPES = [
  { value: "emergency_reserve", label: "Reserva de emergência" },
  { value: "fixed_income", label: "Renda fixa" },
  { value: "stocks", label: "Ações" },
  { value: "funds", label: "Fundos" },
  { value: "pension", label: "Previdência" },
  { value: "crypto", label: "Cripto" },
  { value: "property", label: "Imóvel" },
  { value: "vehicle", label: "Veículo" },
  { value: "business_stake", label: "Participação em empresa" },
  { value: "other_asset", label: "Outros bens" },
  { value: "other", label: "Outro" },
] as const;

export const BANKS = [
  "Itaú",
  "Nubank",
  "Santander",
  "Banco do Brasil",
  "Bradesco",
  "Inter",
  "Caixa Econômica",
  "C6 Bank",
  "XP Investimentos",
  "Banco Safra",
  "Outro",
] as const;

export const FINANCING_TYPES = [
  { value: "property", label: "Imóvel" },
  { value: "car", label: "Carro" },
  { value: "motorcycle", label: "Moto" },
  { value: "personal_loan", label: "Empréstimo pessoal" },
  { value: "custom_plan", label: "Plano de Parcelamento Personalizado" },
  { value: "other", label: "Outro" },
] as const;

export const FINANCING_RATE_TYPES = [
  { value: "fixed", label: "Pré-fixado" },
  { value: "variable", label: "Pós-fixado" },
  { value: "unknown", label: "Não sei" },
] as const;

export const FINANCING_RATE_INDEXES = [
  { value: "ipca", label: "IPCA" },
  { value: "igpm", label: "IGP-M" },
  { value: "cub", label: "CUB" },
  { value: "tr", label: "TR" },
  { value: "other", label: "Outro" },
] as const;
