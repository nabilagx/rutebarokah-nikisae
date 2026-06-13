import { supabase } from "@/lib/supabaseClient";
import { whatsappUrl } from "@/lib/formatters";

export async function openVendorWhatsapp(vendor, message) {
  if (!vendor?.whatsapp) return;

  const { error } = await supabase.from("leads").insert({
    umkm_id: vendor.id,
    source: "website",
    user_type: "unknown",
  });

  if (error) {
    console.error("Gagal mencatat lead WhatsApp:", error);
  }

  window.open(whatsappUrl(vendor.whatsapp, message), "_blank", "noopener,noreferrer");
}
