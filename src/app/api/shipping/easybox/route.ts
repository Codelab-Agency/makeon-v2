import { createHash } from "node:crypto";
import { easyboxConfigured } from "@/lib/easybox";
import { allowedRequestOrigin } from "@/lib/request-origin";
import { samedayLocker, SamedayError } from "@/lib/sameday-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {"Cache-Control":"no-store"};
const attempts = new Map<string,{count:number;expires:number}>();

export async function GET() {
  if (!easyboxConfigured()) return Response.json({error:"Harta easybox nu este disponibilă momentan."},{status:503,headers});
  // These two dedicated map identifiers are public. Never return courier API credentials.
  return Response.json({clientId:process.env.SAMEDAY_LOCKER_CLIENT_ID!.trim(),apiUsername:process.env.SAMEDAY_LOCKER_API_USERNAME!.trim()},{headers});
}

export async function POST(request: Request) {
  if (!allowedRequestOrigin(request)) return Response.json({error:"Solicitare nepermisă."},{status:403,headers});
  if (!easyboxConfigured()) return Response.json({error:"Livrarea la easybox nu este disponibilă momentan."},{status:503,headers});
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({error:"Format invalid."},{status:415,headers});
  try {
    const raw=await request.text();
    if (Buffer.byteLength(raw)>2048) return Response.json({error:"Solicitare prea mare."},{status:413,headers});
    const body=JSON.parse(raw);
    if (!Number.isSafeInteger(body?.lockerId) || body.lockerId<=0) return Response.json({error:"Alege un easybox valid."},{status:400,headers});
    const now=Date.now();
    for(const [key,value] of attempts) if(value.expires<=now) attempts.delete(key);
    const key=createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").digest("hex");
    const rate=attempts.get(key)??{count:0,expires:now+600000};
    if(rate.count>=30) return Response.json({error:"Prea multe verificări. Încearcă din nou în câteva minute."},{status:429,headers});
    if(attempts.size>=5000) attempts.delete(attempts.keys().next().value!);
    rate.count++;attempts.set(key,rate);
    return Response.json({locker:await samedayLocker(body.lockerId)},{headers});
  } catch(error) {
    if(error instanceof SamedayError) return Response.json({error:error.message},{status:error.status,headers});
    if(error instanceof SyntaxError) return Response.json({error:"Solicitare invalidă."},{status:400,headers});
    return Response.json({error:"Easyboxul nu a putut fi verificat. Încearcă din nou."},{status:502,headers});
  }
}
