import Reveal from "./Reveal";

export default function SectionHeader({
  eyebrow,
  title,
  lede,
  align = "left",
  onDark = false,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  onDark?: boolean;
}) {
  const alignCls = align === "center" ? "text-center mx-auto" : "";
  return (
    <Reveal className={`max-w-3xl ${alignCls}`}>
      {eyebrow ? (
        <p
          className={`mb-3 text-sm font-medium uppercase tracking-[0.18em] ${
            onDark ? "text-copper" : "text-copper-deep"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`text-3xl font-semibold tracking-tight text-balance sm:text-4xl ${
          onDark ? "text-surface" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={`mt-4 text-lg leading-relaxed ${
            onDark ? "text-surface/70" : "text-muted"
          }`}
        >
          {lede}
        </p>
      ) : null}
    </Reveal>
  );
}
