"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ProductImage } from "@/types";

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const gallery = images.length ? images : [{ image_url: "/products/placeholder.svg", position: 0 }];
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (expanded && !dialog.open) dialog.showModal();
    if (!expanded && dialog.open) dialog.close();
  }, [expanded]);

  const showPrevious = () => {
    setActive((current) => (current - 1 + gallery.length) % gallery.length);
  };

  const showNext = () => {
    setActive((current) => (current + 1) % gallery.length);
  };

  const activeImage = gallery[active]?.image_url || "/products/placeholder.svg";

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[5.25rem_1fr] sm:items-start">
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:grid sm:overflow-visible">
          {gallery.map((image, index) => (
            <button
              key={`${image.image_url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`focus-ring relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-cream transition ${active === index ? "border-clay" : "border-transparent"}`}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              aria-pressed={active === index}
            >
              <Image src={image.image_url} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
        </div>

        <div className="order-1 sm:order-2">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="focus-ring group relative block aspect-square w-full overflow-hidden rounded-[1.7rem] bg-cream"
            aria-label={`Ampliar imagen ${active + 1} de ${productName}`}
            aria-haspopup="dialog"
          >
            <Image
              src={activeImage}
              alt={`${productName}, imagen ${active + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain transition duration-300 group-hover:scale-[1.015]"
              loading="eager"
            />
          </button>
          <p className="mt-2 flex items-center justify-center gap-2 text-xs font-extrabold text-ink/55">
            <Maximize2 size={15} aria-hidden="true" /> Tocá la imagen para ampliar
          </p>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setExpanded(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setExpanded(false);
        }}
        className="m-auto h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-7xl overflow-hidden rounded-[1.4rem] border-0 bg-[#1a1412] p-0 text-white shadow-2xl backdrop:bg-black/85 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)]"
        aria-labelledby="expanded-product-image-title"
      >
        <div className="relative h-full w-full">
          <h2 id="expanded-product-image-title" className="sr-only">Vista ampliada de {productName}</h2>
          <Image
            src={activeImage}
            alt={`${productName}, vista ampliada ${active + 1}`}
            fill
            sizes="100vw"
            className="object-contain p-3 sm:p-8"
          />

          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="focus-ring absolute right-3 top-3 z-10 grid size-12 place-items-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm sm:right-5 sm:top-5"
            aria-label="Cerrar imagen ampliada"
          >
            <X size={24} aria-hidden="true" />
          </button>

          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="focus-ring absolute left-3 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm sm:left-5"
                aria-label="Ver imagen anterior"
              >
                <ChevronLeft size={26} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="focus-ring absolute right-3 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm sm:right-5"
                aria-label="Ver imagen siguiente"
              >
                <ChevronRight size={26} aria-hidden="true" />
              </button>
            </>
          ) : null}

          <p className="absolute bottom-3 left-1/2 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 truncate rounded-full bg-black/65 px-4 py-2 text-center text-xs font-bold text-white backdrop-blur-sm sm:bottom-5 sm:text-sm">
            {productName} · {active + 1} de {gallery.length}
          </p>
        </div>
      </dialog>
    </>
  );
}
