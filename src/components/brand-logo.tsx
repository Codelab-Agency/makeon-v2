import Image from "next/image";
import Link from "next/link";

export default function BrandLogo({
  href = "/",
  priority = false,
  light = false,
}: {
  href?: string;
  priority?: boolean;
  light?: boolean;
}) {
  return (
    <Link
      className={`wordmark brand-mark${light ? " brand-mark-light" : ""}`}
      href={href}
      aria-label="Makeon, acasă"
    >
      <span className="brand-horizontal">
        <Image
          src="/images/makeon-logo.svg"
          alt=""
          width={60}
          height={58}
          priority={priority}
          draggable={false}
        />
        <svg className="brand-wordmark" viewBox="0 0 484 54" focusable="false" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinejoin="miter">
            <path d="M4 49V4h2l23 29L52 4h2v45" />
            <path d="m96 49 23-45h2l23 45" />
            <path d="M185 4v45m0-19 40-26m-23 15 26 30" />
            <path d="M307 4h-40v45h40m-40-23h37" />
            <ellipse cx="371" cy="26.5" rx="24" ry="23" />
            <path d="M438 49V4h2l39 45h2V4" />
          </g>
        </svg>
      </span>
    </Link>
  );
}
