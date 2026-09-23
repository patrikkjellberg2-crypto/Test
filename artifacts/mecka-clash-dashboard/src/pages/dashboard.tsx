import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useGetClashDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MemberDetailsDialog } from "@/components/member-details-dialog";
import { AppSidebar } from "@/components/app-sidebar";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  Coins,
  Crown,
  Database,
  Flag,
  Gem,
  Menu,
  Medal,
  RefreshCw,
  Search,
  ShieldAlert,
  Swords,
  Trophy,
  Users,
  WifiOff,
  X,
} from "lucide-react";

type Dict = Record<string, unknown>;

type DashboardShape = {
  clan: unknown;
  members: unknown[];
  currentWar: unknown;
  warlog: unknown[];
  capitalRaidSeasons: unknown[];
  fetchedAt: string;
  clanTag: string;
  apiConfigured: boolean;
};

const d = (v: unknown): Dict =>
  v && typeof v === "object" ? (v as Dict) : {};

const arr = (v: unknown): Dict[] =>
  Array.isArray(v) ? v.map(d) : [];

const s = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : fallback;

const n = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : fallback;

const compact = (v: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map(x => x[0])
    .join("")
    .toUpperCase() || "MC";

const dateText = (v: unknown) => {
  const date = new Date(s(v));

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const ago = (v: unknown) => {
  const date = new Date(s(v));

  if (Number.isNaN(date.getTime())) {
    return "just now";
  }

  const hours = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / 36e5),
  );

  return hours < 24
    ? `${hours}h ago`
    : `${Math.round(hours / 24)}d ago`;
};

function Loading() {
  return (
    <div className="min-h-screen bg-background p-5">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="h-20 animate-pulse rounded-2xl bg-card" />

        <div className="h-44 animate-pulse rounded-2xl bg-card" />

        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="premium-card max-w-md rounded-3xl p-8 text-center">
        <WifiOff className="mx-auto size-8 text-red-400" />

        <h1 className="mt-4 text-2xl font-bold">
          Could not load clan data
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The live Clash feed did not respond.
        </p>

        <button
          type="button"
          onClick={retry}
          className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold"
        >
          Retry connection
        </button>
      </div>
    </div>
  );
}

function Setup() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="premium-card max-w-lg rounded-3xl p-9 text-center">
        <Database className="mx-auto size-8 text-accent" />

        <h1 className="mt-4 text-3xl font-bold">
          Connect the Clash API
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Add the official Clash API token to the server.
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  detail,
  gold = false,
}: {
  icon: any;
  label: string;
  value: string;
  detail: string;
  gold?: boolean;
}) {
  return (
    <article className="premium-card rounded-2xl p-4">
      <div
        className={`grid size-10 place-items-center rounded-xl ${
          gold
            ? "bg-amber-400/15 text-amber-300"
            : "bg-sky-400/15 text-sky-300"
        }`}
      >
        <Icon className="size-5" />
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {detail}
      </p>
    </article>
  );
}

