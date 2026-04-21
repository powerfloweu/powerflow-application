import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { isConfigured, dbPatch } from "../../../../lib/supabaseAdmin";

// Verifies a Stripe Checkout Session on the server using our secret key.
// Called by the results page when the browser arrives with ?session_id=cs_...
// appended by Stripe's Payment Link success URL.
//
// Env vars (set in .env.local):
//   STRIPE_SECRET_KEY  — sk_live_… (or sk_test_…). Server-only; NEVER prefix NEXT_PUBLIC_.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json(
      { paid: false, error: "Missing or malformed session_id" },
      { status: 400 }
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error("[verify-session] STRIPE_SECRET_KEY is not set");
    return NextResponse.json(
      { paid: false, error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    const clientReferenceId = session.client_reference_id ?? null;

    if (paid && clientReferenceId && isConfigured()) {
      // Route to the correct table based on result_ref prefix:
      //   pfbundle_ → bundle purchase, no single DB row to update (handled client-side)
      //   pfac_     → acsi_results
      //   pfcs_     → csai_results
      //   pfsa_ / * → sat_results
      if (!clientReferenceId.startsWith("pfbundle_")) {
        const table = clientReferenceId.startsWith("pfac_")
          ? "acsi_results"
          : clientReferenceId.startsWith("pfcs_")
          ? "csai_results"
          : clientReferenceId.startsWith("pfdas_")
          ? "das_results"
          : "sat_results";
        await dbPatch(table, { result_ref: clientReferenceId }, {
          paid: true,
          stripe_session_id: sessionId,
        });
      }
    }

    return NextResponse.json({
      paid,
      email: session.customer_details?.email ?? null,
      clientReferenceId,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error("[verify-session] Stripe error", err);
    return NextResponse.json(
      { paid: false, error: "Could not verify session" },
      { status: 502 }
    );
  }
}
