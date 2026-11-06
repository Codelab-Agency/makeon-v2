import Image from "next/image";
import Link from "next/link";
import { legal } from "@/lib/legal";

export default function LegalFooter() {
  return (
    <div className="legal-footer">
      <nav className="legal-footer-links" aria-label="Informații legale">
        <Link href={legal.terms}>Termeni și condiții</Link>
        <Link href={legal.returns}>Retur și rambursare</Link>
        <Link href={legal.privacy}>Confidențialitate</Link>
        <Link href={legal.cookies}>Cookie-uri</Link>
        <a href={legal.anpc} target="_blank" rel="noopener noreferrer">
          Protecția consumatorilor — ANPC
        </a>
      </nav>
      <a
        className="legal-sal"
        href={legal.sal}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ANPC — Soluționarea alternativă a litigiilor"
      >
        <Image
          src="/images/legal/anpc-sal.png"
          alt="ANPC — Soluționarea alternativă a litigiilor"
          width={201}
          height={50}
          unoptimized
        />
      </a>
    </div>
  );
}
