export default function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-6 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