function WarCard({
  war,
  clanName,
}: {
  war: Dict;
  clanName: string;
}) {
  const own = d(war.clan);
  const opponent = d(war.opponent);

  return (
    <article className="premium-card overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-bold">
          Current War
        </h2>

        <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[10px] font-bold text-amber-300">
          {s(war.state, "Unknown")}
        </span>
      </div>

      <div className="grid min-h-[235px] place-items-center p-5">
        <div className="grid w-full max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div>
            <div className="mx-auto grid size-16 place-items-center rounded-2xl border-2 border-amber-400 bg-amber-500/10 text-2xl font-bold text-amber-300">
              {n(own.clanLevel)}
            </div>

            <p className="mt-3 truncate font-bold">
              {s(own.name, clanName)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              ⭐ {n(own.stars)} ·{" "}
              {Math.round(
                n(own.destructionPercentage),
              )}
              %
            </p>
          </div>

          <div>
            <p className="text-xl font-bold text-amber-300">
              VS
            </p>

            <Link
              href="/war-center"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
            >
              View War Center
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div>
            <div className="mx-auto grid size-16 place-items-center rounded-2xl border-2 border-sky-400 bg-sky-400/10 text-2xl font-bold text-sky-300">
              {n(opponent.clanLevel)}
            </div>

            <p className="mt-3 truncate font-bold">
              {s(opponent.name, "Opponent")}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              ⭐ {n(opponent.stars)} ·{" "}
              {Math.round(
                n(opponent.destructionPercentage),
              )}
              %
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function getWarResult(
  war: Dict,
  clanTag: string,
): "won" | "lost" | "draw" | null {
  const own = d(war.clan);
  const opponent = d(war.opponent);
  const requested = clanTag.trim().toUpperCase();
  const ownTag = s(own.tag).trim().toUpperCase();
  const opponentTag = s(opponent.tag).trim().toUpperCase();

  if (ownTag !== requested && opponentTag !== requested) {
    return null;
  }

  const ourSide = ownTag === requested ? own : opponent;
  const enemySide = ownTag === requested ? opponent : own;

  const state = s(war.state).toLowerCase();
  if (!["won", "lost", "draw", "tie"].includes(state)) {
    return null;
  }

  const ourStars = n(ourSide.stars);
  const enemyStars = n(enemySide.stars);
  const ourDestruction = n(ourSide.destructionPercentage);
  const enemyDestruction = n(enemySide.destructionPercentage);

  // Calculate the result from the two sides first. This prevents a war from
  // being displayed backwards when the API returned our clan as opponent.
  if (ourStars > enemyStars || (ourStars === enemyStars && ourDestruction > enemyDestruction)) {
    return "won";
  }
  if (ourStars < enemyStars || (ourStars === enemyStars && ourDestruction < enemyDestruction)) {
    return "lost";
  }

  if (state === "draw" || state === "tie") {
    return "draw";
  }

  // If the API did not provide usable scores, fall back to its clan-scoped
  // state. The backend normally orients the requested clan as war.clan.
  if (state === "won" || state === "lost") {
    return ownTag === requested
      ? (state === "won" ? "won" : "lost")
      : (state === "won" ? "lost" : "won");
  }

  return null;
}

function WarPerformance({
  warlog,
  clanTag,
}: {
  warlog: Dict[];
  clanTag: string;
}) {
  const results = warlog
    .map(war => getWarResult(war, clanTag))
    .filter((result): result is "won" | "lost" | "draw" => result !== null)
    .slice(0, 8);

  const wins = results.filter(result => result === "won").length;
  const losses = results.filter(result => result === "lost").length;
  const draws = results.filter(result => result === "draw").length;
  const completed = wins + losses + draws;
  const rate = completed
    ? Math.round((wins / completed) * 100)
    : 0;

  return (
    <article className="premium-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">
            Recent War Performance
          </h2>

          <p className="text-xs text-muted-foreground">
            {results.length > 0
              ? `Last ${results.length} recorded wars`
              : "No verified war data"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold">
            {results.length > 0 ? `${rate}%` : "—"}
          </p>

          <p className="text-[10px] uppercase text-muted-foreground">
            Win rate
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-1.5">
        {results
          .slice()
          .reverse()
          .map((result, i) => {
            const won = result === "won";
            const draw = result === "draw";

            return (
              <span
                key={i}
                className={`grid size-8 place-items-center rounded-md text-[10px] font-black ${
                  won
                    ? "bg-emerald-500/80"
                    : draw
                      ? "bg-amber-500/80"
                      : "bg-red-500/80"
                }`}
              >
                {won ? "W" : draw ? "D" : "L"}
              </span>
            );
          })}
      </div>
    </article>
  );
}

function EnemyAnalysisIntro({
  war,
}: {
  war: Dict;
}) {
  const opponent = d(war.opponent);

  const state = s(
    war.state,
    "Unknown",
  );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-red-400/20 bg-red-400/[.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-red-300">
          Enemy Clan
        </p>

        <p className="mt-2 truncate text-lg font-bold">
          {s(
            opponent.name,
            "Opponent",
          )}
        </p>
      </div>

      <div className="rounded-xl border border-sky-400/20 bg-sky-400/[.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-sky-300">
          War Status
        </p>

        <p className="mt-2 text-lg font-bold">
          {state}
        </p>
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-300">
          Enemy Score
        </p>

        <p className="mt-2 text-lg font-bold">
          ⭐ {n(opponent.stars)} ·{" "}
          {Math.round(
            n(
              opponent.destructionPercentage,
            ),
          )}
          %
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [requested, setRequested] =
    useState<string | undefined>();

  const [input, setInput] = useState("");

  const [searchError, setSearchError] =
    useState<string | null>(null);

  const [mobile, setMobile] =
    useState(false);

  const [selected, setSelected] =
    useState<Dict | null>(null);

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiMode, setAiMode] =
    useState<"clan" | "opponent" | null>(
      null,
    );

  const [aiAnswer, setAiAnswer] =
    useState<string | null>(null);

  const [aiError, setAiError] =
    useState<string | null>(null);

  const initialized = useRef(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useGetClashDashboard(
    requested
      ? { clanTag: requested }
      : undefined,
  );

  const dash =
    data as unknown as DashboardShape | undefined;

  const members = useMemo(
    () =>
      arr(dash?.members).sort(
        (a, b) =>
          n(a.clanRank, 99) -
          n(b.clanRank, 99),
      ),
    [dash?.members],
  );

  useEffect(() => {
    if (
      dash?.clanTag &&
      !initialized.current
    ) {
      setInput(dash.clanTag);
      initialized.current = true;
    }
  }, [dash?.clanTag]);

  /*
   * MECKA AI COACH
   *
   * Two separate AI modes:
   *
   * clan     = analyzes our clan
   * opponent = analyzes the current enemy clan
   *
   * The backend fetches the full Clash data
   * itself, so we only send the clan tag,
   * mode and a small instruction.
   */

  const analyzeAI = async (
    mode: "clan" | "opponent",
  ) => {
    if (!dash || aiLoading) {
      return;
    }

    setAiLoading(true);
    setAiMode(mode);
    setAiAnswer(null);
    setAiError(null);

    try {
      const response = await fetch(
        "/api/ai/coach",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            clanTag: dash.clanTag,

            mode,

            question:
              mode === "clan"
                ? "Analyze our clan in detail. Focus on our strengths, weaknesses, members, activity, donations, trophies, Capital, recent war performance and the three most important improvements we should make."
                : "Analyze our current war opponent in detail. Focus specifically on the enemy clan, their Town Hall distribution, strongest and weakest players, attack performance, stars, destruction, used attacks, remaining attacks and weaknesses. Recommend the best war strategy and target priorities against this opponent. Do not invent missing data.",
          }),
        },
      );

      const text =
        await response.text();

      let result: {
        answer?: string;
        error?: string;
      };

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          `AI server did not return JSON (${response.status}).`,
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            `AI Coach could not respond (${response.status}).`,
        );
      }

      if (!result.answer) {
        throw new Error(
          "AI Coach returned no answer.",
        );
      }

      setAiAnswer(result.answer);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "AI Coach could not complete the analysis.",
      );
    } finally {
      setAiLoading(false);
      setAiMode(null);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <ErrorState
        retry={() => void refetch()}
      />
    );
  }

  if (!dash?.apiConfigured) {
    return <Setup />;
  }

  const clan = d(dash.clan);
  // The member card is a clan-level count, not the length of the roster
  // payload. The roster can be unavailable while the official clan endpoint
  // still provides the correct current member count.
  const memberCount =
    typeof clan.members === "number" && clan.members > 0
      ? clan.members
      : null;
  const hasLiveRoster =
    memberCount !== null &&
    members.length >= Math.max(1, Math.floor(memberCount * 0.8));

  const war = d(dash.currentWar);

  const warClan = d(war.clan);

  const warOpponent = d(
    war.opponent,
  );

  const warlog = arr(dash.warlog);

  const seasons = arr(
    dash.capitalRaidSeasons,
  );

  const latest = seasons[0] || {};

  // Clash of Clans exposes the all-time war-win count, but the clan feed
  // does not reliably expose an all-time loss count. Never treat a missing
  // loss value as zero, because that creates false records such as 440-0.
  const wins = n(clan.warWins);
  const rawLosses = clan.warLosses;
  const hasLosses = typeof rawLosses === "number";
  const losses = hasLosses ? n(rawLosses) : null;
  const totalWars =
    losses !== null ? wins + losses : 0;

  const rate = totalWars
    ? Math.round(
        (wins / totalWars) * 100,
      )
    : null;

  const clanName = s(
    clan.name,
    "Clash IQ",
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();

    const tag = input
      .trim()
      .toUpperCase()
      .replace(/^#?/, "#");

    if (
      !/^#[A-Z0-9]{3,15}$/.test(tag)
    ) {
      setSearchError(
        "Enter a valid clan tag, for example #2Q0Q82C9R.",
      );

      return;
    }

    setSearchError(null);

    if (tag === dash.clanTag) {
      void refetch();
      return;
    }

    setRequested(tag);

    setAiAnswer(null);
    setAiError(null);
  };

  return (
    <div className="clashiq-overview min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        <AppSidebar
          clanName={clanName}
          clanTag={dash.clanTag}
          mobileOpen={mobile}
          onClose={() => setMobile(false)}
        />

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#06111f]/90 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1400px] items-center gap-3">
              <button
                type="button"
                onClick={() => setMobile(true)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 lg:hidden"
              >
                <Menu className="size-5" />
              </button>

              <form
                onSubmit={submit}
                className="flex max-w-[520px] flex-1"
              >
                <div className="flex w-full items-center rounded-xl border border-sky-300/20 bg-white/[.04] px-3">
                  <Search className="size-4 text-slate-400" />

                  <input
                    value={input}
                    onChange={e =>
                      setInput(e.target.value)
                    }
                    placeholder="Search player, clan or tag..."
                    className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                  />

                  <button
                    type="submit"
                    className="p-2 text-slate-300"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </form>

              <div className="ml-auto flex items-center gap-3">
                <div className="hidden sm:block">
                  <p className="text-xs font-bold">
                    Live Data
                  </p>

                  <p className="text-[10px] text-muted-foreground">
                    Updated{" "}
                    {dataUpdatedAt
                      ? ago(dataUpdatedAt)
                      : ago(
                          dash.fetchedAt,
                        )}
                  </p>
                </div>

                <span className="size-2 rounded-full bg-emerald-400" />

                <button
                  type="button"
                  onClick={() =>
                    void refetch()
                  }
                  className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5"
                >
                  <RefreshCw
                    className={
                      isFetching
                        ? "size-4 animate-spin"
                        : "size-4"
                    }
                  />
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] space-y-5 p-4 md:p-7">
            <section className="hero-banner premium-card relative overflow-hidden rounded-2xl">
              <div className="hero-glow" />

              <div className="relative min-h-[220px] md:min-h-[300px]">
                <img
                  src="/clash-iq-war-banner.webp"
                  alt="Clash IQ — Plan, Analyze, Improve, Win"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />

                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#06111f] via-[#06111f]/70 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 md:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-300">
                    Clan Command Center
                  </p>

                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-bold md:text-4xl">
                        {clanName}
                      </h1>

                      <p className="text-xs text-slate-300">
                        {dash.clanTag}

                        <span className="mx-2 text-amber-300">
                          |
                        </span>

                        Stronger Together
                      </p>
                    </div>

                    <div className="grid size-12 place-items-center rounded-xl border border-amber-400/60 bg-black/40 text-lg font-bold text-amber-300 backdrop-blur-sm">
                      {n(clan.clanLevel)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section
              className="overflow-hidden rounded-2xl border border-sky-400/20 bg-card"
              data-testid="panel-ai-coach"
            >
              <div className="border-b border-white/10 bg-gradient-to-r from-sky-400/10 to-amber-400/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <BrainCircuit className="size-5" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold">
                      CLASH IQ AI
                    </h2>

                    <p className="text-[11px] text-muted-foreground">
                      Advanced Clash of Clans analysis
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      AI War Intelligence
                    </h3>

                    <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                      Analyze your own clan or get a
                      dedicated tactical analysis of your
                      current war opponent.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        void analyzeAI("clan")
                      }
                      disabled={aiLoading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
                    >
                      <BrainCircuit
                        className={
                          aiLoading &&
                          aiMode === "clan"
                            ? "size-4 animate-pulse"
                            : "size-4"
                        }
                      />

                      {aiLoading &&
                      aiMode === "clan"
                        ? "Analyzing..."
                        : "Analyze Clan"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void analyzeAI("opponent")
                      }
                      disabled={
                        aiLoading ||
                        !warOpponent.name
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-5 text-sm font-bold text-red-200 transition hover:bg-red-400/20 disabled:opacity-40"
                    >
                      <Swords
                        className={
                          aiLoading &&
                          aiMode === "opponent"
                            ? "size-4 animate-pulse"
                            : "size-4"
                        }
                      />

                      {aiLoading &&
                      aiMode === "opponent"
                        ? "Analyzing..."
                        : "Analyze Opponent"}
                    </button>
                  </div>
                </div>

                {aiError && (
                  <div className="mt-5 flex gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                    <AlertTriangle className="size-5 shrink-0 text-red-300" />

                    <div>
                      <p className="text-sm font-bold text-red-200">
                        AI Coach could not respond
                      </p>

                      <p className="mt-1 text-xs text-red-100/70">
                        {aiError}
                      </p>
                    </div>
                  </div>
                )}

                {aiAnswer && (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[.05] p-5">
                      <div className="flex items-center gap-2">
                        {aiMode === "opponent" ? (
                          <Swords className="size-5 text-red-300" />
                        ) : (
                          <BrainCircuit className="size-5 text-sky-300" />
                        )}

                        <h3 className="font-bold">
                          {aiMode === "opponent"
                            ? "ENEMY ANALYSIS"
                            : "CLASH IQ AI ANALYSIS"}
                        </h3>
                      </div>

                      <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                        {aiAnswer}
                      </div>
                    </div>

                    {aiMode === "opponent" && (
                      <div className="rounded-2xl border border-red-400/20 bg-gradient-to-br from-red-400/[.07] to-sky-400/[.05] p-5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-11 place-items-center rounded-xl bg-red-400/10 text-red-300">
                            <Swords className="size-5" />
                          </div>

                          <div>
                            <h3 className="font-bold">
                              ENEMY WAR ANALYSIS
                            </h3>

                            <p className="text-[11px] text-muted-foreground">
                              Tactical opponent assessment
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <EnemyAnalysisIntro
                            war={war}
                          />
                        </div>

                        <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="size-4 text-amber-300" />

                            <p className="text-xs font-bold uppercase tracking-[.14em] text-amber-200">
                              AI War Intelligence
                            </p>
                          </div>

                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            The AI has analyzed the
                            opponent's available war data,
                            including threats, attack
                            performance, weaknesses and
                            recommended target priorities
                            when enough Clash data is
                            available.
                          </p>
                        </div>

                        <Link
                          href="/war-center"
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white"
                        >
                          Open War Center
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {searchError && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">
                {searchError}
              </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <Stat
                icon={ShieldAlert}
                label="Clan Level"
                value={String(
                  n(clan.clanLevel),
                )}
                detail="Clan level"
                gold
              />

              <Stat
                icon={Users}
                label="Members"
                value={memberCount !== null ? `${memberCount}/50` : "—"}
                detail={
                  memberCount !== null
                    ? hasLiveRoster
                      ? "Live official roster"
                      : "Live official count · roster unavailable"
                    : "Live member data unavailable"
                }
              />

              <Stat
                icon={Swords}
                label="War Wins"
                value={String(wins)}
                detail={
                  losses !== null
                    ? `${rate}% win rate`
                    : "Classic war wins"
                }
              />

              <Stat
                icon={X}
                label="War Losses"
                value={losses !== null ? String(losses) : "—"}
                detail={
                  losses !== null
                    ? "Classic war losses"
                    : "Loss data unavailable"
                }
              />

              <Stat
                icon={Gem}
                label="Capital Points"
                value={typeof clan.clanCapitalPoints === "number"
                  ? compact(n(clan.clanCapitalPoints))
                  : "—"}
                detail={typeof clan.clanCapitalPoints === "number"
                  ? s(clan.capitalLeague, "Unranked")
                  : "Live Capital data unavailable"}
                gold
              />

              <Stat
                icon={Coins}
                label="Capital Raids"
                value={seasons.length > 0 ? String(seasons.length) : "—"}
                detail={seasons.length > 0
                  ? `${compact(n(latest.capitalTotalLoot))} loot`
                  : "Live raid data unavailable"}
                gold
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.35fr_.9fr_.8fr]">
              <WarCard
                war={war}
                clanName={clanName}
              />

              <WarPerformance
                warlog={warlog}
                clanTag={dash.clanTag}
              />

              <article className="premium-card rounded-2xl p-5">
                <h2 className="text-lg font-bold">
                  Capital Raid Summary
                </h2>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <Trophy className="size-7 text-amber-300" />

                    <p className="mt-2 text-2xl font-bold">
                      {seasons.length > 0
                        ? compact(n(latest.capitalTotalLoot))
                        : "—"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {seasons.length > 0
                        ? "Total loot"
                        : "Live raid data unavailable"}
                    </p>
                  </div>

                  <div>
                    <Medal className="size-7 text-sky-300" />

                    <p className="mt-2 text-2xl font-bold">
                      {seasons.length > 0
                        ? n(latest.offensiveReward) +
                          n(latest.defensiveReward)
                        : "—"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {seasons.length > 0
                        ? "Raid rewards"
                        : "Live raid data unavailable"}
                    </p>
                  </div>
                </div>

                <Link
                  href="/capital-raids"
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 py-2.5 text-xs font-bold text-sky-200"
                >
                  View Capital Raids
                  <ArrowRight className="size-3.5" />
                </Link>
              </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.05fr_1fr_.72fr]">
              <article className="premium-card overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <h2 className="font-bold">
                    Top Members
                  </h2>

                  <Link
                    href="/members"
                    className="rounded-lg bg-primary/15 px-3 py-1.5 text-[10px] font-bold text-sky-300"
                  >
                    View All
                  </Link>
                </div>

                <div className="divide-y divide-white/5">
                  {members
                    .slice(0, 5)
                    .map(
                      (
                        member,
                        i,
                      ) => {
                        const name =
                          s(
                            member.name,
                            "Unknown",
                          );

                        return (
                          <button
                            type="button"
                            key={s(
                              member.tag,
                              String(i),
                            )}
                            onClick={() =>
                              setSelected(
                                member,
                              )
                            }
                            className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-white/[.03]"
                          >
                            <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-xs font-bold">
                              {i === 0 ? (
                                <Crown className="size-4 text-amber-300" />
                              ) : (
                                i + 1
                              )}
                            </span>

                            <span className="grid size-9 place-items-center rounded-lg bg-sky-400/10 text-xs font-bold text-sky-200">
                              {initials(
                                name,
                              )}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold">
                                {name}
                              </span>

                              <span className="text-[10px] text-muted-foreground">
                                {s(
                                  d(
                                    member.league,
                                  ).name,
                                  "Member",
                                )}
                              </span>
                            </span>

                            <span className="text-xs font-bold">
                              {n(
                                member.trophies,
                              ).toLocaleString()}
                            </span>
                          </button>
                        );
                      },
                    )}
                </div>
              </article>

              <article className="premium-card overflow-hidden rounded-2xl">
                <div className="border-b border-white/10 px-5 py-4">
                  <h2 className="font-bold">
                    Latest War Log
                  </h2>
                </div>

                <div className="divide-y divide-white/5">
                  {warlog
                    .slice(0, 5)
                    .map((w, i) => {
                      const own =
                        d(w.clan);

                      const opponent =
                        d(
                          w.opponent,
                        );

                      const won =
                        s(
                          w.state,
                        ).toLowerCase() ===
                        "won";

                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-5 py-3"
                        >
                          <span
                            className={`grid size-8 place-items-center rounded-lg ${
                              won
                                ? "bg-emerald-400/15 text-emerald-300"
                                : "bg-red-400/15 text-red-300"
                            }`}
                          >
                            {won ? (
                              <Check className="size-4" />
                            ) : (
                              <X className="size-4" />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                              vs{" "}
                              {s(
                                opponent.name,
                                "Unknown",
                              )}
                            </p>

                            <p className="text-[10px] text-muted-foreground">
                              {dateText(
                                w.endTime,
                              )}
                            </p>
                          </div>

                          <p className="text-sm font-bold">
                            {n(
                              own.stars,
                            )}{" "}
                            -{" "}
                            {n(
                              opponent.stars,
                            )}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </article>

              <article className="premium-card overflow-hidden rounded-2xl">
                <div className="border-b border-white/10 px-5 py-4">
                  <h2 className="font-bold">
                    Quick Actions
                  </h2>
                </div>

                <div className="space-y-2 p-4">
                  {[
                    [
                      "/war-center",
                      "Open War Center",
                      Swords,
                    ],
                    [
                      "/war-planner",
                      "Go to War Planner",
                      Flag,
                    ],
                    [
                      "/capital-raids",
                      "View Capital Raids",
                      Trophy,
                    ],
                    [
                      "/members",
                      "Manage Members",
                      Users,
                    ],
                  ].map(
                    ([
                      href,
                      label,
                      Icon,
                    ]: any) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm font-bold"
                      >
                        <Icon className="size-5 text-sky-300" />

                        <span className="flex-1">
                          {label}
                        </span>

                        <ArrowRight className="size-4 text-slate-500" />
                      </Link>
                    ),
                  )}
                </div>
              </article>
            </section>

            <footer className="flex justify-between border-t border-white/10 pt-4 text-[10px] text-muted-foreground">
              <span>
                Clash IQ · Official Clash of Clans
                data
              </span>

              <span className="flex items-center gap-1">
                <Clock3 className="size-3" />

                Last fetch{" "}
                {dateText(
                  dash.fetchedAt,
                )}
              </span>
            </footer>
          </div>
        </main>
      </div>

      <MemberDetailsDialog
        member={selected}
        onClose={() =>
          setSelected(null)
        }
      />
    </div>
  );
}
