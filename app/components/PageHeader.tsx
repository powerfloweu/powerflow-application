import Link from "next/link";

interface Props {
  /** Small eyebrow text e.g. "PowerFlow · Journal" */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** If provided, renders a ← back arrow linking here */
  backHref?: string;
  backLabel?: string;
  /** Slot for action buttons on the right side */
  actions?: React.ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  actions,
}: Props) {
  return (
    <div className="mb-8">
      {/* Back link — shown only on mobile (hidden md+) when backHref provided */}
      {backHref && (
        <Link
          href={backHref}
          className="mb-4 flex items-center gap-1.5 font-saira text-[11px] text-zinc-500 hover:text-zinc-300 transition md:hidden"
        >
          <span aria-hidden>←</span>
          {backLabel}
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 font-saira text-3xl font-extrabold uppercase tracking-[0.12em] sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 font-saira text-sm text-zinc-400 max-w-xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex gap-3 self-start mt-1">{actions}</div>
        )}
      </div>
    </div>
  );
}
