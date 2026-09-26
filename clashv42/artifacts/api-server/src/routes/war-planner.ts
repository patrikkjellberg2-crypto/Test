import express, { Request, Response } from "express";

const router = express.Router();

const CLASH_API_BASE =
  process.env.CLASH_API_BASE_URL ||
  "https://cocproxy.royaleapi.dev/v1";

const CLASHKING_API_BASE =
  process.env.CLASHKING_API_BASE_URL ||
  "https://api.clashk.ing";

const OPENAI_URL =
  "https://api.openai.com/v1/responses";

const OPENAI_MODEL =
  process.env.OPENAI_WAR_MODEL ||
  "gpt-5.6-luna";

const MAX_INPUT_CHARS = 14000;
const MAX_OUTPUT_TOKENS = 1800;

type AnyObject = Record<string, any>;

function cleanTag(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function fetchJson<T>(
  base: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();
  let data: any = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error?.message ||
        data?.reason ||
        `API error ${response.status}`,
    );
  }

  return data as T;
}

async function supercellGet<T>(path: string): Promise<T> {
  const token = process.env.CLASH_API_TOKEN;

  if (!token) {
    throw new Error("CLASH_API_TOKEN saknas i Render.");
  }

  return fetchJson<T>(CLASH_API_BASE, path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function clashKingGet<T>(path: string): Promise<T> {
  return fetchJson<T>(CLASHKING_API_BASE, path);
}

function compactAttack(attack: AnyObject) {
  return {
    attackerTag: str(attack?.attackerTag),
    defenderTag: str(attack?.defenderTag),
    stars: num(attack?.stars),
    destruction: num(attack?.destructionPercentage),
    order: num(attack?.order),
  };
}

function compactMember(member: AnyObject) {
  const attacks = Array.isArray(member?.attacks)
    ? member.attacks.slice(0, 2).map(compactAttack)
    : [];

  return {
    tag: str(member?.tag),
    name: str(member?.name, "Unknown"),
    position: num(member?.mapPosition ?? member?.clanRank),
    townHall: num(member?.townhallLevel ?? member?.townHallLevel),
    attacksUsed: attacks.length,
    attacks,
    bestOpponentAttack: member?.bestOpponentAttack
      ? {
          stars: num(member.bestOpponentAttack.stars),
          destruction: num(
            member.bestOpponentAttack.destructionPercentage,
          ),
        }
      : null,
  };
}

function compactSide(side: AnyObject | null) {
  const clan = side?.clan ?? side ?? {};

  const members = Array.isArray(clan?.members)
    ? clan.members
        .map(compactMember)
        .sort(
          (a: AnyObject, b: AnyObject) => a.position - b.position,
        )
        .slice(0, 30)
    : [];

  return {
    tag: str(clan?.tag),
    name: str(clan?.name),
    stars: num(clan?.stars),
    destruction: num(clan?.destructionPercentage),
    attacks: num(clan?.attacks),
    members,
  };
}

function compactWar(war: AnyObject) {
  return {
    state: str(war?.state, "unknown"),
    teamSize: num(war?.teamSize),
    attacksPerMember: num(war?.attacksPerMember, 2),
    clan: compactSide(war?.clan),
    opponent: compactSide(war?.opponent),
    startTime: str(war?.startTime),
    endTime: str(war?.endTime),
  };
}

async function getWarForPlanner(clanTag: string): Promise<AnyObject> {
  /*
   * ClashKing is the primary source for war metadata.
   * Its current public endpoint exposes the stored war pointer,
   * while the full live war board is still obtained from the
   * official Clash API when a token is configured.
   */
  const basic = await clashKingGet<AnyObject | null>(
    `/v2/war/${encodeURIComponent(clanTag)}/basic`,
  );

  if (!basic) {
    throw new Error("ClashKing har ingen registrerad aktuell war för klanen.");
  }

  if (process.env.CLASH_API_TOKEN) {
    try {
      return await supercellGet<AnyObject>(
        `/clans/${encodeURIComponent(clanTag)}/currentwar`,
      );
    } catch {
      // Fall through to stored ClashKing data when possible.
    }
  }

  const endTime = str(basic?.endTime);
  if (endTime) {
    try {
      const stored = await clashKingGet<AnyObject | null>(
        `/v2/war/${encodeURIComponent(clanTag)}/previous/${encodeURIComponent(endTime)}`,
      );

      if (stored && typeof stored === "object") {
        return stored;
      }
    } catch {
      // No stored completed war available.
    }
  }

  throw new Error(
    "ClashKing hittade kriget, men full live-war-data kunde inte hämtas. Lägg till CLASH_API_TOKEN för live War Planner.",
  );
}

async function callOpenAI(
  instructions: string,
  input: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY saknas i Render.");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions,
      input,
      max_output_tokens: MAX_OUTPUT_TOKENS,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || `OpenAI API error ${response.status}`,
    );
  }

  const output = Array.isArray(data?.output) ? data.output : [];
  const textParts: string[] = [];

  for (const item of output) {
    if (item?.type !== "message") continue;

    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (
        part?.type === "output_text" &&
        typeof part?.text === "string"
      ) {
        textParts.push(part.text);
      }
    }
  }

  const result = textParts.join("\n").trim();

  if (!result) {
    throw new Error("OpenAI returnerade inget text-svar.");
  }

  return result;
}

