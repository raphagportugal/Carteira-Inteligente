import { formatCurrency } from "@/lib/finance/format";

type CurrencyValueSize = "sm" | "md" | "lg" | "xl" | "chart" | "card";

type CurrencyValueProps = {
  value: number | string;
  size?: CurrencyValueSize;
  sign?: "+" | "-";
  className?: string;
};

const sizes: Record<CurrencyValueSize, string> = {
  sm: "text-[clamp(0.7rem,0.8vw,0.875rem)]",
  md: "text-[clamp(0.75rem,1vw,1rem)]",
  lg: "text-[clamp(0.875rem,1.15vw,1.25rem)]",
  xl: "text-[clamp(1rem,1.35vw,1.5rem)]",
  chart: "text-[clamp(0.55rem,0.7vw,0.75rem)]",
  card: "text-[clamp(0.75rem,1vw,1.125rem)]",
};

export function CurrencyValue({
  value,
  size = "md",
  sign,
  className = "",
}: CurrencyValueProps) {
  const negative = typeof value === "number" && value < 0;
  const formatted = typeof value === "number" ? formatCurrency(Math.abs(value)) : value;
  const displaySign = sign ??(negative ? "-" : undefined);

  return (
    <span className={`financial-value ${sizes[size]} ${className}`}>
      {displaySign ? `${displaySign} ` : ""}
      {formatted}
    </span>
  );
}
