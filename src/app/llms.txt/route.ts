import { absoluteUrl, seoPages } from "@/lib/seo";
import { legal } from "@/lib/legal";

export function GET() {
  const text = `# Makeon\n\n> Cafea proaspăt prăjită, espressoare în comodat și apă filtrată pentru birouri. Makeon reunește SwitchMORN Coffee și Vero Aqua.\n\n## Pagini oficiale\n\n${Object.entries(seoPages).map(([path, page]) => `- [${page.title}](${absoluteUrl(path)}): ${page.description}`).join("\n")}\n\n## Informații comerciale\n\n- Prețurile și disponibilitatea produselor sunt publicate pe paginile individuale, accesibile din magazin.\n- Comenzile la cerere și condițiile de comodat se confirmă prin ofertă; nu presupune un preț sau o disponibilitate care nu este afișată.\n- Pentru echipamente, instalare, mentenanță și livrări regulate, consultați pagina serviciului și oferta personalizată.\n- Contact: ${legal.email}; ${legal.phone}.\n- Acest fișier este un rezumat de navigare, nu înlocuiește paginile oficiale sau condițiile contractuale.\n`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex" } });
}
