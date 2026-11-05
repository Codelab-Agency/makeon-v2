import { mainPageMetadata, serviceGraph, breadcrumbGraph } from "@/lib/seo";
import StructuredData from "@/components/structured-data";
import MakeonLanding from "@/components/makeon-landing";

export const metadata = mainPageMetadata("/apa");

export default function WaterPage() {
  return <><StructuredData data={serviceGraph("/apa", "Apă filtrată pentru birouri Vero Aqua", "Dozatoare de apă, filtrare profesională, instalare și mentenanță")} /><StructuredData data={breadcrumbGraph([{name:"Makeon",path:"/"},{name:"Apă pentru birouri",path:"/apa"}])} /><MakeonLanding key="water" initialWorld="water" dedicatedWater /></>;
}
