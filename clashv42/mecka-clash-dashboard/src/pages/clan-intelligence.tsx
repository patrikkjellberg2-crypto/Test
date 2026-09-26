import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useGetClashDashboard } from '@workspace/api-client-react';
import {
  ArrowLeft,
  Gauge,
  Gift,
  Swords,
  Users,
  Landmark,
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { ClashIQInlineBanner } from '@/components/clashiq-inline-banner';

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => (v && typeof v === 'object' ? (v as Dict) : {});
const arr = (v: unknown): Dict[] => (Array.isArray(v) ? v.map(d) : []);
const s = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const n = (v: unknown, fallback = 0) => {
  const value = Number(v);
  return Number.isFinite(value) ? value : fallback;
};

type PlayerStat = {
  playerTag: string;
  attacksPossible: number;
  attacksUsed: number;
};

type MetricBar = {
  key: string;
  label: string;
  icon: typeof Gauge;
  percent: number | null;
  headline: string;
  detail: string;
  definition: string;
};

function Bar({ metric }: { metric: MetricBar }) {
  return (
    <div className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5 shadow-[0_16px_50px_rgba(0,0,0,.18)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/[.06] text-amber-300">
            <metric.icon className="size-4" />
          </div>
          <p className="text-sm font-black">{metric.label}</p>
        </div>
        <p className="text-lg font-black tabular-nums">
          {metric.percent === null ? '—' : `${Math.round(metric.percent)}%`}
        </p>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all"
          style={{ width: `${Math.min(100, Math.max(metric.percent === null ? 0 : 4, metric.percent ?? 0))}%` }}
        />
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-400">{metric.headline}</p>
      <p className="mt-1 text-[11px] text-slate-600">{metric.detail}</p>
      <p className="mt-2 text-[10px] leading-4 text-slate-600/80">{metric.definition}</p>
    </div>
  );
}

export default function ClanIntelligencePage() {
  const { data, isLoading, isError } = useGetClashDashboard();
  const dashboard = data as unknown as Dict | undefined;

  const clan = d(dashboard?.clan);
  const clanTag = s(dashboard?.clanTag);
  const roster = arr(dashboard?.members);
  const capitalSeasons = arr(dashboard?.capitalRaidSeasons);

  const [archive, setArchive] = useState<{ wars: Dict[]; players: PlayerStat[] } | null>(null);
  const [archiveError, setArchiveError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/clash/war-archive')
      .then(response => (response.ok ? response.json() : Promise.reject()))
      .then(value => {
        if (!cancelled) {
          setArchive({
            wars: Array.isArray(value?.wars) ? value.wars : [],
            players: Array.isArray(value?.players) ? value.players : [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) setArchiveError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const warPerformance = useMemo(() => {
    if (!archive) return null;
    const finished = archive.wars.filter(w => s(w.state) === 'warEnded');
    if (!finished.length) return null;

    let wins = 0;
    for (const w of finished) {
      const result = s(w.result);
      const clanStars = n(w.clanStars);
      const opponentStars = n(w.opponentStars);
      const clanDestruction = n(w.clanDestruction);
      const opponentDestruction = n(w.opponentDestruction);
      const won =
        result === 'win' ||
        (result !== 'lose' &&
          result !== 'tie' &&
          (clanStars !== opponentStars
            ? clanStars > opponentStars
            : clanDestruction > opponentDestruction));
      if (won) wins += 1;
    }

    return { wins, total: finished.length, percent: (wins / finished.length) * 100 };
  }, [archive]);

  const participation = useMemo(() => {
    if (!archive || !archive.players.length) return null;
    const totals = archive.players.reduce(
      (sum, p) => ({
        used: sum.used + n(p.attacksUsed),
        possible: sum.possible + n(p.attacksPossible),
      }),
      { used: 0, possible: 0 },
    );
    if (!totals.possible) return null;
    return { ...totals, percent: (totals.used / totals.possible) * 100 };
  }, [archive]);

  const donationBalance = useMemo(() => {
    if (!roster.length) return null;
    const totals = roster.reduce(
      (sum, member) => ({
        given: sum.given + n(member.donations),
        received: sum.received + n(member.donationsReceived),
      }),
      { given: 0, received: 0 },
    );
    const denominator = totals.given + totals.received;
    if (!denominator) return null;
    return { ...totals, percent: (totals.given / denominator) * 100 };
  }, [roster]);

  const capital = useMemo(() => {
    const season = capitalSeasons[0];
    if (!season) return null;
    const members = arr(season.members);
    const attackers = members.filter(m => n(m.attacks) > 0).length;
    const rosterSize = roster.length || members.length;
    if (!rosterSize) return null;
    return {
      attackers,
      rosterSize,
      loot: n(season.capitalTotalLoot),
      percent: (attackers / rosterSize) * 100,
    };
  }, [capitalSeasons, roster]);

  const metrics: MetricBar[] = [
    {
      key: 'war',
      label: 'War Performance',
      icon: Swords,
      percent: warPerformance ? warPerformance.percent : null,
      headline: warPerformance
        ? `${warPerformance.wins} wins of ${warPerformance.total} finished wars`
        : 'Not enough finished wars captured yet',
      detail: 'Source: ClashIQ war archive',
      definition: 'Win rate across every finished war ClashIQ has captured for this clan.',
    },
    {
      key: 'participation',
      label: 'War Participation',
      icon: Gauge,
      percent: participation ? participation.percent : null,
      headline: participation
        ? `${participation.used} of ${participation.possible} available attacks used`
        : 'Not enough war data captured yet',
      detail: 'Source: ClashIQ war archive',
      definition: 'Share of available war attacks that were actually used, across every captured war.',
    },
    {
      key: 'donations',
      label: 'Donations',
      icon: Gift,
      percent: donationBalance ? donationBalance.percent : null,
      headline: donationBalance
        ? `${donationBalance.given.toLocaleString('en-US')} given · ${donationBalance.received.toLocaleString('en-US')} received`
        : 'No donation data available',
      detail: 'Source: live clan roster',
      definition: 'Share of total donation activity that was given rather than received. 50% is balanced.',
    },
    {
      key: 'capital',
      label: 'Capital Raids',
      icon: Landmark,
      percent: capital ? capital.percent : null,
      headline: capital
        ? `${capital.attackers} of ${capital.rosterSize} members attacked · ${capital.loot.toLocaleString('en-US')} loot`
        : 'No recent Capital Raid season available',
      detail: 'Source: latest Capital Raid season',
      definition: 'Share of the roster that used at least one Capital Raid attack in the latest season.',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#02070d] p-6 text-white">
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="h-14 animate-pulse rounded-2xl bg-white/[.05]" />
          <div className="h-72 animate-pulse rounded-3xl bg-white/[.05]" />
        </div>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#02070d] p-6 text-white">
        <p className="text-sm text-white/50">Clan data is not available right now.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-screen bg-[#07090d]">
        <AppSidebar clanName={s(clan.name, 'CLASHIQ')} clanTag={clanTag} />

        <main className="min-w-0 flex-1">
          <ClashIQInlineBanner />

          <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-16 pt-2 md:px-7">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 transition hover:text-amber-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Command Center
              </Link>

              <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight md:text-3xl">
                <Users className="h-6 w-6 text-amber-300" />
                Clan Intelligence
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Four real, data-backed metrics for the clan. Each bar states exactly
                what it measures and where the numbers come from — not an
                arbitrary grade.
              </p>
            </div>

            {archiveError && (
              <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs font-semibold text-amber-200">
                Could not reach the war archive. War Performance and War
                Participation are unavailable right now; donation and Capital
                Raid figures still use live data below.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {metrics.map(metric => (
                <Bar key={metric.key} metric={metric} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
