// DAS norms — fixed cutoffs, no gender split required.

/** Subscale score range boundaries */
export const SUBSCALE_NORMAL_MIN = -5;
export const SUBSCALE_NORMAL_MAX = 5;

/** Total score flag threshold */
export const DEPRESSION_PRONE_THRESHOLD = 18;

/** Labels for each subscale in all three languages */
export const SUBSCALE_LABELS: {
  en: Record<string, string>;
  hu: Record<string, string>;
  de: Record<string, string>;
} = {
  en: {
    externalApproval: "External Approval",
    lovability:       "Lovability",
    achievement:      "Achievement",
    perfectionism:    "Perfectionism",
    entitlement:      "Entitlement",
    omnipotence:      "Omnipotence",
    externalControl:  "Ext. Control / Autonomy",
  },
  hu: {
    externalApproval: "Külső megerősítés",
    lovability:       "Szerethetőség",
    achievement:      "Teljesítményigény",
    perfectionism:    "Perfekcionizmus",
    entitlement:      "Jogosultságtudat",
    omnipotence:      "Mindenhatóság",
    externalControl:  "Külső kontroll / Autonómia",
  },
  de: {
    externalApproval: "Externe Anerkennung",
    lovability:       "Liebenswürdigkeit",
    achievement:      "Leistungsstreben",
    perfectionism:    "Perfektionismus",
    entitlement:      "Anspruchsdenken",
    omnipotence:      "Allmacht",
    externalControl:  "Ext. Kontrolle / Autonomie",
  },
};
