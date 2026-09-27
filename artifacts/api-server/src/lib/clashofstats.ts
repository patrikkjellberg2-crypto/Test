const BASE_URL = "https://www.clashofstats.com";

type HistoryEntry = { start: string | null; end: string | null; clan: string | null };

function clean(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#39;/g, "'").replace(/&quot;/gi, '"').replace(/\s+/g, " ").trim();
}

function extractDates(html: string): Array<{ start: string | null; end: string | null }> {
  const starts = [...html.matchAll(/<span[^>]*class=["'][^"']*\bstart\b[^"']*\bdate\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)].map((m) => clean(m[1]));
  const ends = [...html.matchAll(/<span[^>]*class=["'][^"']*\bend\b[^"']*\bdate\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)].map((m) => clean(m[1]));
  const count = Math.max(starts.length, ends.length);
  return Array.from({ length: count }, (_, i) => ({ start: starts[i] ?? null, end: ends[i] ?? null }));
}

function extractClanNames(html: string): string[] {
  const matches = [
    ...html.matchAll(/<div[^>]*class=["'][^"']*v-list-item__title[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi),
    ...html.matchAll(/<a[^>]*href=["'][^"']*\/clans\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi),
  ];
  return matches.map((m) => clean(m[1])).filter(Boolean);
}

export async function fetchClashOfStatsHistory(playerTag: string): Promise<{ source: "clashofstats"; available: boolean; url: string; status: number | null; entries: HistoryEntry[] }> {
  const normalized = playerTag.replace(/^#/, "").toUpperCase();
  const url = `${BASE_URL}/players/${encodeURIComponent(normalized)}/history/log`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "ClashIQ/TEST" },
      signal: controller.signal,
    });
    if (!response.ok) return { source: "clashofstats", available: false, url, status: response.status, entries: [] };
    const html = await response.text();
    const dates = extractDates(html);
    const clans = extractClanNames(html);
    return { source: "clashofstats", available: dates.length > 0 || clans.length > 0, url, status: response.status, entries: dates.map((date, index) => ({ ...date, clan: clans[index] ?? null })) };
  } catch {
    return { source: "clashofstats", available: false, url, status: null, entries: [] };
  } finally {
    clearTimeout(timer);
  }
}