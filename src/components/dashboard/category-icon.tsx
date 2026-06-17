import {
  BadgeDollarSign,
  Bike,
  Briefcase,
  Car,
  CalendarRange,
  CircleDollarSign,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Plane,
  Repeat,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smile,
  TrendingUp,
  Utensils,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { FinancingType, InvestmentType } from "@/lib/finance/types";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const categoryIcons: Record<string, LucideIcon> = {
  salario: Wallet,
  aluguel: Home,
  comissao: BadgeDollarSign,
  freelance: Briefcase,
  dividendos: TrendingUp,
  "outros recebimentos": CircleDollarSign,
  moradia: Home,
  casa: Home,
  alimentacao: Utensils,
  mercado: ShoppingCart,
  transporte: Car,
  saude: HeartPulse,
  educacao: GraduationCap,
  lazer: Smile,
  viagem: Plane,
  compras: ShoppingBag,
  vestuario: ShoppingBag,
  eletronicos: ShoppingBag,
  assinaturas: Repeat,
  servicos: Wrench,
  seguro: Shield,
  financiamento: Landmark,
  "cartao de credito": CreditCard,
  investimentos: TrendingUp,
  outros: CircleDollarSign,
  outro: CircleDollarSign,
};

const financingIcons: Record<FinancingType, LucideIcon> = {
  property: Home,
  car: Car,
  motorcycle: Bike,
  personal_loan: Landmark,
  custom_plan: CalendarRange,
  other: CircleDollarSign,
};

const investmentIcons: Record<InvestmentType, LucideIcon> = {
  emergency_reserve: Shield,
  fixed_income: Landmark,
  stocks: TrendingUp,
  funds: CircleDollarSign,
  pension: Wallet,
  crypto: CircleDollarSign,
  property: Home,
  vehicle: Car,
  business_stake: Briefcase,
  other_asset: ShoppingBag,
  other: CircleDollarSign,
};

export function getCategoryIcon(category: string) {
  return categoryIcons[normalize(category)] ??CircleDollarSign;
}

export function getFinancingTypeIcon(type?: FinancingType | null) {
  return financingIcons[type ??"other"] ??CircleDollarSign;
}

export function getInvestmentTypeIcon(type: InvestmentType) {
  return investmentIcons[type] ??CircleDollarSign;
}

export function CategoryIcon({ category }: { category: string }) {
  const Icon = getCategoryIcon(category);
  return <Icon className="size-5" />;
}

export function FinancingTypeIcon({
  type,
  className = "size-5",
}: {
  type?: FinancingType | null;
  className?: string;
}) {
  const Icon = getFinancingTypeIcon(type);
  return <Icon className={className} />;
}

export function InvestmentTypeIcon({
  type,
  className = "size-5",
}: {
  type: InvestmentType;
  className?: string;
}) {
  const Icon = getInvestmentTypeIcon(type);
  return <Icon className={className} />;
}
