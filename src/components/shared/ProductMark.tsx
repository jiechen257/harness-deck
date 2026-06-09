import { Cable, Command, ShieldCheck } from "lucide-react";

export function ProductMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "product-mark compact" : "product-mark"} aria-hidden="true">
      <Command className="product-mark-core" size={28} />
      <span className="product-mark-badge shield">
        <ShieldCheck size={13} />
      </span>
      {compact ? null : (
        <span className="product-mark-badge cable">
          <Cable size={13} />
        </span>
      )}
    </div>
  );
}
