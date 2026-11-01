import { CommerceError } from "./commerce-validation";

export type EasyboxLocker = {
  id: number;
  name: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  supportedPayment?: boolean;
};

export function parseEasyboxLocker(value: unknown): EasyboxLocker {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CommerceError("Alege un easybox de pe hartă.");
  const locker = value as Record<string, unknown>;
  if (!Number.isSafeInteger(locker.id) || Number(locker.id) <= 0) throw new CommerceError("Alege un easybox valid de pe hartă.");
  const text = (key: string, max: number, min = 1) => {
    const text = typeof locker[key] === "string" ? locker[key].trim() : "";
    if (text.length < min || text.length > max || /[\x00-\x1f\x7f]/.test(text)) throw new CommerceError("Datele easyboxului nu sunt valide. Alege din nou pe hartă.");
    return text;
  };
  const postalCode = text("postalCode", 6, 0);
  if (postalCode && !/^\d{6}$/.test(postalCode)) throw new CommerceError("Codul poștal al easyboxului nu este valid.");
  return {
    id: Number(locker.id), name: text("name", 150), address: text("address", 250, 5),
    city: text("city", 100), county: text("county", 100), postalCode,
    ...(typeof locker.supportedPayment === "boolean" ? { supportedPayment: locker.supportedPayment } : {}),
  };
}
