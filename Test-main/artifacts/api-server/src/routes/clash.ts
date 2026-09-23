import { Router, type IRouter } from "express";
import {
  GetClashDashboardResponse,
  GetClashDashboardQueryParams,
  GetWarPlannerQueryParams,
  GetWarPlannerResponse,
  UpsertWarPlannerAssignmentBody,
  UpsertWarPlannerAssignmentParams,
  UpsertWarPlannerAssignmentResponse,
} from "@workspace/api-zod";
import { asc, eq } from "drizzle-orm";
import {
  clanSelectionTable,
  db,
  warPlannerAssignmentsTable,
} from "@workspace/db";

const router: IRouter = Router();

const DEFAULT_CLAN_TAG = "#2Q0Q82C9R";
const CLASH_API_BASE_URL =
  process.env.CLASH_API_BASE_URL ??
  "https://cocproxy.royaleapi.dev/v1";
const CLASHKING_API_BASE_URL =
  process.env.CLASHKING_API_BASE_URL ??
  "https://api.clashk.ing";

const CLAN_SELECTION_ID = 1;

type ClashRecord = Record<string, unknown>;

type FetchResult = {
  data: ClashRecord | ClashRecord[] | null;
  failed: boolean;
};

function normalizeClanTag(value: string): string {
  const trimmed = value.trim().toUpperCase();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function isRequestedClan(
  value: ClashRecord | null,
  clanTag: string,
): boolean {
  if (!value) return false;
  const tag = value.tag;
  return (
    typeof tag === "string" &&
    normalizeClanTag(tag) === normalizeClanTag(clanTag)
  );
}

function normalizeAttackerTag(value: string): string {
  const trimmed = value.trim().toUpperCase();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function normalizeWarState(
  war: ClashRecord,
  clanTag: string,
): string {
  const direct = String(
    war.state ?? war.result ?? "",
  )
    .trim()
    .toLowerCase();

  const directMap: Record<string, string> = {
    won: "won",
    win: "won",
    victory: "won",
    lost: "lost",
    lose: "lost",
    loss: "lost",
    defeat: "lost",
    draw: "draw",
    tied: "draw",
  };

  const clan =
    war.clan && typeof war.clan === "object"
      ? (war.clan as ClashRecord)
      : null;
  const opponent =
    war.opponent && typeof war.opponent === "object"
      ? (war.opponent as ClashRecord)
      : null;

  const clanTagNormalized = normalizeClanTag(clanTag);
  const ourSide =
    clan && normalizeClanTag(String(clan.tag ?? "")) === clanTagNormalized
      ? clan
      : opponent &&
          normalizeClanTag(String(opponent.tag ?? "")) === clanTagNormalized
        ? opponent
        : null;
  const otherSide =
    ourSide === clan
      ? opponent
      : ourSide === opponent
        ? clan
        : null;

  // `war.result` can be relative to the API's first side. If our clan is the
  // opponent side, invert that result instead of displaying the wrong winner.
  if (directMap[direct]) {
    if (ourSide === clan) return directMap[direct];
    if (ourSide === opponent) {
      const result = directMap[direct];
      return result === "won"
        ? "lost"
        : result === "lost"
          ? "won"
          : result;
    }
  }

  const sideResult = String(
    ourSide?.result ?? "",
  )
    .trim()
    .toLowerCase();

  if (directMap[sideResult]) {
    return directMap[sideResult];
  }

  const ended =
    Boolean(war.endTime) ||
    ["warended", "ended", "complete", "completed"].includes(direct);

  if (!ended || !ourSide || !otherSide) {
    return "unknown";
  }

  const ourStars = Number(ourSide.stars ?? 0);
  const otherStars = Number(otherSide.stars ?? 0);

  if (ourStars > otherStars) return "won";
  if (ourStars < otherStars) return "lost";

  const ourDestruction = Number(
    ourSide.destructionPercentage ?? 0,
  );
  const otherDestruction = Number(
    otherSide.destructionPercentage ?? 0,
  );

  if (ourDestruction > otherDestruction) return "won";
  if (ourDestruction < otherDestruction) return "lost";

  return "draw";
}

function normalizeWarLog(
  wars: ClashRecord[],
  clanTag: string,
): ClashRecord[] {
  return wars.map((war) => ({
    ...war,
    state: normalizeWarState(war, clanTag),
  }));
}

function listItems(
  value: ClashRecord | ClashRecord[] | null,
): ClashRecord[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is ClashRecord =>
        Boolean(item && typeof item === "object"),
    );
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray(value.items)
  ) {
    return value.items.filter(
      (item): item is ClashRecord =>
        Boolean(item && typeof item === "object"),
    );
  }

  // ClashKing's /war/{clan_tag}/previous endpoint returns a SINGLE
  // ClanWar object, not an array. The previous implementation treated that
  // valid war object as an empty list, which made Recent War Performance say
  // "No verified war data" even though the API had returned a real war.
  // Only treat objects with both war sides as a single war; do not turn normal
  // clan/member objects into list items.
  if (
    value &&
    typeof value === "object" &&
    value.clan &&
    typeof value.clan === "object" &&
    value.opponent &&
    typeof value.opponent === "object"
  ) {
    return [value];
  }

  return [];
}

