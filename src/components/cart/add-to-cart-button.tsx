"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import type { CartProduct } from "@/types";

type Props = {
  product: CartProduct;
  compact?: boolean;
  openAfterAdd?: boolean;
  disabled?: boolean;
};

export function AddToCartButton({ product, compact = false, openAfterAdd = false, disabled = false }: Props) {
  const { addItem, getQuantity, openCart } = useCart();
  const quantity = getQuantity(product.id);

  const handleAdd = () => {
    addItem(product);
    if (openAfterAdd) openCart();
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className="focus-ring relative grid size-10 place-items-center rounded-xl bg-clay text-white transition hover:bg-clay-dark disabled:cursor-not-allowed disabled:bg-ink/18"
        aria-label={disabled ? `${product.name} no está disponible para agregar` : `Agregar ${product.name} al carrito`}
        title={disabled ? "No disponible" : "Agregar al carrito"}
      >
        {quantity ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <ShoppingCart size={17} aria-hidden="true" />}
        {quantity ? <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.58rem] font-black text-white">{quantity}</span> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled}
      className="focus-ring inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-clay px-6 text-base font-extrabold text-white shadow-[0_12px_30px_rgba(173,63,36,.22)] transition hover:bg-clay-dark disabled:cursor-not-allowed disabled:bg-ink/18 disabled:shadow-none"
    >
      {quantity ? <Check size={21} strokeWidth={3} aria-hidden="true" /> : <ShoppingCart size={21} aria-hidden="true" />}
      {disabled ? "No disponible" : quantity ? `Agregar otro · ${quantity} en el carrito` : "Agregar al carrito"}
    </button>
  );
}
