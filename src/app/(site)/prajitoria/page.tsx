import { mainPageMetadata, serviceGraph, breadcrumbGraph } from "@/lib/seo";
import StructuredData from "@/components/structured-data";
import RoasteryLanding from "@/components/roastery-landing";

export const metadata = mainPageMetadata("/prajitoria");

export default function RoasteryPage() { return <><StructuredData data={serviceGraph("/prajitoria", "Prăjitoria SwitchMORN", "Prăjire de cafea în loturi mici și blenduri personalizate")} /><StructuredData data={breadcrumbGraph([{name:"Makeon",path:"/"},{name:"Prăjitoria",path:"/prajitoria"}])} /><RoasteryLanding /></>; }
