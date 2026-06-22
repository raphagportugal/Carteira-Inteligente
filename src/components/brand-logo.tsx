import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

type BrandLogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

export function BrandLogo({ compact = false, href = "/", className }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex items-center rounded-xl"
      aria-label={brand.name}
    >
      <Image
        src={compact ? brand.assets.logo : brand.assets.logoHorizontal}
        alt={brand.name}
        width={compact ? 52 : 260}
        height={compact ? 52 : 68}
        priority
        className={className ?? (compact ? "h-12 w-12" : "h-12 w-auto sm:h-14 lg:h-16")}
      />
    </Link>
  );
}
