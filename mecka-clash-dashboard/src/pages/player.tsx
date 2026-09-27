import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  Activity,
  ArrowLeft,
  Castle,
  ChevronRight,
  Crown,
  Gift,
  Hammer,
  Shield,
  Sparkles,
  Star,
  Swords,
  Minus,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { AppSidebar } from '@/components/app-sidebar';

type Dict = Record<string, any>;

const asDict = (v: any): Dict =>
  v && typeof v === 'object' ? v : {};

const asArray = (v: any): Dict[] =>
  Array.isArray(v) ? v.map(asDict) : [];

const str = (v: any, fallback = '—') =>
  typeof v === 'string' ? v : fallback;

const num = (v: any, fallback = 0) =>
  typeof v === 'number' ? v : fallback;

const compact = (v: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);

const pct = (v: number) =>
  `${Math.round(v)}%`;

const initials = (n: string) =>
  n
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'CQ';

const formatDate = (v: any) => {
  if (!v) return 'Unknown date';

  const date = new Date(v);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: any;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#11151c]/90 p-4 shadow-xl">
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-400/5 blur-2xl" />

      <div className="relative flex items-center gap-2 text-amber-300">
        <Icon className="h-4 w-4" />

        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
          {label}
        </span>
      </div>

      <p className="relative mt-2 font-data text-2xl font-black text-white">
        {value}
      </p>

      {sub && (
        <p className="relative mt-1 text-xs text-slate-600">
          {sub}
        </p>
      )}
    </div>
  );
}

