/**
 * Pure helpers for war-archive logic — no DB, no network, no side effects.
 * Kept in their own module so they can be unit tested in isolation (see
 * war-archive-pure.test.ts) without needing a live Postgres connection.
 */

export type Dict = Record<string, any>;

export const str = (v: unknown) => (typeof v === "string" ? v : "");

export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function normalizeTag(tag: string) {
  const value = str(tag).trim().toUpperCase().replace(/\s+/g, "");
  return value.startsWith("#") ? value : `#${value}`;
}

export function warKey(clanTag: string, opponentTag: string, endTime: string) {
  return `${normalizeTag(clanTag)}__${normalizeTag(opponentTag)}__${str(endTime)}`;
}

export function outcomeOf(war: Dict): "win" | "lose" | "tie" | null {
  const explicit = str(war?.result).trim().toLowerCase();
  if (explicit === "win" || explicit === "won" || explicit === "victory") return "win";
  if (explicit === "lose" || explicit === "lost" || explicit === "loss" || explicit === "defeat") return "lose";
  if (explicit === "tie" || explicit === "draw" || explicit === "tied") return "tie";

  const clan = war?.clan && typeof war.clan === "object" ? (war.clan as Dict) : null;
  const opponent = war?.opponent && typeof war.opponent === "object" ? (war.opponent as Dict) : null;
  if (!clan || !opponent) return null;

  const clanStars = num(clan.stars);
  const opponentStars = num(opponent.stars);
  if (clanStars > opponentStars) return "win";
  if (clanStars < opponentStars) return "lose";

  const clanDestruction = num(clan.destructionPercentage);
  const opponentDestruction = num(opponent.destructionPercentage);
  if (clanDestruction > opponentDestruction) return "win";
  if (clanDestruction < opponentDestruction) return "lose";
  return "tie";
}
