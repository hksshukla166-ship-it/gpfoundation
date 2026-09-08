import type { ApplicationStatus, PaymentStatus } from "@prisma/client";

export function paymentStatusLabel(status: PaymentStatus | string | null | undefined) {
  if (status === "SUCCESS") return "Successful";
  if (status === "FAILED") return "Failed";
  if (status === "REFUNDED") return "Refunded";
  return "Pending";
}

export function registrationPaymentLabel(status: ApplicationStatus | string | null | undefined) {
  if (status === "PAYMENT_SUCCESSFUL" || status === "VERIFIED" || status === "CONFIRMED") return "Successful";
  if (status === "PAYMENT_FAILED" || status === "REJECTED") return "Failed";
  return "Pending";
}

export function paymentModeLabel(mode: string | null | undefined) {
  if (!mode) return "Online";
  const map: Record<string, string> = {
    upi: "UPI",
    card: "Card",
    netbanking: "Net Banking",
    wallet: "Wallet",
    emi: "EMI",
    cardless_emi: "Cardless EMI",
    paylater: "Pay Later",
    bank_transfer: "Bank Transfer",
  };
  return map[mode.toLowerCase()] || mode;
}
