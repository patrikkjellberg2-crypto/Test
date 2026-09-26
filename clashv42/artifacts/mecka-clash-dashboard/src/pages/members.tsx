import { useMemo } from 'react';
import { Link } from 'wouter';
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Crown,
  Shield,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { AppSidebar } from '@/components/app-sidebar';
import { ClashIQInlineBanner } from '@/components/clashiq-inline-banner';

type Dict = Record<string, unknown>;

const asArray = (v: unknown): Dict[] =>
  Array.isArray(v)
    ? v.map((x) =>
        x && typeof x === 'object' ? (x as Dict) : {},
      )
    : [];

const asDict = (v: unknown): Dict =>
  v && typeof v === 'object' ? (v as Dict) : {};

const str = (v: unknown, fallback = '') =>
  typeof v === 'string' ? v : fallback;

const num = (v: unknown, fallback = 0) =>
  typeof v === 'number' ? v : fallback;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'CQ';

function getTownHall(member: Dict) {
  return num(
    member.townHallLevel,
    num(member.townhallLevel, 0),
  );
}

function getRole(member: Dict) {
  return str(member.role, 'Member');
}

function roleLabel(role: string) {
  const normalized = role.toLowerCase();

  if (normalized.includes('leader')) return 'Leader';
  if (normalized.includes('co')) return 'Co-Leader';
  if (normalized.includes('elder')) return 'Elder';

  return 'Member';
}

function roleClass(role: string) {
  const normalized = role.toLowerCase();

  if (normalized.includes('leader')) {
    return 'border-amber-400/25 bg-amber-400/10 text-amber-300';
  }

  if (normalized.includes('co')) {
    return 'border-blue-400/25 bg-blue-400/10 text-blue-300';
  }

  if (normalized.includes('elder')) {
    return 'border-purple-400/25 bg-purple-400/10 text-purple-300';
  }

  return 'border-white/10 bg-white/[0.03] text-slate-500';
}

function LoadingScreen() {
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
          Loading member intelligence...
        </p>
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] p-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11151c] p-8 text-center shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-red-400/20 bg-red-400/10">
          <Shield className="h-6 w-6 text-red-300" />
        </div>

        <h1 className="mt-5 text-2xl font-black">
          Member Intelligence Offline
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          CLASHIQ could not retrieve the current clan roster.
        </p>
      </section>
    </div>
  );
}

