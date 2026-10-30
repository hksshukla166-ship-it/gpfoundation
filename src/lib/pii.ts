export function maskAadhaar(value: string | null | undefined) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "—";
  if (digits.length < 4) return "XXXX";
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

export function maskRationNumber(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw) return "—";
  if (raw.length <= 4) return "XXXX";
  return `${"X".repeat(Math.max(4, raw.length - 4))}${raw.slice(-4)}`;
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}