function Progress({
  name,
  value,
  max,
}: {
  name: string;
  value: number;
  max: number;
}) {
  const progress = max
    ? Math.min(100, (value / max) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
      <div className="flex justify-between gap-3 text-xs">
        <span className="truncate font-bold text-slate-300">
          {name}
        </span>

        <span className="font-data text-slate-500">
          {compact(value)} / {compact(max)}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function PlayerPage() {
  const params = useParams<{ tag: string }>();

  const tag = decodeURIComponent(
    str(params.tag, ''),
  ).toUpperCase();

  const {
    data: dashboard,
    isLoading: dashboardLoading,
  } = useGetClashDashboard();

  const [player, setPlayer] = useState<Dict | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    fetch(
      `/api/clash/player/${encodeURIComponent(tag)}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          const body = await response
            .json()
            .catch(() => ({}));

          throw new Error(
            body.error || `HTTP ${response.status}`,
          );
        }

        return response.json();
      })
      .then((value) => {
        if (!cancelled) {
          setPlayer(value);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load the player.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tag]);

  const [archiveWars, setArchiveWars] = useState<Dict[]>([]);
  const [archiveLoaded, setArchiveLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/clash/player/${encodeURIComponent(tag)}/war-history?limit=25`)
      .then(response => (response.ok ? response.json() : { wars: [] }))
      .then(value => {
        if (!cancelled) {
          setArchiveWars(Array.isArray(value?.wars) ? value.wars : []);
          setArchiveLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setArchiveLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [tag]);

  const d = dashboard as any;

  const members = asArray(d?.members);
  const war = asDict(d?.currentWar);
  const warClan = asDict(war.clan);

  const member =
    members.find(
      (m) => str(m.tag).toUpperCase() === tag,
    ) || {};

  const warMember =
    asArray(warClan.members).find(
      (m) => str(m.tag).toUpperCase() === tag,
    ) || {};

  const profile = {
    ...member,
    ...warMember,
    ...(player || {}),
  };

  const name = str(
    profile.name,
    'Unknown player',
  );

  const league = asDict(profile.league);
  const builderLeague = asDict(
    profile.builderBaseLeague,
  );

  const attacks = asArray(profile.attacks);

  const stars = attacks.reduce(
    (sum, attack) =>
      sum + num(attack.stars),
    0,
  );

  const destruction = attacks.length
    ? attacks.reduce(
        (sum, attack) =>
          sum +
          num(
            attack.destructionPercentage,
          ),
        0,
      ) / attacks.length
    : 0;

  const achievements = asArray(
    profile.achievements,
  );

  const troops = asArray(profile.troops);
  const heroes = asArray(profile.heroes);
  const pets = asArray(profile.pets);
  const spells = asArray(profile.spells);
  const labels = asArray(profile.labels);

  const historical = asDict(
    player?.historicalWarStats,
  );

  const historicalWars = asArray(
    historical.recentWars,
  );

  const archiveStats = useMemo(() => {
    if (!archiveWars.length) return null;

    let attacksUsed = 0;
    let attacksPossible = 0;
    let stars = 0;
    let threeStars = 0;
    let destructionSum = 0;
    let bestDestruction = 0;

    // attacksPerMember isn't in this payload; assume the common case (2)
    // unless a war clearly used more attacks than that.
    for (const w of archiveWars) {
      const attacks = asArray(w.attacks);
      attacksUsed += attacks.length;
      attacksPossible += Math.max(2, attacks.length);
      for (const a of attacks) {
        const s = num(a.stars);
        const d = num(a.destructionPercentage);
        stars += s;
        destructionSum += d;
        if (d > bestDestruction) bestDestruction = d;
        if (s >= 3) threeStars += 1;
      }
    }

    const recentAvgWindow = 5;
    const withAttacks = archiveWars.filter(w => asArray(w.attacks).length > 0);
    const avgOf = (list: Dict[]) => {
      const all = list.flatMap(w => asArray(w.attacks));
      if (!all.length) return null;
      return all.reduce((sum, a) => sum + num(a.stars), 0) / all.length;
    };
    const recent = avgOf(withAttacks.slice(0, recentAvgWindow));
    const previous = avgOf(withAttacks.slice(recentAvgWindow, recentAvgWindow * 2));
    let trend: 'up' | 'down' | 'flat' | null = null;
    if (recent !== null && previous !== null) {
      const diff = recent - previous;
      trend = diff > 0.15 ? 'up' : diff < -0.15 ? 'down' : 'flat';
    }

    return {
      wars: archiveWars.length,
      attacksUsed,
      attacksPossible,
      missed: Math.max(0, attacksPossible - attacksUsed),
      stars,
      threeStars,
      avgDestruction: attacksUsed ? destructionSum / attacksUsed : 0,
      bestDestruction,
      trend,
      recentAvgStars: recent,
    };
  }, [archiveWars]);

  const histAttacks = num(
    historical.totalAttacks,
  );

  const histStars = num(
    historical.totalStars,
  );

  const histAvgDestruction = num(
    historical.averageDestruction,
  );

  const histThreeStars = num(
    historical.threeStarAttacks,
  );

  const histMissed = num(
    historical.missedWars,
  );

  const townHall = num(
    profile.townHallLevel,
    num(profile.townhallLevel),
  );

  const currentWarAttacks = attacks.length;

  const attackSlotsRemaining = Math.max(
    0,
    2 - currentWarAttacks,
  );

  const role = str(
    profile.role,
    'member',
  );

  const warResultLabel =
    stars >= 3
      ? 'High impact'
      : stars > 0
        ? 'Active'
        : 'No stars yet';

  const playerStatus =
    profile.tag
      ? 'Verified player'
      : 'Player not found';

  if (dashboardLoading || loading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
            <Users className="h-6 w-6 animate-pulse text-amber-300" />
          </div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
            CLASHIQ
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Loading player intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (error && !profile.tag) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] p-6 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11151c] p-8 text-center shadow-2xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-red-400/20 bg-red-400/10">
            <Shield className="h-6 w-6 text-red-300" />
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Player Intelligence Offline
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <Link
            href="/members"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-amber-200 transition hover:bg-amber-400/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent_30%)]">
        <AppSidebar />

        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="border-b border-white/5 bg-[#07090d]/85 px-5 py-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between">
              <div>
                <Link
                  href="/members"
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 transition hover:text-amber-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Members
                </Link>

                <div className="mt-2 flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">
                    Player Profile
                  </h1>

                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                    Elite
                  </span>
                </div>
              </div>

              <div className="hidden items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-2 sm:flex">
                <Activity className="h-4 w-4 text-emerald-400" />

                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">
                  {playerStatus}
                </span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-6 md:px-8 md:py-8">
            {/* Player hero */}
            <section className="relative overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-br from-[#17130b] via-[#0e1117] to-[#090b10] p-6 shadow-2xl md:p-8">
              <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />

              <div className="relative flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-5">
                  <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] text-3xl font-black text-amber-300 shadow-xl">
                    {initials(name)}

                    <div className="absolute -bottom-2 -right-2 rounded-lg border border-[#0e1117] bg-amber-400 px-2 py-1 text-[9px] font-black text-black">
                      TH {townHall}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                        Player Intelligence
                      </span>

                      <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                        {role}
                      </span>
                    </div>

                    <h2 className="truncate text-3xl font-black tracking-tight sm:text-4xl">
                      {name}
                    </h2>

                    <p className="mt-2 font-data text-xs text-slate-600">
                      {str(profile.tag)} · Clan Rank #
                      {num(profile.clanRank)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-slate-300">
                        {str(
                          league.name,
                          'Unranked',
                        )}
                      </span>

                      <span className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-500">
                        XP {num(profile.expLevel)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">
                      Trophies
                    </p>

                    <p className="mt-1 font-data text-lg font-black">
                      {compact(
                        num(profile.trophies),
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">
                      Donations
                    </p>

                    <p className="mt-1 font-data text-lg font-black">
                      {compact(
                        num(profile.donations),
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">
                      Received
                    </p>

                    <p className="mt-1 font-data text-lg font-black">
                      {compact(
                        num(
                          profile.donationsReceived,
                        ),
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">
                      War Stars
                    </p>

                    <p className="mt-1 font-data text-lg font-black">
                      {num(profile.warStars)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Core stats */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                icon={Trophy}
                label="Trophies"
                value={compact(
                  num(profile.trophies),
                )}
                sub={str(
                  league.name,
                  'Unranked',
                )}
              />

              <Stat
                icon={Hammer}
                label="Builder Base"
                value={compact(
                  num(
                    profile.builderBaseTrophies,
                  ),
                )}
                sub={str(
                  builderLeague.name,
                  'No league',
                )}
              />

              <Stat
                icon={Gift}
                label="Donations"
                value={compact(
                  num(profile.donations),
                )}
                sub={`Received ${compact(
                  num(
                    profile.donationsReceived,
                  ),
                )}`}
              />

              <Stat
                icon={Shield}
                label="Clan Rank"
                value={`#${num(
                  profile.clanRank,
                )}`}
                sub={`Previous #${num(
                  profile.previousClanRank,
                )}`}
              />
            </section>

            {/* Current war */}
            {warMember.tag && (
              <section className="rounded-2xl border border-red-400/15 bg-[#11151c]/90 p-5 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                      Live operation
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Current War
                    </h2>
                  </div>

                  <Swords className="h-5 w-5 text-red-300" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat
                    icon={Swords}
                    label="Attacks"
                    value={`${currentWarAttacks}/2`}
                    sub={`${attackSlotsRemaining} remaining`}
                  />

                  <Stat
                    icon={Star}
                    label="Stars"
                    value={stars}
                    sub={warResultLabel}
                  />

                  <Stat
                    icon={Zap}
                    label="Destruction"
                    value={pct(destruction)}
                    sub="Average attack result"
                  />

                  <Stat
                    icon={Castle}
                    label="Map Position"
                    value={`#${num(
                      warMember.mapPosition,
                    )}`}
                    sub="War map"
                  />
                </div>
              </section>
            )}

            {/* Troops + Heroes */}
            <section className="grid gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-2.5">
                    <Swords className="h-5 w-5 text-blue-300" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                      Army intelligence
                    </p>

                    <h2 className="text-lg font-black">
                      Troops
                    </h2>
                  </div>
                </div>

                {troops.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {troops.map((troop, index) => (
                      <div
                        key={`${str(
                          troop.name,
                        )}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-300">
                            {str(troop.name)}
                          </p>

                          <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">
                            {troop.isSuperTroop
                              ? 'Super troop'
                              : troop.village ===
                                  'builderBase'
                                ? 'Builder Base'
                                : 'Home Village'}
                          </p>
                        </div>

                        <span className="font-data text-sm font-black text-amber-300">
                          Lv {num(troop.level)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-600">
                    Detailed troop data is not available from the API.
                  </p>
                )}
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5">
                    <Shield className="h-5 w-5 text-amber-300" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                      Hero intelligence
                    </p>

                    <h2 className="text-lg font-black">
                      Heroes & Pets
                    </h2>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {heroes.map((hero, index) => (
                    <div
                      key={`hero-${str(
                        hero.name,
                      )}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-300">
                          {str(hero.name)}
                        </p>

                        <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">
                          Hero
                        </p>
                      </div>

                      <span className="font-data text-sm font-black text-amber-300">
                        Lv {num(hero.level)}
                      </span>
                    </div>
                  ))}

                  {pets.map((pet, index) => (
                    <div
                      key={`pet-${str(
                        pet.name,
                      )}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-300">
                          {str(pet.name)}
                        </p>

                        <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">
                          Pet
                        </p>
                      </div>

                      <span className="font-data text-sm font-black text-amber-300">
                        Lv {num(pet.level)}
                      </span>
                    </div>
                  ))}

                  {!heroes.length &&
                    !pets.length && (
                      <p className="col-span-full rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-600">
                        No hero or pet data was returned by the API.
                      </p>
                    )}
                </div>
              </article>
            </section>

            {/* Spells */}
            <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-2.5">
                  <Sparkles className="h-5 w-5 text-purple-300" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
                    Spell intelligence
                  </p>

                  <h2 className="text-lg font-black">
                    Spells
                  </h2>
                </div>
              </div>

              {spells.length ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {spells.map((spell, index) => (
                    <div
                      key={`${str(
                        spell.name,
                      )}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-3"
                    >
                      <span className="text-xs font-bold text-slate-300">
                        {str(spell.name)}
                      </span>

                      <span className="font-data text-sm font-black text-purple-300">
                        Lv {num(spell.level)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-600">
                  No spell data available.
                </p>
              )}
            </section>

            {/* Combat history (server-side war archive) */}
            <section className="rounded-2xl border border-red-400/15 bg-[#11151c]/90 p-5 shadow-xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-2.5">
                  <Swords className="h-5 w-5 text-red-300" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                    Combat history
                  </p>
                  <h2 className="text-lg font-black">
                    Historical Wars & Attacks
                  </h2>
                </div>

                {archiveStats?.trend && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                      archiveStats.trend === 'up'
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                        : archiveStats.trend === 'down'
                          ? 'border-red-400/30 bg-red-400/10 text-red-300'
                          : 'border-slate-400/30 bg-slate-400/10 text-slate-300'
                    }`}
                  >
                    {archiveStats.trend === 'up' ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : archiveStats.trend === 'down' ? (
                      <TrendingDown className="h-3.5 w-3.5" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                    {archiveStats.trend === 'up'
                      ? 'Improving'
                      : archiveStats.trend === 'down'
                        ? 'Declining'
                        : 'Steady'}
                  </span>
                )}
              </div>

              {archiveStats ? (
                <>
                  <p className="mb-4 text-xs text-slate-500">
                    Based on {archiveStats.wars} war
                    {archiveStats.wars === 1 ? '' : 's'} captured by ClashIQ for
                    this clan. This grows the longer the clan uses the app.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                      icon={Swords}
                      label="Wars tracked"
                      value={archiveStats.wars}
                      sub="ClashIQ war archive"
                    />

                    <Stat
                      icon={Swords}
                      label="Attacks"
                      value={archiveStats.attacksUsed}
                      sub={`Missed ${archiveStats.missed}`}
                    />

                    <Stat
                      icon={Star}
                      label="Stars"
                      value={archiveStats.stars}
                      sub={`3★ attacks ${archiveStats.threeStars}`}
                    />

                    <Stat
                      icon={Zap}
                      label="Avg. Destruction"
                      value={pct(archiveStats.avgDestruction)}
                      sub={`Best ${pct(archiveStats.bestDestruction)}`}
                    />
                  </div>

                  <div className="mt-5 space-y-2">
                    {archiveWars.slice(0, 10).map((warItem, index) => {
                      const warAttacks = asArray(warItem.attacks);

                      const warStars = warAttacks.reduce(
                        (sum, attack) => sum + num(attack.stars),
                        0,
                      );

                      const warDestruction = warAttacks.length
                        ? warAttacks.reduce(
                            (sum, attack) => sum + num(attack.destructionPercentage),
                            0,
                          ) / warAttacks.length
                        : 0;

                      const hasThreeStar = warAttacks.some(
                        attack => num(attack.stars) >= 3,
                      );

                      return (
                        <div
                          key={`${str(warItem.warId, String(index))}`}
                          className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-bold text-white">
                              {str(warItem.opponentName, 'Opponent')}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-600">
                              {formatDate(warItem.endTime)} ·{' '}
                              {warAttacks.length} attack
                              {warAttacks.length === 1 ? '' : 's'}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-data text-sm font-black text-white">
                                {warStars} ★
                              </p>
                              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                {pct(warDestruction)}
                              </p>
                            </div>

                            <span
                              className={`rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                                hasThreeStar
                                  ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                  : warStars > 0
                                    ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
                                    : 'border-white/10 bg-white/[0.03] text-slate-600'
                              }`}
                            >
                              {warAttacks.length === 0
                                ? 'NO ATTACKS'
                                : hasThreeStar
                                  ? '3 STAR'
                                  : warStars > 0
                                    ? 'ACTIVE'
                                    : 'NO STARS'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : !archiveLoaded ? (
                <p className="mt-2 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-600">
                  Loading combat history…
                </p>
              ) : historicalWars.length ? (
                <>
                  <p className="mb-4 text-xs text-slate-500">
                    From the official clan war log. ClashIQ will build a richer,
                    ongoing history for this player as the clan uses the app.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                      icon={Swords}
                      label="Historical Wars"
                      value={num(historical.wars)}
                      sub="From Persistent War Archive"
                    />

                    <Stat
                      icon={Swords}
                      label="Attacks"
                      value={histAttacks}
                      sub={`Missed wars ${histMissed}`}
                    />

                    <Stat
                      icon={Star}
                      label="Stars"
                      value={histStars}
                      sub={`3★ attacks ${histThreeStars}`}
                    />

                    <Stat
                      icon={Zap}
                      label="Avg. Destruction"
                      value={pct(histAvgDestruction)}
                      sub={`Best ${pct(num(historical.maxDestruction))}`}
                    />
                  </div>

                  <div className="mt-5 space-y-2">
                    {historicalWars.slice(0, 10).map((warItem, index) => {
                      const warAttacks = asArray(warItem.attacks);

                      const warStars = warAttacks.reduce(
                        (sum, attack) => sum + num(attack.stars),
                        0,
                      );

                      const warDestruction = warAttacks.length
                        ? warAttacks.reduce(
                            (sum, attack) => sum + num(attack.destructionPercentage),
                            0,
                          ) / warAttacks.length
                        : 0;

                      const hasThreeStar = warAttacks.some(
                        attack => num(attack.stars) >= 3,
                      );

                      return (
                        <div
                          key={index}
                          className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-bold text-white">
                              {str(warItem.opponentName, 'Opponent')}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-600">
                              {formatDate(warItem.endTime)} · {warAttacks.length} attacks
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-data text-sm font-black text-white">
                                {warStars} ★
                              </p>
                              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                {pct(warDestruction)}
                              </p>
                            </div>

                            <span
                              className={`rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                                hasThreeStar
                                  ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                  : warStars > 0
                                    ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
                                    : 'border-white/10 bg-white/[0.03] text-slate-600'
                              }`}
                            >
                              {hasThreeStar
                                ? '3 STAR'
                                : warStars > 0
                                  ? 'ACTIVE'
                                  : 'NO STARS'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-600">
                  No historical war records are available for this player yet.
                  ClashIQ will start building this the next time the clan is
                  active in the app.
                </p>
              )}
            </section>

            {/* Achievements + labels */}
            <section className="grid gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5">
                    <Trophy className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                      Progression
                    </p>
                    <h2 className="text-lg font-black">
                      Achievements
                    </h2>
                  </div>
                </div>

                {achievements.length ? (
                  <div className="space-y-2">
                    {achievements.slice(0, 12).map((achievement, index) => {
                      const value = num(achievement.value);
                      const target = num(
                        achievement.target,
                        Math.max(value, 1),
                      );

                      return (
                        <Progress
                          key={`${str(achievement.name)}-${index}`}
                          name={str(achievement.name, 'Achievement')}
                          value={value}
                          max={target}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-600">
                    No achievement data available.
                  </p>
                )}
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-2.5">
                    <Sparkles className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                      Profile intelligence
                    </p>
                    <h2 className="text-lg font-black">
                      Labels & Player Overview
                    </h2>
                  </div>
                </div>

                {labels.length ? (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label, index) => (
                      <span
                        key={`${str(label.name)}-${index}`}
                        className="rounded-lg border border-blue-400/15 bg-blue-400/[0.05] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-200"
                      >
                        {str(label.name, 'Label')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    No profile labels returned by the API.
                  </p>
                )}

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">
                      Town Hall
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {townHall || '—'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">
                      War impact
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {warResultLabel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">
                      Clan role
                    </p>
                    <p className="mt-1 text-lg font-black capitalize">
                      {role}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">
                      Account level
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {num(profile.expLevel) || '—'}
                    </p>
                  </div>
                </div>
              </article>
            </section>

            {/* Tactical navigation */}
            <section className="relative overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-r from-[#17130b] via-[#11151c] to-[#0b0f17] p-5 shadow-xl">
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />

              <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-amber-300" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                      Tactical command
                    </p>
                  </div>

                  <h2 className="mt-2 text-xl font-black">
                    Analyze this player with CLASHIQ AI
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    Move from player intelligence directly into war planning
                    and AI-assisted tactical analysis.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/ai-coach"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-amber-300"
                  >
                    <Sparkles className="size-4" />
                    AI Coach
                  </Link>

                  <Link
                    href="/war-planner"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:border-amber-400/20 hover:text-white"
                  >
                    War Planner
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </div>
            </section>

            {/* Footer navigation */}
            <div className="flex flex-wrap items-center gap-3 pb-4">
              <Link
                href="/members"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:border-amber-400/20 hover:text-white"
              >
                <Users className="size-4" />
                Back to Members
              </Link>

              <Link
                href="/war-center"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:border-red-400/20 hover:text-white"
              >
                <Swords className="size-4" />
                War Center
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
