import { MessageCircle } from "lucide-react";
import { generateWhatsAppLink } from "@/utils/whatsapp";

export function WhatsAppFloat({ phone }: { phone: string }) {
  return (
    <a href={generateWhatsAppLink({ phone })} target="_blank" rel="noreferrer" className="focus-ring fixed bottom-4 right-4 z-40 inline-flex min-h-14 items-center gap-2 rounded-full bg-[#167a40] px-4 font-extrabold text-white shadow-[0_12px_35px_rgba(21,128,61,.28)] transition hover:-translate-y-0.5 hover:bg-[#106332] sm:bottom-6 sm:right-6" aria-label="Consultar por WhatsApp">
      <MessageCircle size={23} fill="currentColor" aria-hidden="true" />
      <span className="hidden sm:inline">¿Te ayudamos?</span>
    </a>
  );
}
