import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
  subtitle?: string;
};

export function BrandLogo({
  href = "/",
  compact = false,
  inverted = false,
  subtitle = "Nutrition Platform",
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={`brand-logo ${compact ? "compact" : ""} ${
        inverted ? "inverted" : ""
      }`}
      aria-label="Cihad Çoban Nutrition ana sayfa"
    >
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="img">
          <path
            d="M16 35c0-11 7-20 19-20 7 0 12 3 15 8-5-1-10 1-13 5-4 5-4 12 0 17-2 2-6 4-11 4-6 0-10-5-10-14Z"
            fill="currentColor"
            opacity=".22"
          />
          <path
            d="M20 35c0-8 5-14 13-14 5 0 9 2 12 6-7-1-13 4-13 11 0 4 2 8 6 10-2 1-4 2-7 2-6 0-11-6-11-15Z"
            fill="currentColor"
          />
          <path
            d="M40 13c7 2 11 7 12 14-7-1-12-5-12-14Z"
            fill="currentColor"
          />
          <path
            d="M31 27c-5 4-7 10-5 17"
            fill="none"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="brand-wordmark">
        <strong>Cihad Çoban</strong>
        {!compact && <small>{subtitle}</small>}
      </span>
    </Link>
  );
}
