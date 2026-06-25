import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

type BrandLogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
  variant?: "default" | "white";
};

export function BrandLogo({
  compact = false,
  href = "/",
  className,
  variant = "default",
}: BrandLogoProps) {
  const logoSrc = compact
    ? brand.assets.logo
    : variant === "white"
      ? brand.assets.logoHorizontalWhite
      : brand.assets.logoHorizontal;

  return (
    <Link
      href={href}
      className="inline-flex items-center bg-transparent p-0"
      aria-label={brand.name}
    >
      <Image
        src={logoSrc}
        alt={brand.name}
        width={compact ? 52 : 260}
        height={compact ? 52 : 68}
        priority
        className={className ?? (compact ? "h-12 w-12" : "h-12 w-auto sm:h-14 lg:h-16")}
      />
    </Link>
  );
}
