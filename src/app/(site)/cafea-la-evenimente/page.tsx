import { mainPageMetadata, serviceGraph, breadcrumbGraph } from "@/lib/seo";
import StructuredData from "@/components/structured-data";
import EventLanding from "@/components/event-landing";

export const metadata = mainPageMetadata("/cafea-la-evenimente");

export default function EventsPage() { return <><StructuredData data={serviceGraph("/cafea-la-evenimente", "Cafea la evenimente SwitchMORN", "Bar mobil de cafea și rulotă pentru evenimente")} /><StructuredData data={breadcrumbGraph([{name:"Makeon",path:"/"},{name:"Cafea la evenimente",path:"/cafea-la-evenimente"}])} /><EventLanding /></>; }
