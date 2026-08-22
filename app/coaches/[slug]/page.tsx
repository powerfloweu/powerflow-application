/**
 * /coaches/[slug] — public landing page for one coach.
 *
 * An athlete reading the roster at /coaches taps through to here to decide
 * whether to apply. A server component so each page is statically generated
 * with its own title and description — this is the page search engines and
 * link previews see, and the roster page has neither.
 *
 * All content comes from lib/coaches.ts. The interactive chrome (theme
 * toggle, lightbox) lives in the client component below it.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VISIBLE_COACHES, coachBySlug } from "@/lib/coaches";
import CoachLanding from "./CoachLanding";

export function generateStaticParams() {
  // Hidden coaches get no page at all — coachBySlug also refuses them, so an
  // old URL 404s rather than staying quietly reachable.
  return VISIBLE_COACHES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const coach = coachBySlug((await params).slug);
  if (!coach) return { title: "Coach not found — PowerFlow" };

  return {
    title: `${coach.name} — ${coach.title} | PowerFlow`,
    description: coach.bio.slice(0, 200),
    openGraph: {
      title: `${coach.name} — PowerFlow`,
      description: coach.bio.slice(0, 200),
      images: coach.photo ? [{ url: coach.photo }] : undefined,
    },
  };
}

export default async function CoachPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const coach = coachBySlug((await params).slug);
  if (!coach) notFound();
  return <CoachLanding coach={coach} />;
}
