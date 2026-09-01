type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, description, align = "left" }: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-clay">{eyebrow}</p> : null}
      <h2 className="font-display text-balance text-3xl leading-[1.08] tracking-[-0.02em] text-ink sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-sm leading-6 text-ink/62 sm:text-base">{description}</p> : null}
    </div>
  );
}