const SYSTEM_PROMPT = `
You are CLASHIQ AI WAR COACH for Clash of Clans.

Create a practical attack plan from the supplied war data.

Rules:
- Only use players and enemy bases present in the data.
- Never invent tags, names, Town Hall levels or attacks.
- Respect attacks already used.
- Never assign the same target twice.
- Do not recommend a player who has already used all attacks.
- Prefer realistic Town Hall matchups.
- Prioritize strong 3-star opportunities.
- Use safe 2-star attacks when appropriate.
- Use cleanup when an enemy base has already been attacked but not cleared.
- Consider score and destruction.
- Keep reasons short.
- Respond in Swedish.

Return ONLY valid JSON.

JSON:
{
  "warStatus": "WINNING",
  "summary": "kort svensk sammanfattning",
  "recommendations": [
    {
      "attackerTag": "#PLAYER",
      "attackerName": "Player",
      "attackerTownhall": 17,
      "attackerPosition": 1,
      "targetPosition": 1,
      "targetName": "Enemy",
      "targetTownhall": 17,
      "score": 95,
      "confidence": "HIGH",
      "purpose": "3-star attempt",
      "reason": "Kort praktisk anledning."
    }
  ],
  "notes": ["kort svensk kommentar"]
}

warStatus: WINNING | LOSING | CLOSE
confidence: HIGH | MEDIUM | LOW
purpose: 3-star attempt | safe 2-star | cleanup
Maximum 15 recommendations.
Maximum 5 notes.
`;

router.post("/ai/war-planner", async (req: Request, res: Response) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY saknas i Render.",
      });
    }

    const clanTag = cleanTag(req.body?.clanTag);

    if (!clanTag) {
      return res.status(400).json({ error: "clanTag krävs." });
    }

    const war = await getWarForPlanner(clanTag);

    if (!war || typeof war !== "object") {
      return res.status(404).json({
        error: "ClashKing returnerade ingen war-data.",
      });
    }

    const state = str(war?.state, "unknown").toLowerCase();

    if (state === "notinwar") {
      return res.status(400).json({
        error: "Det finns inget aktivt krig att analysera.",
      });
    }

    const compact = compactWar(war);
    const warData = JSON.stringify(compact);

    if (warData.length > MAX_INPUT_CHARS) {
      return res.status(413).json({
        error: `War-data är fortfarande för stor efter komprimering (${warData.length} tecken).`,
      });
    }

    const output = await callOpenAI(
      SYSTEM_PROMPT,
      `CURRENT WAR DATA:\n${warData}`,
    );

    let plan: AnyObject;

    try {
      plan = JSON.parse(output);
    } catch {
      const first = output.indexOf("{");
      const last = output.lastIndexOf("}");

      if (first === -1 || last === -1 || last <= first) {
        throw new Error("AI returnerade ogiltig JSON.");
      }

      plan = JSON.parse(output.slice(first, last + 1));
    }

    const rawRecommendations = Array.isArray(plan?.recommendations)
      ? plan.recommendations
      : [];

    const ourMembers = Array.isArray(compact?.clan?.members)
      ? compact.clan.members
      : [];

    const enemyMembers = Array.isArray(compact?.opponent?.members)
      ? compact.opponent.members
      : [];

    const attackersByTag = new Map(
      ourMembers.map((member: AnyObject) => [
        member.tag.toUpperCase(),
        member,
      ]),
    );

    const attackersByPosition = new Map(
      ourMembers.map((member: AnyObject) => [member.position, member]),
    );

    const targetsByPosition = new Map(
      enemyMembers.map((member: AnyObject) => [member.position, member]),
    );

    const usedTargets = new Set<number>();
    const maxAttacks = num(war?.attacksPerMember, 2);

    const recommendations = rawRecommendations
      .slice(0, 15)
      .map((item: AnyObject) => {
        const attackerTag = str(item?.attackerTag).toUpperCase();
        const attacker =
          attackersByTag.get(attackerTag) ||
          attackersByPosition.get(num(item?.attackerPosition));
        const target = targetsByPosition.get(
          num(item?.targetPosition),
        );

        if (!attacker || !target) return null;
        if (usedTargets.has(target.position)) return null;
        if (attacker.attacksUsed >= maxAttacks) return null;

        usedTargets.add(target.position);

        return {
          attackerTag: attacker.tag,
          attackerName: attacker.name,
          attackerTownhall: attacker.townHall,
          attackerPosition: attacker.position,
          targetPosition: target.position,
          targetName: target.name,
          targetTownhall: target.townHall,
          score: Math.max(0, Math.min(100, num(item?.score))),
          confidence:
            item?.confidence === "HIGH" || item?.confidence === "LOW"
              ? item.confidence
              : "MEDIUM",
          purpose:
            item?.purpose === "3-star attempt" ||
            item?.purpose === "safe 2-star" ||
            item?.purpose === "cleanup"
              ? item.purpose
              : "3-star attempt",
          reason: str(item?.reason, "Praktisk matchning.").slice(0, 220),
        };
      })
      .filter(Boolean);

    const warStatus =
      plan?.warStatus === "WINNING" || plan?.warStatus === "LOSING"
        ? plan.warStatus
        : "CLOSE";

    const notes = Array.isArray(plan?.notes)
      ? plan.notes
          .filter((note: unknown) => typeof note === "string")
          .map((note: string) => note.trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    return res.json({
      plan: {
        warStatus,
        summary: str(plan?.summary, "AI-plan skapad."),
        recommendations,
        notes,
      },
    });
  } catch (error: any) {
    console.error("AI WAR PLANNER ERROR:", error);

    const message =
      str(error?.message) || "Kunde inte skapa AI-planen.";

    if (
      message.includes("429") ||
      message.toLowerCase().includes("rate limit") ||
      message.includes("tokens per min")
    ) {
      return res.status(429).json({
        error: "AI rate limit nådd. Försök igen om en kort stund.",
      });
    }

    return res.status(500).json({ error: message });
  }
});

export default router;
