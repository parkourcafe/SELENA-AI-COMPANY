import Link from "next/link";

type Variant = "primary" | "secondary" | "onDark";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-medium transition-colors duration-200";

const variants: Record<Variant, string> = {
  primary: "bg-copper text-surface hover:bg-copper-deep",
  secondary:
    "border border-line bg-surface text-ink hover:border-copper hover:text-copper-deep",
  onDark: "bg-surface text-ink hover:bg-ivory",
};

type ButtonProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
} & (
  | { href: string; type?: never; disabled?: never }
  | { href?: never; type?: "submit" | "button"; disabled?: boolean }
);

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", disabled } = rest as {
    type?: "submit" | "button";
    disabled?: boolean;
  };
  return (
    <button type={type} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