async function getActiveClanTag(
  requestedTag?: string,
): Promise<string> {
  if (requestedTag) {
    return normalizeClanTag(requestedTag);
  }

  const [selection] = await db
    .select({ clanTag: clanSelectionTable.clanTag })
    .from(clanSelectionTable)
    .where(eq(clanSelectionTable.id, CLAN_SELECTION_ID))
    .limit(1);

  return selection?.clanTag ?? DEFAULT_CLAN_TAG;
}

async function persistActiveClanTag(
  clanTag: string,
): Promise<void> {
  await db
    .insert(clanSelectionTable)
    .values({
      id: CLAN_SELECTION_ID,
      clanTag,
    })
    .onConflictDoUpdate({
      target: clanSelectionTable.id,
      set: {
        clanTag,
        updatedAt: new Date(),
      },
    });
}

async function fetchClashResource(
  path: string,
  signal: AbortSignal,
): Promise<ClashRecord | ClashRecord[] | null> {
  const token = process.env.CLASH_API_TOKEN;

  if (!token) {
    return null;
  }

  const response = await fetch(
    `${CLASH_API_BASE_URL}${path}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Clash API returned ${response.status}`,
    );

    Object.assign(error, {
      status: response.status,
      path,
    });

    throw error;
  }

  return (await response.json()) as
    | ClashRecord
    | ClashRecord[];
}