export default function MembersPage() {
  const {
    data,
    isLoading,
    isError,
  } = useGetClashDashboard();

  const d = data as unknown as Dict | undefined;

  const clan = asDict(d?.clan);

  const members = useMemo(
    () =>
      asArray(d?.members).sort(
        (a, b) =>
          num(a.clanRank, 99) -
          num(b.clanRank, 99),
      ),
    [d?.members],
  );

  const leaders = members.filter((member) => {
    const role = getRole(member).toLowerCase();
    return (
      role.includes('leader') ||
      role.includes('co')
    );
  }).length;

  const totalTrophies = members.reduce(
    (total, member) =>
      total + num(member.trophies),
    0,
  );

  const averageTownHall =
    members.length > 0
      ? (
          members.reduce(
            (total, member) =>
              total + getTownHall(member),
            0,
          ) / members.length
        ).toFixed(1)
      : '0.0';

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError) {
    return <ErrorScreen />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-screen bg-[#07090d]">
        <AppSidebar
          clanName={str(clan.name, 'CLASHIQ')}
          clanTag={str(d?.clanTag, '#2Q0Q82C9R')}
        />

        <main className="min-w-0 flex-1">
          <ClashIQInlineBanner />
          {/* Header */}
          <header className="border-b border-white/5 bg-[#07090d]/85 px-5 py-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 transition hover:text-amber-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Command Center
                </Link>

                <div className="mt-2 flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">
                    Members
                  </h1>

                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                    Elite
                  </span>
                </div>
              </div>

              <div className="hidden items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-2 sm:flex">
                <Activity className="h-4 w-4 text-emerald-400" />

                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">
                  Roster online
                </span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-6 md:px-8 md:py-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-br from-[#17130b] via-[#0e1117] to-[#090b10] p-6 shadow-2xl md:p-8">
              <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />

              <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5">
                      <Users className="h-5 w-5 text-amber-300" />
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
                      Member Intelligence
                    </span>
                  </div>

                  <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                    CLAN
                    <span className="block text-amber-300">
                      COMMAND ROSTER
                    </span>
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                    Monitor your complete clan roster, player strength,
                    rankings, trophies and Town Hall distribution from one
                    tactical command center.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-blue-400/15 bg-blue-400/[0.05] px-3 py-2">
                      <Users className="h-4 w-4 text-blue-300" />

                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                        {members.length}/50 roster
                      </span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-3 py-2">
                      <Crown className="h-4 w-4 text-amber-300" />

                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                        {leaders} leadership
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-amber-400/20 bg-black/20">
                    <div className="absolute inset-3 rounded-full border border-amber-400/10" />
                    <div className="absolute inset-7 rounded-full border border-white/5" />

                    <div className="text-center">
                      <Users className="mx-auto h-8 w-8 text-amber-300" />

                      <p className="mt-2 text-3xl font-black text-white">
                        {members.length}
                      </p>

                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Active roster
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                      Members
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {members.length}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      Current clan roster
                    </p>
                  </div>

                  <Users className="h-5 w-5 text-amber-300" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                      Avg. Town Hall
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {averageTownHall}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      Roster average
                    </p>
                  </div>

                  <Shield className="h-5 w-5 text-blue-300" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                      Total Trophies
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {totalTrophies.toLocaleString('en-US')}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      Combined player trophies
                    </p>
                  </div>

                  <Trophy className="h-5 w-5 text-amber-300" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                      Leadership
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {leaders}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      Leaders & co-leaders
                    </p>
                  </div>

                  <Crown className="h-5 w-5 text-amber-300" />
                </div>
              </div>
            </section>

            {/* Roster */}
            <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                    Active personnel
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Clan Roster
                  </h2>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />

                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Live data
                  </span>
                </div>
              </div>

              {members.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-700" />

                  <h3 className="mt-4 text-sm font-bold text-slate-400">
                    No Members Found
                  </h3>

                  <p className="mt-1 text-xs text-slate-600">
                    The Clash API did not return a clan roster.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {members.map((member, index) => {
                    const tag = str(member.tag);
                    const name = str(
                      member.name,
                      'Unknown player',
                    );
                                        const rank = num(member.clanRank, index + 1);
                    const role = getRole(member);
                    const townHall = getTownHall(member);
                    const trophies = num(member.trophies);
                    const donations = num(member.donations);
                    const warStars = num(member.warStars);

                    return (
                      <Link
                        key={tag || `${name}-${index}`}
                        href={tag ? `/player/${encodeURIComponent(tag)}` : '#'}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117]/90 p-4 transition hover:-translate-y-0.5 hover:border-amber-400/25 hover:bg-[#111720]"
                      >
                        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-400/5 blur-2xl" />

                        <div className="relative flex items-start gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-sm font-black text-amber-300">
                            {initials(name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-black text-white">
                                  {name}
                                </p>
                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                  #{rank} · TH{townHall}
                                </p>
                              </div>

                              <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-amber-300" />
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${roleClass(role)}`}>
                                {roleLabel(role)}
                              </span>

                              <span className="rounded-lg border border-amber-400/10 bg-amber-400/[0.04] px-2 py-1 text-[9px] font-bold text-amber-300">
                                🏆 {trophies.toLocaleString('en-US')}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-600">
                                  Donations
                                </p>
                                <p className="mt-1 text-xs font-black text-slate-300">
                                  {donations.toLocaleString('en-US')}
                                </p>
                              </div>

                              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-600">
                                  War Stars
                                </p>
                                <p className="mt-1 text-xs font-black text-slate-300">
                                  {warStars.toLocaleString('en-US')}
                                </p>
                              </div>

                              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-600">
                                  Town Hall
                                </p>
                                <p className="mt-1 text-xs font-black text-slate-300">
                                  TH{townHall}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
