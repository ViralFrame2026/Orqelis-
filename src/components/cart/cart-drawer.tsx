"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { calculateCartTotal, generateCartWhatsAppMessage } from "@/utils/cart";
import { formatPrice } from "@/utils/format";
import { generateWhatsAppLink } from "@/utils/whatsapp";

type Props = {
  phone: string;
  baseUrl: string;
};

export function CartDrawer({ phone, baseUrl }: Props) {
  const { items, isOpen, closeCart, setQuantity, removeItem, clearCart } = useCart();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const total = useMemo(() => calculateCartTotal(items), [items]);
  const whatsappUrl = useMemo(() => generateWhatsAppLink({
    phone,
    message: generateCartWhatsAppMessage(items, baseUrl),
  }), [phone, baseUrl, items]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button type="button" onClick={closeCart} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" aria-label="Cerrar carrito" />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cart-title" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-[-24px_0_70px_rgba(43,33,30,.22)]">
        <header className="flex min-h-20 items-center justify-between border-b border-ink/10 px-5 sm:px-6">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[.16em] text-clay">Tu selección</p>
            <h2 id="cart-title" className="font-display mt-1 text-2xl">Carrito</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={closeCart} className="focus-ring grid size-11 place-items-center rounded-full border border-ink/10 bg-white" aria-label="Cerrar carrito">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {items.length ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <ul className="grid gap-3">
                {items.map((item) => (
                  <li key={item.id} className="grid grid-cols-[5rem_1fr] gap-3 rounded-2xl border border-ink/8 bg-white p-2.5">
                    <Link href={`/producto/${item.slug}`} onClick={closeCart} className="focus-ring relative aspect-square overflow-hidden rounded-xl bg-cream">
                      <Image src={item.image_url || "/products/placeholder.svg"} alt="" fill sizes="80px" className="object-cover" />
                    </Link>
                    <div className="min-w-0 py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/producto/${item.slug}`} onClick={closeCart} className="focus-ring line-clamp-2 rounded text-sm font-extrabold leading-snug">{item.name}</Link>
                        <button type="button" onClick={() => removeItem(item.id)} className="focus-ring grid size-8 shrink-0 place-items-center rounded-lg text-ink/48 transition hover:bg-cream hover:text-clay" aria-label={`Quitar ${item.name} del carrito`}>
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                      <p className="mt-1 text-sm font-black text-clay">{formatPrice(item.price)}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-xl border border-ink/10 bg-cream/55 p-0.5">
                          <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} className="focus-ring grid size-8 place-items-center rounded-lg" aria-label={`Restar una unidad de ${item.name}`}><Minus size={14} /></button>
                          <span className="min-w-8 text-center text-sm font-black" aria-label={`${item.quantity} unidades`}>{item.quantity}</span>
                          <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} className="focus-ring grid size-8 place-items-center rounded-lg" aria-label={`Sumar una unidad de ${item.name}`}><Plus size={14} /></button>
                        </div>
                        <p className="text-sm font-black">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={clearCart} className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-xs font-extrabold text-ink/58 transition hover:text-clay"><Trash2 size={15} /> Vaciar carrito</button>
            </div>

            <footer className="border-t border-ink/10 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div><p className="text-xs font-bold text-ink/55">Total estimado</p><p className="mt-0.5 text-[0.65rem] font-semibold text-ink/48">Se confirma por WhatsApp</p></div>
                <p className="text-2xl font-black tracking-[-.04em]">{formatPrice(total)}</p>
              </div>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#167a40] px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(22,122,64,.2)] transition hover:bg-[#106332]">
                <MessageCircle size={20} fill="currentColor" aria-hidden="true" /> Consultar carrito por WhatsApp
              </a>
              <p className="mt-3 text-center text-[0.65rem] font-semibold leading-4 text-ink/48">No es una compra automática. Te confirmaremos stock, entrega y precio final.</p>
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-7 text-center">
            <div>
              <span className="mx-auto grid size-20 place-items-center rounded-full bg-cream text-clay"><ShoppingBag size={34} aria-hidden="true" /></span>
              <h3 className="font-display mt-5 text-2xl">Tu carrito está vacío</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/55">Agregá varios productos y después envianos toda la lista por WhatsApp.</p>
              <Link href="/productos" onClick={closeCart} className="focus-ring mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-ink px-6 text-sm font-extrabold text-white">Ver productos</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
