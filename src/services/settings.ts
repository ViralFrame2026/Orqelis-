import { cache } from "react";
import { FALLBACK_SETTINGS } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/types";

const SETTING_MAP: Record<string, keyof SiteSettings> = {
  store_name: "storeName",
  whatsapp_number: "whatsappNumber",
  instagram_url: "instagramUrl",
  shipping_text: "shippingText",
  delivery_text: "deliveryText",
  email: "email",
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient();
  if (!supabase) return FALLBACK_SETTINGS;

  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) {
    console.error("No se pudo cargar la configuración:", error.message);
    return FALLBACK_SETTINGS;
  }

  return (data || []).reduce<SiteSettings>((settings, row) => {
    const property = SETTING_MAP[row.key];
    if (property && typeof row.value === "string") settings[property] = row.value;
    return settings;
  }, { ...FALLBACK_SETTINGS });
});
