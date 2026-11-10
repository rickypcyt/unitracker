const STORAGE_KEY = 'unitracker_referral';

const TRACKED_PARAMS = [
  'ref',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export interface ReferralInfo {
  ref?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  captured_at: string;
}

/**
 * Reads ref/utm params from the current URL. When present, stores them in
 * localStorage (first-touch wins) and removes them from the address bar.
 * Returns the captured info, or null when the URL had no tracked params.
 */
export function captureReferralParams(): ReferralInfo | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const key of TRACKED_PARAMS) {
      const value = params.get(key);
      if (value) found[key] = value.slice(0, 120);
    }
    if (Object.keys(found).length === 0) return null;

    const info: ReferralInfo = { ...found, captured_at: new Date().toISOString() };
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    }

    // Clean only the params we consumed — leave ?code=, ?lang=, etc. alone
    TRACKED_PARAMS.forEach((key) => params.delete(key));
    const qs = params.toString();
    const cleanUrl = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);

    return info;
  } catch {
    return null;
  }
}

export function getStoredReferral(): ReferralInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReferralInfo) : null;
  } catch {
    return null;
  }
}
