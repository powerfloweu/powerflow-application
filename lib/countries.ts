/**
 * Country list shared by the public forms.
 *
 * Every entry carries an IANA zone, because the seminar page uses the country
 * a visitor picks to tell them what time the session starts where they are.
 * Countries spanning several zones are split by region rather than given one
 * wrong answer.
 */

/**
 * The country field exists to tell people what time the seminar starts where
 * they are, so every entry carries an IANA zone. Countries spanning several
 * zones are split by region rather than given one wrong answer.
 */
export interface SeminarCountry {
  id: string;
  label: string;
  tz: string;
}

export const COUNTRIES: readonly SeminarCountry[] = [
  // Europe
  { id: "AL", label: "Albania",            tz: "Europe/Tirane" },
  { id: "AT", label: "Austria",            tz: "Europe/Vienna" },
  { id: "BE", label: "Belgium",            tz: "Europe/Brussels" },
  { id: "BA", label: "Bosnia & Herzegovina", tz: "Europe/Sarajevo" },
  { id: "BG", label: "Bulgaria",           tz: "Europe/Sofia" },
  { id: "HR", label: "Croatia",            tz: "Europe/Zagreb" },
  { id: "CY", label: "Cyprus",             tz: "Asia/Nicosia" },
  { id: "CZ", label: "Czechia",            tz: "Europe/Prague" },
  { id: "DK", label: "Denmark",            tz: "Europe/Copenhagen" },
  { id: "EE", label: "Estonia",            tz: "Europe/Tallinn" },
  { id: "FI", label: "Finland",            tz: "Europe/Helsinki" },
  { id: "FR", label: "France",             tz: "Europe/Paris" },
  { id: "DE", label: "Germany",            tz: "Europe/Berlin" },
  { id: "GR", label: "Greece",             tz: "Europe/Athens" },
  { id: "HU", label: "Hungary",            tz: "Europe/Budapest" },
  { id: "IS", label: "Iceland",            tz: "Atlantic/Reykjavik" },
  { id: "IE", label: "Ireland",            tz: "Europe/Dublin" },
  { id: "IT", label: "Italy",              tz: "Europe/Rome" },
  { id: "LV", label: "Latvia",             tz: "Europe/Riga" },
  { id: "LT", label: "Lithuania",          tz: "Europe/Vilnius" },
  { id: "LU", label: "Luxembourg",         tz: "Europe/Luxembourg" },
  { id: "MT", label: "Malta",              tz: "Europe/Malta" },
  { id: "MD", label: "Moldova",            tz: "Europe/Chisinau" },
  { id: "ME", label: "Montenegro",         tz: "Europe/Podgorica" },
  { id: "NL", label: "Netherlands",        tz: "Europe/Amsterdam" },
  { id: "MK", label: "North Macedonia",    tz: "Europe/Skopje" },
  { id: "NO", label: "Norway",             tz: "Europe/Oslo" },
  { id: "PL", label: "Poland",             tz: "Europe/Warsaw" },
  { id: "PT", label: "Portugal",           tz: "Europe/Lisbon" },
  { id: "RO", label: "Romania",            tz: "Europe/Bucharest" },
  { id: "RS", label: "Serbia",             tz: "Europe/Belgrade" },
  { id: "SK", label: "Slovakia",           tz: "Europe/Bratislava" },
  { id: "SI", label: "Slovenia",           tz: "Europe/Ljubljana" },
  { id: "ES", label: "Spain",              tz: "Europe/Madrid" },
  { id: "SE", label: "Sweden",             tz: "Europe/Stockholm" },
  { id: "CH", label: "Switzerland",        tz: "Europe/Zurich" },
  { id: "TR", label: "Türkiye",            tz: "Europe/Istanbul" },
  { id: "UA", label: "Ukraine",            tz: "Europe/Kyiv" },
  { id: "GB", label: "United Kingdom",     tz: "Europe/London" },
  { id: "RU", label: "Russia — Moscow",    tz: "Europe/Moscow" },
  // Americas
  { id: "CA-PT", label: "Canada — Pacific",  tz: "America/Vancouver" },
  { id: "CA-MT", label: "Canada — Mountain", tz: "America/Edmonton" },
  { id: "CA-CT", label: "Canada — Central",  tz: "America/Winnipeg" },
  { id: "CA-ET", label: "Canada — Eastern",  tz: "America/Toronto" },
  { id: "CA-AT", label: "Canada — Atlantic", tz: "America/Halifax" },
  { id: "US-PT", label: "United States — Pacific",  tz: "America/Los_Angeles" },
  { id: "US-MT", label: "United States — Mountain", tz: "America/Denver" },
  { id: "US-CT", label: "United States — Central",  tz: "America/Chicago" },
  { id: "US-ET", label: "United States — Eastern",  tz: "America/New_York" },
  { id: "MX", label: "Mexico",             tz: "America/Mexico_City" },
  { id: "BR", label: "Brazil",             tz: "America/Sao_Paulo" },
  { id: "AR", label: "Argentina",          tz: "America/Argentina/Buenos_Aires" },
  { id: "CL", label: "Chile",              tz: "America/Santiago" },
  { id: "CO", label: "Colombia",           tz: "America/Bogota" },
  // Africa & Middle East
  { id: "EG", label: "Egypt",              tz: "Africa/Cairo" },
  { id: "IL", label: "Israel",             tz: "Asia/Jerusalem" },
  { id: "KE", label: "Kenya",              tz: "Africa/Nairobi" },
  { id: "MA", label: "Morocco",            tz: "Africa/Casablanca" },
  { id: "NG", label: "Nigeria",            tz: "Africa/Lagos" },
  { id: "SA", label: "Saudi Arabia",       tz: "Asia/Riyadh" },
  { id: "ZA", label: "South Africa",       tz: "Africa/Johannesburg" },
  { id: "AE", label: "United Arab Emirates", tz: "Asia/Dubai" },
  // Asia & Pacific
  { id: "AU-WA", label: "Australia — Perth",    tz: "Australia/Perth" },
  { id: "AU-SA", label: "Australia — Adelaide", tz: "Australia/Adelaide" },
  { id: "AU-QL", label: "Australia — Brisbane", tz: "Australia/Brisbane" },
  { id: "AU-NS", label: "Australia — Sydney / Melbourne", tz: "Australia/Sydney" },
  { id: "CN", label: "China",              tz: "Asia/Shanghai" },
  { id: "HK", label: "Hong Kong",          tz: "Asia/Hong_Kong" },
  { id: "IN", label: "India",              tz: "Asia/Kolkata" },
  { id: "ID", label: "Indonesia",          tz: "Asia/Jakarta" },
  { id: "JP", label: "Japan",              tz: "Asia/Tokyo" },
  { id: "KZ", label: "Kazakhstan",         tz: "Asia/Almaty" },
  { id: "NZ", label: "New Zealand",        tz: "Pacific/Auckland" },
  { id: "PH", label: "Philippines",        tz: "Asia/Manila" },
  { id: "SG", label: "Singapore",          tz: "Asia/Singapore" },
  { id: "KR", label: "South Korea",        tz: "Asia/Seoul" },
  { id: "TH", label: "Thailand",           tz: "Asia/Bangkok" },
] as const;

