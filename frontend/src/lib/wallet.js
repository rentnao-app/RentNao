import { apiFetch } from "./api";

export function formatMoney(value, currency = "BDT") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `0.00 ${currency}`;
  return `${amount.toFixed(2)} ${currency}`;
}

export function parsePaymentRequired(body) {
  const details = body?.details;
  if (details?.code !== "PAYMENT_REQUIRED") return null;

  return {
    feeCode: details.feeCode,
    requiredAmount: details.requiredAmount,
    availableBalance: details.availableBalance,
    currency: details.currency || "BDT",
  };
}

export function hasSufficientBalance(availableBalance, requiredAmount) {
  const balance = Number(availableBalance);
  const required = Number(requiredAmount);
  return (
    Number.isFinite(balance) && Number.isFinite(required) && balance >= required
  );
}

export async function fetchWalletAccount() {
  const res = await apiFetch("/wallet");
  const body = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      body?.error || body?.message || "Failed to load wallet balance",
    );
  return body?.data || null;
}

export async function fetchActiveFee(feeCode) {
  const res = await apiFetch(`/wallet/fees/${encodeURIComponent(feeCode)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      body?.error || body?.message || "Failed to load payment amount",
    );
  return body?.data || null;
}