async function fetchClashKingResource(
  path: string,
  signal: AbortSignal,
): Promise<ClashRecord | ClashRecord[] | null> {
  const response = await fetch(
    `${CLASHKING_API_BASE_URL}${path}`,
    {
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  if (!response.ok) {
    const error = new Error(
      `ClashKing API returned ${response.status}`,
    );
    Object.assign(error, {
      status: response.status,
      path,
    });
    throw error;
  }

  return (await response.json()) as
    | ClashRecord
    | ClashRecord[];
}

async function fetchOptionalClashKingResource(
  path: string,
  fallback: ClashRecord | ClashRecord[] | null,
  log: {
    warn: (obj: object, message: string) => void;
  },
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    10_000,
  );

  try {
    return {
      data: await fetchClashKingResource(
        path,
        controller.signal,
      ),
      failed: false,
    };
  } catch (error) {
    log.warn(
      {
        path,
        status:
          typeof error === "object" &&
          error !== null &&
          "status" in error
            ? error.status
            : undefined,
      },
      "ClashKing API resource unavailable",
    );

    return {
      data: fallback,
      failed: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchOptionalResource(
  path: string,
  fallback: ClashRecord | ClashRecord[] | null,
  log: {
    warn: (obj: object, message: string) => void;
  },
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    10_000,
  );

  try {
    return {
      data: await fetchClashResource(
        path,
        controller.signal,
      ),
      failed: false,
    };
  } catch (error) {
    log.warn(
      {
        path,
        status:
          typeof error === "object" &&
          error !== null &&
          "status" in error
            ? error.status
            : undefined,
      },
      "Clash API resource unavailable",
    );

    return {
      data: fallback,
      failed: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* -------------------------------------------------------------------------- */
/* Legacy clan-cache compatibility                                             */
/* -------------------------------------------------------------------------- */

// Some older ClashIQ frontend builds request /api/clan/:tag/cached directly.
// Keep that endpoint working while the dashboard migrates to /api/clash/dashboard.
router.get(
  "/clan/:tag/cached",
  async (req, res): Promise<void> => {
    const clanTag = normalizeClanTag(req.params.tag);
    const encodedClanTag = encodeURIComponent(clanTag);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        10_000,
      );

      let clan: ClashRecord | ClashRecord[] | null;
      try {
        clan = await fetchClashKingResource(
          `/clan/${encodedClanTag}/basic`,
          controller.signal,
        );
      } finally {
        clearTimeout(timeout);
      }

      if (!clan || Array.isArray(clan)) {
        res.status(404).json({
          error: "Clan not found in ClashKing.",
          code: "CLAN_NOT_FOUND",
        });
        return;
      }

      await persistActiveClanTag(clanTag);
      res.json(clan);
    } catch (error) {
      req.log.error(
        {
          err: error,
          clanTag,
        },
        "Failed to load cached clan from ClashKing",
      );

      res.status(503).json({
        error: "ClashKing is temporarily unavailable.",
        code: "CLASHKING_UNAVAILABLE",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

router.get(
  "/clash/dashboard",
  async (req, res): Promise<void> => {
    const parsedQuery =
      GetClashDashboardQueryParams.safeParse({
        clanTag: req.query.clanTag,
      });

    if (!parsedQuery.success) {
      res.status(400).json({
        error: "Enter a valid Clash clan tag.",
        code: "INVALID_CLAN_TAG",
      });
      return;
    }

    const clanTag = await getActiveClanTag(
      parsedQuery.data.clanTag,
    );

    const encodedClanTag =
      encodeURIComponent(clanTag);

    const [
      basicClanResult,
      clanResult,
      officialClanResult,
      officialMembersResult,
      currentWarResult,
      officialWarlogResult,
      officialCapitalRaidResult,
      clashKingWarlogResult,
    ] = await Promise.all([
      // Use ClashKing's documented clan endpoint as the primary public source.
      // This is more stable than the older /v2/.../cached compatibility route.
      fetchOptionalClashKingResource(
        `/clan/${encodedClanTag}/basic`,
        null,
        req.log,
      ),
      // Keep the richer cached profile as a secondary source.
      fetchOptionalClashKingResource(
        `/v2/clan/${encodedClanTag}/cached`,
        null,
        req.log,
      ),
      // Use the official Supercell clan endpoint for the live roster.
      // ClashKing's cached roster can be incomplete/stale, which previously
      // caused valid clans to appear as 1/50 members.
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}`,
            null,
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      // Fetch the live member list separately. This avoids trusting a stale
      // embedded memberList from a cached clan profile.
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}/members`,
            [],
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      // ClashKing exposes the current-war pointer publicly, but not the
      // complete live war board. Keep Supercell as a temporary live-war
      // fallback until the live board is available through ClashKing.
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}/currentwar`,
            null,
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      // Prefer the official Supercell war log for the requested clan. This
      // endpoint is explicitly clan-scoped, so it is the authoritative source
      // for the Dashboard's Latest War Log. ClashKing remains a fallback.
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}/warlog`,
            [],
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}/capitalraidseasons`,
            [],
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      // Use ClashKing's dedicated previous-war endpoint for historical
      // performance. This is specifically designed for a clan's previous
      // wars and is more reliable for Recent War Performance than the older
      // /v2/.../wars compatibility route.
      fetchOptionalClashKingResource(
        `/war/${encodedClanTag}/previous`,
        [],
        req.log,
      ),
    ]);

    const hasValidBasicClan =
      basicClanResult.data &&
      !Array.isArray(basicClanResult.data);
    const hasValidClashKingClan =
      clanResult.data &&
      !Array.isArray(clanResult.data);
    const hasValidOfficialClan =
      officialClanResult.data &&
      !Array.isArray(officialClanResult.data);

    if (
      !hasValidBasicClan &&
      !hasValidClashKingClan &&
      !hasValidOfficialClan
    ) {
      res.status(503).json({
        error:
          "Could not load the clan from Clash of Clans. Check the clan tag and try again.",
        code: "CLAN_FETCH_FAILED",
      });
      return;
    }

    await persistActiveClanTag(clanTag);

    const rawCurrentWar =
      currentWarResult.data;

    const currentWar =
      rawCurrentWar &&
      !Array.isArray(rawCurrentWar) &&
      [
        "preparation",
        "inWar",
        "matchmaking",
      ].includes(
        typeof rawCurrentWar.state === "string"
          ? rawCurrentWar.state
          : "",
      )
        ? rawCurrentWar
        : null;

    const officialWarlog = normalizeWarLog(
      listItems(officialWarlogResult.data),
      clanTag,
    );
    const clashKingWarlog = normalizeWarLog(
      listItems(clashKingWarlogResult.data),
      clanTag,
    );
    const sourceWarlog =
      officialWarlog.length > 0
        ? officialWarlog
        : clashKingWarlog;

    /*
     * The dashboard is driven by the clan tag the user searched for.
     * ClashKing can return the two sides in either order. Only accept wars
     * where the requested clan is explicitly one of the two sides, and
     * orient the result so war.clan is always the requested clan.
     */
    const requestedTag = normalizeClanTag(clanTag);

    const warlog = sourceWarlog
      .filter((war) => {
        const warClan =
          war.clan && typeof war.clan === "object"
            ? (war.clan as ClashRecord)
            : null;
        const warOpponent =
          war.opponent && typeof war.opponent === "object"
            ? (war.opponent as ClashRecord)
            : null;

        const clanMatches =
          warClan &&
          normalizeClanTag(String(warClan.tag ?? "")) === requestedTag;
        const opponentMatches =
          warOpponent &&
          normalizeClanTag(String(warOpponent.tag ?? "")) === requestedTag;

        return Boolean(clanMatches || opponentMatches);
      })
      .map((war) => {
        const warClan =
          war.clan && typeof war.clan === "object"
            ? (war.clan as ClashRecord)
            : null;
        const warOpponent =
          war.opponent && typeof war.opponent === "object"
            ? (war.opponent as ClashRecord)
            : null;

        const clanMatches =
          warClan &&
          normalizeClanTag(String(warClan.tag ?? "")) === requestedTag;

        if (clanMatches) {
          return war;
        }

        // The requested clan was returned as the opponent. Swap the sides so
        // older frontend consumers also receive our clan in war.clan.
        return {
          ...war,
          clan: warOpponent,
          opponent: warClan,
        };
      });

    const capitalRaidSeasons = listItems(
      officialCapitalRaidResult.data,
    );

    const clashKingClanRaw =
      clanResult.data &&
      !Array.isArray(clanResult.data)
        ? clanResult.data
        : null;

    const basicClanRaw =
      basicClanResult.data &&
      !Array.isArray(basicClanResult.data)
        ? basicClanResult.data
        : null;

    const officialClanRaw =
      officialClanResult.data &&
      !Array.isArray(officialClanResult.data)
        ? officialClanResult.data
        : null;

    // Every source is checked against the searched tag before any fields are
    // merged. This prevents data from a stale/default clan from leaking into
    // a searched clan (for example Capital Points from the wrong clan).
    const clashKingClan = isRequestedClan(
      clashKingClanRaw,
      clanTag,
    )
      ? clashKingClanRaw
      : null;
    const basicClan = isRequestedClan(
      basicClanRaw,
      clanTag,
    )
      ? basicClanRaw
      : null;
    const officialClan = isRequestedClan(
      officialClanRaw,
      clanTag,
    )
      ? officialClanRaw
      : null;

    const clanNameForSearch =
      (basicClan?.name ??
        clashKingClan?.name ??
        officialClan?.name);

    let searchedClan: ClashRecord | null = null;

    if (typeof clanNameForSearch === "string" && clanNameForSearch.trim()) {
      const searchResult =
        await fetchOptionalClashKingResource(
          `/clan/search?name=${encodeURIComponent(clanNameForSearch.trim())}&limit=25`,
          [],
          req.log,
        );

      searchedClan =
        listItems(searchResult.data).find((item) =>
          isRequestedClan(item, clanTag),
        ) ?? null;
    }

    const officialMembersRaw = listItems(
      officialMembersResult.data,
    );

    /*
     * IMPORTANT: all clan switching must use the exact requested tag.
     *
     * BHABE DHEMONS worked because its cached/official sources happened to
     * agree. Other clans exposed a partial `members: 1` value from one source,
     * which then overwrote the real count. Do not let one weak source win.
     *
     * ClashKing documents the Clan model with members, warWins and warLosses,
     * and its search result is also a full Clan model. We therefore use the
     * exact-tag sources as a pool and choose the most complete value for each
     * field instead of treating one source as globally authoritative.
     */

    const clashKingEmbeddedMembers =
      clashKingClan && Array.isArray(clashKingClan.memberList)
        ? clashKingClan.memberList.filter(
            (item): item is ClashRecord =>
              Boolean(item && typeof item === "object"),
          )
        : [];

    const basicEmbeddedMembers =
      basicClan && Array.isArray(basicClan.memberList)
        ? basicClan.memberList.filter(
            (item): item is ClashRecord =>
              Boolean(item && typeof item === "object"),
          )
        : [];

    const officialEmbeddedMembers =
      officialClan && Array.isArray(officialClan.memberList)
        ? officialClan.memberList.filter(
            (item): item is ClashRecord =>
              Boolean(item && typeof item === "object"),
          )
        : [];

    const searchedEmbeddedMembers =
      searchedClan && Array.isArray(searchedClan.memberList)
        ? searchedClan.memberList.filter(
            (item): item is ClashRecord =>
              Boolean(item && typeof item === "object"),
          )
        : [];

    const rosterCandidates = [
      officialMembersRaw,
      officialEmbeddedMembers,
      searchedEmbeddedMembers,
      basicEmbeddedMembers,
      clashKingEmbeddedMembers,
    ].filter((list) => list.length > 0);

    // Prefer the most complete exact-tag roster. This specifically prevents a
    // one-member partial response from replacing a 40+ member roster.
    const members =
      rosterCandidates.length > 0
        ? rosterCandidates.reduce((best, current) =>
            current.length > best.length ? current : best,
          )
        : [];

    const memberCountCandidates = [
      typeof officialClan?.members === "number"
        ? officialClan.members
        : null,
      typeof searchedClan?.members === "number"
        ? searchedClan.members
        : null,
      typeof basicClan?.members === "number"
        ? basicClan.members
        : null,
      typeof clashKingClan?.members === "number"
        ? clashKingClan.members
        : null,
    ].filter(
      (value): value is number =>
        typeof value === "number" && value > 0,
    );

    // A count of 1 is treated as suspicious when another exact-tag source or
    // the actual roster contains multiple members. Otherwise retain a valid
    // single-member clan.
    const nonSuspiciousCounts =
      memberCountCandidates.filter(
        (value) =>
          value >= 2 ||
          (members.length <= 1 && value === 1),
      );

    const memberCount =
      members.length >= 2
        ? (() => {
            const compatible = nonSuspiciousCounts
              .filter((value) => value >= members.length)
              .sort(
                (a, b) =>
                  Math.abs(a - members.length) -
                  Math.abs(b - members.length),
              );

            return compatible[0] ?? members.length;
          })()
        : nonSuspiciousCounts[0] ??
          memberCountCandidates[0] ??
          null;

    const clan =
      basicClan || clashKingClan || officialClan
        ? {
            ...(clashKingClan ?? {}),
            ...(basicClan ?? {}),
            ...(officialClan ?? {}),
          }
        : null;

    if (clan) {
      // Preserve the best exact-tag member count rather than allowing a
      // partial official response to overwrite it.
      if (memberCount !== null) {
        clan.members = memberCount;
      }

      // Official data is preferred for live Capital fields when available,
      // but it is only accepted after the tag was verified above.
      if (officialClan) {
        if (typeof officialClan.clanCapitalPoints === "number") {
          clan.clanCapitalPoints = officialClan.clanCapitalPoints;
        }
        if (officialClan.capitalLeague !== undefined) {
          clan.capitalLeague = officialClan.capitalLeague;
        }
      }
    }

    // Fill summary statistics from the exact-tag search result when the
    // richer clan endpoint omitted them. These fields are intentionally
    // independent: a source may have warWins but omit warLosses, for example.
    if (clan && searchedClan) {
      if (typeof searchedClan.warWins === "number") {
        clan.warWins = searchedClan.warWins;
      }

      if (typeof searchedClan.warLosses === "number") {
        clan.warLosses = searchedClan.warLosses;
      }

      if (typeof searchedClan.warTies === "number") {
        clan.warTies = searchedClan.warTies;
      }
    }

    if (clan && members.length > 0) {
      clan.memberList = members;
    }

    const dashboard = {
      clan,
      members,
      currentWar:
        currentWar &&
        !Array.isArray(currentWar)
          ? currentWar
          : null,
      warlog,
      capitalRaidSeasons,
      fetchedAt: new Date().toISOString(),
      clanTag,
      apiConfigured: true,
    };

    res.json(
      GetClashDashboardResponse.parse(
        dashboard,
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Player                                                                     */
/* -------------------------------------------------------------------------- */

router.get(
  "/clash/player/:tag",
  async (req, res): Promise<void> => {
    if (!process.env.CLASH_API_TOKEN) {
      res.status(503).json({
        error:
          "Clash API token is not configured.",
        code: "CLASH_API_NOT_CONFIGURED",
      });
      return;
    }

    const tag = normalizeClanTag(
      decodeURIComponent(req.params.tag),
    );

    try {
      const encodedTag =
        encodeURIComponent(tag);

      const player =
        await fetchClashResource(
          `/players/${encodedTag}`,
          new AbortController().signal,
        );

      if (!player || Array.isArray(player)) {
        res.status(404).json({
          error: "Player not found.",
          code: "PLAYER_NOT_FOUND",
        });
        return;
      }

      const clanTag =
        await getActiveClanTag();

      const warlog =
        await fetchOptionalResource(
          `/clans/${encodeURIComponent(
            clanTag,
          )}/warlog`,
          [],
          req.log,
        );

      const history = listItems(
        warlog.data,
      );

      const wars: ClashRecord[] = [];

      let totalAttacks = 0;
      let totalStars = 0;
      let totalDestruction = 0;
      let threeStarAttacks = 0;
      let oneStarOrLess = 0;
      let maxDestruction = 0;
      let missedWars = 0;

      for (const war of history) {
        const clan =
          war &&
          typeof war === "object"
            ? (war as ClashRecord).clan
            : null;

        const members =
          Array.isArray(
            (clan as ClashRecord | null)
              ?.members,
          )
            ? ((clan as ClashRecord)
                .members as ClashRecord[])
            : [];

        const member =
          members.find(
            (m) =>
              normalizeAttackerTag(
                String(m.tag ?? ""),
              ) === tag,
          );

        if (!member) continue;

        const attacks =
          Array.isArray(member.attacks)
            ? (member.attacks as ClashRecord[])
            : [];

        const stars =
          attacks.reduce(
            (sum, attack) =>
              sum +
              Number(
                attack.stars ?? 0,
              ),
            0,
          );

        const destruction =
          attacks.reduce(
            (sum, attack) =>
              sum +
              Number(
                attack.destructionPercentage ??
                  0,
              ),
            0,
          );

        totalAttacks += attacks.length;
        totalStars += stars;
        totalDestruction += destruction;

        threeStarAttacks +=
          attacks.filter(
            (attack) =>
              Number(
                attack.stars ?? 0,
              ) >= 3,
          ).length;

        oneStarOrLess +=
          attacks.filter(
            (attack) =>
              Number(
                attack.stars ?? 0,
              ) <= 1,
          ).length;

        maxDestruction = Math.max(
          maxDestruction,
          ...attacks.map(
            (attack) =>
              Number(
                attack.destructionPercentage ??
                  0,
              ),
          ),
          0,
        );

        if (attacks.length === 0) {
          missedWars += 1;
        }

        wars.push({
          endTime:
            war.endTime ??
            war.startTime ??
            null,
          result:
            war.result ?? null,
          opponentName:
            (
              war.opponent as
                | ClashRecord
                | undefined
            )?.name ?? null,
          opponentStars:
            (
              war.opponent as
                | ClashRecord
                | undefined
            )?.stars ?? null,
          clanStars:
            (
              war.clan as
                | ClashRecord
                | undefined
            )?.stars ?? null,
          attacks,
        });
      }

      res.json({
        ...player,
        historicalWarStats: {
          wars: wars.length,
          totalAttacks,
          totalStars,
          averageStarsPerAttack:
            totalAttacks
              ? totalStars /
                totalAttacks
              : 0,
          averageDestruction:
            totalAttacks
              ? totalDestruction /
                totalAttacks
              : 0,
          maxDestruction,
          threeStarAttacks,
          oneStarOrLess,
          missedWars,
          recentWars:
            wars.slice(0, 20),
        },
      });
    } catch (error) {
      req.log.warn(
        { error, tag },
        "Clash player resource unavailable",
      );

      res.status(503).json({
        error:
          "Could not load the player from Clash of Clans API.",
        code: "PLAYER_FETCH_FAILED",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* War Planner - load assignments                                             */
/* -------------------------------------------------------------------------- */

router.get(
  "/clash/war-planner",
  async (req, res): Promise<void> => {
    const parsedQuery =
      GetWarPlannerQueryParams.safeParse({
        warKey: req.query.warKey,
      });

    if (!parsedQuery.success) {
      res.status(400).json({
        error:
          "A valid war key is required.",
        code: "INVALID_WAR_KEY",
      });
      return;
    }

    const { warKey } =
      parsedQuery.data;

    const assignments =
      await db
        .select()
        .from(warPlannerAssignmentsTable)
        .where(
          eq(
            warPlannerAssignmentsTable.warKey,
            warKey,
          ),
        )
        .orderBy(
          asc(
            warPlannerAssignmentsTable.attackerTag,
          ),
        );

    res.json(
      GetWarPlannerResponse.parse({
        warKey,
        assignments,
      }),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* War Planner - save assignment                                              */
/* -------------------------------------------------------------------------- */

async function saveWarPlannerAssignment(
  req: any,
  res: any,
): Promise<void> {
  const parsedParams =
    UpsertWarPlannerAssignmentParams.safeParse(
      {
        attackerTag:
          req.params.attackerTag,
      },
    );

  const parsedBody =
    UpsertWarPlannerAssignmentBody.safeParse(
      req.body,
    );

  if (
    !parsedParams.success ||
    !parsedBody.success
  ) {
    res.status(400).json({
      error:
        "The planner assignment is invalid.",
      code:
        "INVALID_WAR_PLANNER_ASSIGNMENT",
    });
    return;
  }

  const attackerTag =
    normalizeAttackerTag(
      parsedParams.data.attackerTag,
    );

  const {
    warKey,
    assignedTargetMapPosition,
    locked,
    completed,
  } = parsedBody.data;

  try {
    const [assignment] =
      await db
        .insert(
          warPlannerAssignmentsTable,
        )
        .values({
          warKey,
          attackerTag,
          assignedTargetMapPosition,
          locked,
          completed,
        })
        .onConflictDoUpdate({
          target: [
            warPlannerAssignmentsTable.warKey,
            warPlannerAssignmentsTable.attackerTag,
          ],
          set: {
            assignedTargetMapPosition,
            locked,
            completed,
            updatedAt: new Date(),
          },
        })
        .returning();

    if (!assignment) {
      res.status(500).json({
        error:
          "The planner assignment could not be saved.",
        code:
          "WAR_PLANNER_SAVE_FAILED",
      });
      return;
    }

    res.json(
      UpsertWarPlannerAssignmentResponse.parse(
        assignment,
      ),
    );
  } catch (error) {
    req.log?.error?.(
      {
        error,
        attackerTag,
        warKey,
      },
      "Could not save war planner assignment",
    );

    res.status(500).json({
      error:
        "Could not save the planner assignment.",
      code:
        "WAR_PLANNER_DATABASE_ERROR",
    });
  }
}

/*
 * The frontend uses POST.
 */
router.post(
  "/clash/war-planner/:attackerTag",
  saveWarPlannerAssignment,
);

/*
 * Keep PUT support as well so older frontend code
 * continues to work.
 */
router.put(
  "/clash/war-planner/:attackerTag",
  saveWarPlannerAssignment,
);

export default router;