export const COUNTRY_IDS = COUNTRIES.map((c) => c.id) as readonly string[];

export function countryLabel(id: string | null): string {
  if (!id) return "—";
  return COUNTRIES.find((c) => c.id === id)?.label ?? id;
}

export function zoneForCountry(id: string | null): string | null {
  if (!id) return null;
  return COUNTRIES.find((c) => c.id === id)?.tz ?? null;
}

/**
 * Best country match for a browser-reported IANA zone, so the field can be
 * pre-filled instead of asking someone to hunt for their own country.
 * Returns null when the zone is not one we list — never a wrong guess.
 */
export function countryForZone(tz: string | null | undefined): string | null {
  if (!tz) return null;
  return COUNTRIES.find((c) => c.tz === tz)?.id ?? null;
}

/**
 * An instant rendered on `tz`'s wall clock, e.g. "09:00". Returns null for an
 * unknown zone rather than silently falling back to some other time, which
 * would be worse than showing nothing.
 */
export function timeIn(tz: string | null, startsAt: string): string | null {
  if (!tz) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(startsAt));
  } catch {
    return null;
  }
}

/** Same instant, same zone — but the date, which can differ across the line. */
export function dateIn(tz: string | null, startsAt: string): string | null {
  if (!tz) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, weekday: "long", day: "numeric", month: "long",
    }).format(new Date(startsAt));
  } catch {
    return null;
  }
}

