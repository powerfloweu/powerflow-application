/**
 * Encoding object paths for Supabase Storage URLs.
 *
 * encodeURIComponent() is the obvious choice and the wrong one: it escapes the
 * "/" separators too, so "coach/note.webm" becomes "coach%2Fnote.webm". Signing
 * still succeeds, and the signed URL it hands back then fails on fetch with
 * 400 InvalidSignature — a failure that only shows up for paths with more than
 * one segment, which in practice is all of them.
 *
 * Encode each segment, keep the separators.
 */
export function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .filter((seg) => seg.length > 0)
    .map(encodeURIComponent)
    .join("/");
}
