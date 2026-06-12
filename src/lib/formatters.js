export function formatRupiah(value) {
  if (!value && value !== 0) return "Harga menyesuaikan";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function normalizeWhatsapp(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function whatsappUrl(whatsapp, message) {
  return `https://wa.me/${normalizeWhatsapp(whatsapp)}?text=${encodeURIComponent(message)}`;
}

export function splitBadges(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

