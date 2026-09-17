export interface TimeZoneOption {
  id: string;
  label: string;
  abbr: string;
  offset: string;
  city: string;
  session?: string;
}

export const TIMEZONE_OPTIONS: TimeZoneOption[] = [
  { id: 'Asia/Jakarta', label: 'WIB - Indonesia Barat (Jakarta / Surabaya)', abbr: 'WIB', offset: 'UTC+7', city: 'Jakarta', session: 'Asia' },
  { id: 'Asia/Makassar', label: 'WITA - Indonesia Tengah (Makassar / Bali)', abbr: 'WITA', offset: 'UTC+8', city: 'Makassar', session: 'Asia' },
  { id: 'Asia/Jayapura', label: 'WIT - Indonesia Timur (Jayapura / Papua)', abbr: 'WIT', offset: 'UTC+9', city: 'Jayapura', session: 'Asia' },
  { id: 'UTC', label: 'UTC - Coordinated Universal Time', abbr: 'UTC', offset: 'UTC+0', city: 'Global', session: 'Global' },
  { id: 'America/New_York', label: 'EST/EDT - New York (Wall Street Session)', abbr: 'EST', offset: 'UTC-5', city: 'New York', session: 'New York' },
  { id: 'Europe/London', label: 'GMT/BST - London (BOE / London Session)', abbr: 'GMT', offset: 'UTC+0', city: 'London', session: 'London' },
  { id: 'Europe/Frankfurt', label: 'CET/CEST - Frankfurt (ECB / Frankfurt Session)', abbr: 'CET', offset: 'UTC+1', city: 'Frankfurt', session: 'Europe' },
  { id: 'Asia/Tokyo', label: 'JST - Tokyo (BOJ / Tokyo Session)', abbr: 'JST', offset: 'UTC+9', city: 'Tokyo', session: 'Tokyo' },
  { id: 'Asia/Singapore', label: 'SGT - Singapore (Asian Financial Hub)', abbr: 'SGT', offset: 'UTC+8', city: 'Singapore', session: 'Asia' },
  { id: 'Australia/Sydney', label: 'AEST/AEDT - Sydney (Sydney Session)', abbr: 'AEST', offset: 'UTC+10', city: 'Sydney', session: 'Sydney' },
  { id: 'LOCAL', label: 'Deteksi Otomatis (Browser / System Timezone)', abbr: 'LOKAL', offset: 'Auto', city: 'System' }
];

const LOCAL_STORAGE_KEY = 'mountalgo_user_timezone';

export function getStoredTimezone(): string {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) return saved;
  } catch (e) {
    // Ignore SSR or storage errors
  }
  return 'Asia/Jakarta'; // Default to Jakarta / WIB
}

export function setStoredTimezone(tzId: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, tzId);
    window.dispatchEvent(new CustomEvent('mountalgo_timezone_changed', { detail: tzId }));
  } catch (e) {
    console.error('Failed to set stored timezone:', e);
  }
}

export function getDynamicTimezoneOffset(tzId: string, date = new Date()): string {
  if (tzId === 'LOCAL') return 'Auto';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      return tzPart.value.replace('GMT', 'UTC');
    }
  } catch (e) {
    // Ignore fallback
  }
  return 'UTC';
}

export function getTimezoneMeta(tzId: string, date = new Date()): TimeZoneOption {
  const found = TIMEZONE_OPTIONS.find(t => t.id === tzId);
  const dynamicOffset = getDynamicTimezoneOffset(tzId, date);

  if (found) {
    return {
      ...found,
      offset: dynamicOffset !== 'Auto' ? dynamicOffset : found.offset
    };
  }

  if (tzId === 'LOCAL') {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'WIB';
    return {
      id: 'LOCAL',
      label: `Lokal (${localTz})`,
      abbr: 'LOKAL',
      offset: 'Auto',
      city: 'System'
    };
  }

  return {
    id: tzId,
    label: tzId,
    abbr: tzId.split('/')[1] || tzId,
    offset: dynamicOffset,
    city: tzId.split('/')[1] || tzId
  };
}

export function formatTimeInTimezone(
  timestamp: number | Date,
  tzId: string = getStoredTimezone()
): {
  timeStr: string;
  timeWithSecsStr: string;
  dateStr: string;
  tzAbbr: string;
  tzOffset: string;
  fullStr: string;
} {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const targetTz = tzId === 'LOCAL' ? undefined : tzId;
  const meta = getTimezoneMeta(tzId);

  let timeStr = '00:00';
  let timeWithSecsStr = '00:00:00';
  let dateStr = '';

  try {
    const rawTime = d.toLocaleTimeString('id-ID', {
      timeZone: targetTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\./g, ':');

    const rawTimeSecs = d.toLocaleTimeString('id-ID', {
      timeZone: targetTz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\./g, ':');

    timeStr = rawTime;
    timeWithSecsStr = rawTimeSecs;

    dateStr = d.toLocaleDateString('id-ID', {
      timeZone: targetTz,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    timeWithSecsStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    dateStr = d.toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return {
    timeStr,
    timeWithSecsStr,
    dateStr,
    tzAbbr: meta.abbr,
    tzOffset: meta.offset,
    fullStr: `${dateStr}, ${timeStr} ${meta.abbr}`
  };
}
