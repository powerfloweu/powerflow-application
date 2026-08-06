/**
 * Duplicate-account detection for the admin Users tab.
 *
 * Read-only, display-only signal — this module never merges, edits, or
 * deletes anything. It just groups already-fetched profiles that *look*
 * like the same person so an admin can review them manually.
 */

export type DuplicateSignal = "name" | "email";

export type DuplicateProfile = {
  id: string;
  display_name: string;
  email?: string | null;
};

export type DuplicateGroup = {
  /** Normalised value the group was matched on. */
  key: string;
  signal: DuplicateSignal;
  ids: string[];
};

export type DuplicateInfo = {
  signals: DuplicateSignal[];
  /** Size of the largest group this profile belongs to (name or email). */
  groupSize: number;
};

/**
 * Normalise a display name for comparison: strip diacritics, collapse
 * internal whitespace, trim, lowercase. "Dávid" and "  david " both
 * normalise to "david".
 */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Normalise the local-part of an email address (the bit before "@") for
 * comparison: lowercase, diacritics stripped. Two identical full email
 * addresses always share a local-part, so this single key catches both
 * "same local-part" and "identical email" matches.
 */
export function normalizeEmailLocalPart(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  const at = trimmed.indexOf("@");
  const local = at === -1 ? trimmed : trimmed.slice(0, at);
  const normalized = local.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  return normalized || null;
}

/**
 * Group profiles that share a normalised display name or email local-part.
 * Only groups with 2+ members are returned. Name and email matches are
 * reported as separate groups so callers can distinguish the two signals.
 */
export function findDuplicateGroups<T extends DuplicateProfile>(
  profiles: T[],
): DuplicateGroup[] {
  const nameMap = new Map<string, string[]>();
  const emailMap = new Map<string, string[]>();

  for (const p of profiles) {
    const nameKey = normalizeName(p.display_name ?? "");
    if (nameKey) {
      const arr = nameMap.get(nameKey);
      if (arr) arr.push(p.id);
      else nameMap.set(nameKey, [p.id]);
    }

    if (p.email) {
      const emailKey = normalizeEmailLocalPart(p.email);
      if (emailKey) {
        const arr = emailMap.get(emailKey);
        if (arr) arr.push(p.id);
        else emailMap.set(emailKey, [p.id]);
      }
    }
  }

  const groups: DuplicateGroup[] = [];
  for (const [key, ids] of nameMap) {
    if (ids.length >= 2) groups.push({ key, signal: "name", ids });
  }
  for (const [key, ids] of emailMap) {
    if (ids.length >= 2) groups.push({ key, signal: "email", ids });
  }
  return groups;
}

/**
 * Build a per-profile-id lookup of duplicate info, for cheap rendering of
 * a badge on each row without re-scanning the group list per row.
 */
export function indexDuplicates<T extends DuplicateProfile>(
  profiles: T[],
): Map<string, DuplicateInfo> {
  const groups = findDuplicateGroups(profiles);
  const index = new Map<string, DuplicateInfo>();

  for (const group of groups) {
    for (const id of group.ids) {
      const existing = index.get(id);
      if (existing) {
        if (!existing.signals.includes(group.signal)) existing.signals.push(group.signal);
        existing.groupSize = Math.max(existing.groupSize, group.ids.length);
      } else {
        index.set(id, { signals: [group.signal], groupSize: group.ids.length });
      }
    }
  }

  return index;
}
