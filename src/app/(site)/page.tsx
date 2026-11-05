import { mainPageMetadata } from "@/lib/seo";
import MakeonLanding from "@/components/makeon-landing";

export const metadata = mainPageMetadata("/");

export default function HomePage() {
  return <MakeonLanding key="coffee" />;
}
