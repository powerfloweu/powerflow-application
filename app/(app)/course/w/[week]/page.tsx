"use client";

/**
 * Legacy week-number route — redirects to the new slug-based module route.
 *
 * Old URL: /course/w/5
 * New URL: /course/m/w05-arousal-control
 */

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { COURSE_MODULES } from "@/lib/course";

export default function WeekRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const weekNum = Number(params.week);
    const mod = COURSE_MODULES.find((m) => m.weekNumber === weekNum);
    if (mod) {
      router.replace(`/course/m/${mod.slug}`);
    } else {
      router.replace("/course");
    }
  }, [params.week, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
    </div>
  );
}
