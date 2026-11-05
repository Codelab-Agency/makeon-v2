import { mainPageMetadata, serviceGraph, breadcrumbGraph } from "@/lib/seo";
import StructuredData from "@/components/structured-data";
import MakeonLanding from "@/components/makeon-landing";

export const metadata = mainPageMetadata("/cafea-pentru-birouri");

export default function OfficeCoffeePage() {
  return <><StructuredData data={serviceGraph("/cafea-pentru-birouri", "Cafea de origine pentru birouri", "Cafea proaspăt prăjită, espressoare în comodat, aprovizionare și service")} /><StructuredData data={breadcrumbGraph([{name:"Makeon",path:"/"},{name:"Cafea pentru birouri",path:"/cafea-pentru-birouri"}])} /><MakeonLanding key="office-coffee" dedicatedCoffee /></>;
}
