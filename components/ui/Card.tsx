import { cn } from "@/lib/cn";

/**
 * Premium tactile card: off-white surface, warm hairline border,
 * soft layered shadow, gentle hover lift.
 */
export function Card({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "card-premium p-6 sm:p-7",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_2px_2px_rgba(24,22,20,0.03),0_20px_44px_-20px_rgba(24,22,20,0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
