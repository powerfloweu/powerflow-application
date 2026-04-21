"use client";

// Client component — handles generating a unique client_reference_id before
// redirecting to the Stripe bundle payment link.

const STRIPE_BUNDLE_LINK = "https://buy.stripe.com/placeholder_bundle";

export function BundleCta() {
  const handleClick = () => {
    const ref = `pfbundle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const url = new URL(STRIPE_BUNDLE_LINK);
    url.searchParams.set("client_reference_id", ref);
    window.location.href = url.toString();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-full bg-purple-500 px-8 py-3 font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400 group-hover:bg-purple-400"
    >
      Get all three · €49
    </button>
  );
}
