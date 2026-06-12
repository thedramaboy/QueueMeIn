import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone) {
  if (!phone) return "-";
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "-";
  return Number(amount).toLocaleString("th-TH");
}
