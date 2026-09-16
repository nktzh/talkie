import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import styles from "./Logo.module.css";

interface LogoProps {
  size?: number;
  className?: string;
}

/** Знак бренда из /public/logo.svg */
export function Logo({ size = 40, className }: LogoProps) {
  return (
    <span className={cn(styles.logo, className)}>
      <Image
        src="/logo.svg"
        alt="Talkie"
        width={size}
        height={size}
        className={styles.mark}
        priority
        unoptimized
      />
    </span>
  );
}
