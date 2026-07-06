type Tone = "copper" | "sage" | "neutral";

const tones: Record<Tone, string> = {
  copper: "bg-copper/10 text-copper-deep",
  sage: "bg-sage/15 text-ink/70",
  neutral: "bg-line/60 text-muted",
};

export default function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
