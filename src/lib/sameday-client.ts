import "server-only";
import { createHash } from "node:crypto";
import { parseEasyboxLocker } from "./easybox-selection";

export class SamedayError extends Error {
  constructor(message: string, public status = 502, public uncertain = false) {
    super(message);
    this.name = "SamedayError";
  }
}

export function samedayConfig() {
  const { SAMEDAY_ENV: environment, SAMEDAY_USERNAME: username, SAMEDAY_PASSWORD: password } = process.env;
  if (!username || !password || !["production", "sandbox"].includes(environment || ""))
    throw new SamedayError("Configurează datele Sameday pe server.", 503);
  return {
    environment: environment!, username, password,
    base: environment === "production" ? "https://api.sameday.ro" : "https://sameday-api.demo.zitec.com",
    account: createHash("sha256").update(`${environment}:${username}`).digest("hex"),
  };
}

type Config = ReturnType<typeof samedayConfig>;
type Fetcher = typeof fetch;
let cached: { key: string; token: Promise<string>; expires: number } | undefined;

async function token(config: Config, fetcher: Fetcher) {
  const key = createHash("sha256").update(`${config.account}:${config.password}`).digest("hex");
  if (cached?.key === key && cached.expires > Date.now()) return cached.token;
  const pending = (async () => {
    const response = await fetcher(config.base + "/api/authenticate", {
      method: "POST", redirect: "error", cache: "no-store",
      headers: { "X-AUTH-USERNAME": config.username, "X-AUTH-PASSWORD": config.password, "Content-Type": "application/x-www-form-urlencoded" },
      body: "remember_me=1", signal: AbortSignal.timeout(15000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || typeof body?.token !== "string")
      throw new SamedayError("Autentificarea API Sameday a eșuat. Verifică accesul și credențialele.", 503);
    return body.token as string;
  })();
  cached = { key, token: pending, expires: Date.now() + 5 * 60000 };
  try { return await pending; }
  catch (error) { if (cached?.token === pending) cached = undefined; throw error; }
}

/** Encode nested fields exactly like the official SDK's http_build_query body. */
export function samedayForm(value: Record<string, unknown>) {
  const params = new URLSearchParams();
  const add = (key: string, item: unknown) => {
    if (item == null) return;
    if (typeof item === "object") {
      for (const [child, field] of Object.entries(item)) add(`${key}[${child}]`, field);
    } else params.append(key, String(item));
  };
  for (const [key, item] of Object.entries(value)) add(key, item);
  return params;
}

async function request(path: string, body?: Record<string, unknown>, fetcher: Fetcher = fetch) {
  const config = samedayConfig();
  // Authenticate before sending the AWB. An authentication failure cannot create a shipment.
  const auth = await token(config, fetcher);
  let response: Response;
  try {
    response = await fetcher(config.base + path, {
      method: body ? "POST" : "GET", redirect: "error", cache: "no-store",
      headers: { "X-AUTH-TOKEN": auth, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
      body: body ? samedayForm(body) : undefined, signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new SamedayError("Sameday nu a confirmat răspunsul. Verifică expedierea în eAWB înainte de o nouă încercare.", 502, !!body);
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) cached = undefined;
    const uncertain = !!body && (response.status >= 500 || response.status === 408);
    throw new SamedayError(uncertain
      ? "Rezultatul emiterii nu este confirmat. Verifică referința comenzii în eAWB."
      : "Sameday a respins solicitarea. Verifică datele destinatarului, greutatea și serviciul ales.", 502, uncertain);
  }
  return response;
}

export type ShippingOption = { id: number; name: string; deliveryMethod?: "address" | "easybox" };
export async function samedayOptions(fetcher: Fetcher = fetch) {
  const list = async (path: string) => {
    const items: Record<string, unknown>[] = [];
    for (let page = 1; page <= 30; page++) {
      const response = await request(`${path}?page=${page}`, undefined, fetcher);
      const body = await response.json();
      if (!Array.isArray(body.data)) throw new SamedayError("Lista Sameday nu este disponibilă.");
      items.push(...body.data);
      if (page >= (body.pages || 1)) return items;
    }
    throw new SamedayError("Lista Sameday depășește limita de încărcare.");
  };
  const [points, services] = await Promise.all([list("/api/client/pickup-points"), list("/api/client/services")]);
  return {
    environment: samedayConfig().environment,
    pickupPoints: points.map((p): ShippingOption => ({ id: Number(p.id), name: String(p.alias || p.name || p.address || `Punct ${p.id}`) })),
    // IDs are account/environment specific. Domestic locker service is LN.
    services: services.filter(s => s.serviceCode === "24" || s.serviceCode === "LN").map((s): ShippingOption => ({ id: Number(s.id), name: String(s.name), deliveryMethod: s.serviceCode === "LN" ? "easybox" : "address" })),
  };
}

/** Validate one locker with Sameday, never trust map callback addresses from a browser. */
export async function samedayLocker(id: number, fetcher: Fetcher = fetch) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new SamedayError("Easybox invalid.", 400);
  const response = await request(`/api/client/lockers?lockersList=${id}`, undefined, fetcher);
  const result = await response.json();
  const locker = Array.isArray(result?.data) ? result.data.find((item: {lockerId?:unknown}) => Number(item.lockerId) === id) : undefined;
  if (!locker || Number(locker.clientVisible) === 0) throw new SamedayError("Easyboxul nu mai este disponibil. Alege alt locker de pe hartă.", 409);
  try {
    return parseEasyboxLocker({ id, name: locker.name, address: locker.address, city: locker.city, county: locker.county, postalCode: String(locker.postalCode ?? ""), supportedPayment: Number(locker.supportedPayment) === 1 });
  } catch { throw new SamedayError("Datele easyboxului nu au putut fi verificate. Alege alt locker.", 409); }
}

export async function samedayCreate(body: Record<string, unknown>, fetcher: Fetcher = fetch) {
  const response = await request("/api/awb", body, fetcher);
  const result = await response.json().catch(() => null);
  const number = String(result?.awbNumber || "");
  if (!/^[A-Za-z0-9]{6,40}$/.test(number))
    throw new SamedayError("Sameday nu a returnat un AWB valid. Verifică expedierea în eAWB.", 502, true);
  return number;
}

export async function samedayPDF(number: string, format: "A4" | "A6", fetcher: Fetcher = fetch) {
  if (!/^[A-Za-z0-9]{6,40}$/.test(number)) throw new SamedayError("AWB invalid.", 400);
  const response = await request(`/api/awb/download/${encodeURIComponent(number)}/${format}`, undefined, fetcher);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
    throw new SamedayError("PDF-ul AWB nu este disponibil momentan.");
  return bytes;
}
