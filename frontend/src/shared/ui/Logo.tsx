import { cn } from "@/shared/lib/cn";
import styles from "./Logo.module.css";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Знак бренда. Разметка встроена, а не подключается картинкой из /public/logo.svg:
 * так он заливается currentColor и следует за выбранным цветом оформления
 */
export function Logo({ size = 40, className }: LogoProps) {
  return (
    <span className={cn(styles.logo, className)}>
      <svg
        className={styles.mark}
        width={size}
        height={size}
        viewBox="0 0 96 96"
        role="img"
        aria-label="Talkie"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M48 0C74.5097 0 96 21.4903 96 48C96 74.5097 74.5097 96 48 96H8C3.58172 96 1.28855e-07 92.4183 0 88V48C0 21.4903 21.4903 0 48 0ZM30 36C26.6863 36 24 38.6863 24 42V54C24 57.3137 26.6863 60 30 60C33.3137 60 36 57.3137 36 54V42C36 38.6863 33.3137 36 30 36ZM66 36C62.6863 36 60 38.6863 60 42V54C60 57.3137 62.6863 60 66 60C69.3137 60 72 57.3137 72 54V42C72 38.6863 69.3137 36 66 36Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
