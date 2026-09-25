import { useEffect, useMemo, useState } from 'react';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { AppSidebar } from '@/components/app-sidebar';
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Crown,
  Flag,
  Menu,
  MapPinned,
  RefreshCw,
  Shield,
  ShieldAlert,
  Swords,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';

type Dict = Record<string, unknown>;
type DashboardShape = {
  clan: unknown;
  members: unknown[];
  currentWar: unknown;
  clanTag: string;
  apiConfigured: boolean;
};

const asDict = (value: unknown): Dict =>
  value && typeof value === 'object' ? (value as Dict) : {};
const asArray = (value: unknown): Dict[] =>
  Array.isArray(value) ? value.map(asDict) : [];
const str = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;
const num = (value: unknown, fallback = 0) =>
  typeof value === 'number' ? value : fallback;
const label = (value: unknown, fallback = '—') => str(value, fallback);
const isActiveWarState = (value: unknown) =>
  ['preparation', 'inwar', 'matchmaking'].includes(str(value).toLowerCase());

const formatDate = (value: unknown, withTime = false) => {
  const date = new Date(str(value));
  if (Number.isNaN(date.getTime())) return 'No end time recorded';
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};
function formatCountdown(endTime: unknown) {
  const end = new Date(str(endTime)).getTime();
  if (!Number.isFinite(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 'Ended';
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  return `${hours}h ${minutes}m left`;
}

function useCountdown(endTime: unknown) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return formatCountdown(endTime);
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'MC';

function SwedishMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f4c542] text-[#0b2b45] shadow-[inset_0_-2px_0_rgba(11,43,69,.12)] ${small ? 'size-9' : 'size-12'}`}
      data-testid="brand-mark"
    >
      <span className="absolute left-[35%] top-0 h-full w-[16%] bg-[#0b5fa5]" />
      <span className="absolute left-0 top-[38%] h-[16%] w-full bg-[#0b5fa5]" />
      <Shield
        className={`relative z-10 ${small ? 'size-4' : 'size-5'}`}
        strokeWidth={2.5}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="flex min-h-[100dvh]">
        <aside className="hidden w-[260px] shrink-0 bg-sidebar p-5 lg:block">
          <div className="h-12 w-40 animate-pulse rounded-xl bg-sidebar-accent/30" />
          <div className="mt-14 space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-11 animate-pulse rounded-lg bg-sidebar-accent/20"
              />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto max-w-[1400px]">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-8 h-40 animate-pulse rounded-3xl bg-muted" />
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-6 dashboard-grid">
      <section className="w-full max-w-[520px] rounded-3xl border border-[#cf5b4d]/30 bg-card p-8 text-center shadow-lg">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#cf5b4d]/12 text-[#a84439]">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-[-.04em]">
          Could not load the war
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The official Clash of Clans service did not respond. Try again when the connection is available.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="button-retry-war-center"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      </section>
    </div>
  );
}

function EmptyWarState() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-6 dashboard-grid">
      <section className="w-full max-w-[560px] rounded-3xl border border-card-border bg-card p-8 text-center shadow-lg md:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <Swords className="size-7" />
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[.18em] text-primary">
          Mecka Clash / War Center
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-.05em]">
          No active war right now
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          When the next war starts, attack status, stars and a recommended order will appear here.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-105"
        >
          <ArrowLeft className="size-4" />
          Back to overview
        </Link>
      </section>
    </div>
  );
}

function StatusPill({ state }: { state: string }) {
  const active = state.toLowerCase() === 'inwar';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${
        active
          ? 'bg-[#f4c542]/20 text-[#9c6e00]'
          : 'bg-secondary text-muted-foreground'
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          active ? 'animate-pulse-line bg-[#e2a900]' : 'bg-muted-foreground'
        }`}
      />
      {active ? 'In War' : label(state, 'Unknown status')}
    </span>
  );
}

function StatTile({
  icon: Icon,
  title,
  value,
  detail,
  tone,
}: {
  icon: typeof Trophy;
  title: string;
  value: string;
  detail: string;
  tone: 'blue' | 'gold' | 'green';
}) {
  const tones = {
    blue: 'bg-[#0b5fa5]/10 text-[#0b5fa5]',
    gold: 'bg-[#f4c542]/20 text-[#9c6e00]',
    green: 'bg-[#2b9f78]/12 text-[#267a5e]',
  };
  return (
    <article className="rounded-2xl border border-card-border bg-card p-4 shadow-sm">
      <div className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-[18px]" />
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 font-display text-[28px] font-bold tracking-[-.05em]">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

export default function WarCenterPage() {
  const { data, isLoading, isError, refetch } = useGetClashDashboard();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dashboard = data as unknown as DashboardShape | undefined;
  const currentWar = asDict(dashboard?.currentWar);
  const clan = asDict(currentWar.clan);
  const opponent = asDict(currentWar.opponent);
  const memberProfiles = useMemo(() => {
    const profiles: Record<string, Dict> = {};
    for (const member of asArray(dashboard?.members)) {
      const tag = str(member.tag);
      if (tag) profiles[tag] = member;
    }
    return profiles;
  }, [dashboard?.members]);
  const members = useMemo(
    () =>
      asArray(clan.members).sort(
        (a, b) => num(a.mapPosition, 999) - num(b.mapPosition, 999),
      ),
    [clan.members],
  );
  const opponentMembers = useMemo(
    () => asArray(opponent.members),
    [opponent.members],
  );
  const hasWar = isActiveWarState(currentWar.state);

  const memberStats = useMemo(
    () =>
      members.map((member) => {
        const attacks = asArray(member.attacks);
        const stars = attacks.reduce(
          (sum, attack) => sum + num(attack.stars),
          0,
        );
        const destruction = attacks.length
          ? Math.round(
              attacks.reduce(
                (sum, attack) => sum + num(attack.destructionPercentage),
                0,
              ) / attacks.length,
            )
          : 0;
        const attacksRemaining = Math.max(0, 2 - attacks.length);
        const target = opponentMembers.find(
          (candidate) =>
            num(candidate.mapPosition) === num(member.mapPosition),
        );
        return {
          member,
          attacksUsed: attacks.length,
          attacksRemaining,
          stars,
          destruction,
          target,
        };
      }),
    [members, opponentMembers],
  );

  const attackOrder = useMemo(
    () =>
      [...memberStats]
        .filter((item) => item.attacksRemaining > 0)
        .sort((a, b) => {
          if (b.attacksRemaining !== a.attacksRemaining) {
            return b.attacksRemaining - a.attacksRemaining;
          }
          if (num(b.member.townhallLevel) !== num(a.member.townhallLevel)) {
            return num(b.member.townhallLevel) - num(a.member.townhallLevel);
          }
          return num(a.member.mapPosition) - num(b.member.mapPosition);
        }),
    [memberStats],
  );

  const defensiveAttacks = useMemo(() => {
    const ownByTag = new Map<string, Dict>();
    for (const member of members) {
      const tag = str(member.tag).toUpperCase();
      if (tag) ownByTag.set(tag, member);
    }

    const attacks: Array<{
      attack: Dict;
      defender: Dict;
      attacker: Dict;
    }> = [];

    for (const attacker of opponentMembers) {
      for (const attack of asArray(attacker.attacks)) {
        const defenderTag = str(attack.defenderTag).toUpperCase();
        const defender = ownByTag.get(defenderTag);
        if (defender) attacks.push({ attack, defender, attacker });
      }
    }

    return attacks.sort(
      (a, b) => num(b.defender.mapPosition, 999) - num(a.defender.mapPosition, 999),
    );
  }, [members, opponentMembers]);

  const targetMap = useMemo(() => {
    const byTag = new Map<
      string,
      { opponent: Dict; hits: { attackerName: string; stars: number; destructionPercentage: number }[] }
    >();
    for (const opponentMember of opponentMembers) {
      const tag = str(opponentMember.tag).toUpperCase();
      if (tag) byTag.set(tag, { opponent: opponentMember, hits: [] });
    }
    for (const member of members) {
      for (const attack of asArray(member.attacks)) {
        const defenderTag = str(attack.defenderTag).toUpperCase();
        const entry = byTag.get(defenderTag);
        if (entry) {
          entry.hits.push({
            attackerName: label(member.name, 'Unknown'),
            stars: num(attack.stars),
            destructionPercentage: num(attack.destructionPercentage),
          });
        }
      }
    }
    return Array.from(byTag.values()).sort(
      (a, b) => num(a.opponent.mapPosition, 999) - num(b.opponent.mapPosition, 999),
    );
  }, [members, opponentMembers]);

  const countdown = useCountdown(currentWar.endTime);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!dashboard?.apiConfigured || !hasWar) return <EmptyWarState />;

  const attacksUsed = memberStats.reduce(
    (sum, item) => sum + item.attacksUsed,
    0,
  );
  const attacksRemaining = memberStats.reduce(
    (sum, item) => sum + item.attacksRemaining,
    0,
  );
  const stars = num(clan.stars);
  const opponentStars = num(opponent.stars);
  const destruction = Math.round(num(clan.destructionPercentage));

  return (
    <div className="min-h-[100dvh] bg-background dashboard-grid">
      <div className="flex min-h-[100dvh]">
        <AppSidebar clanName={label(asDict(dashboard.clan).name, 'Mecka Clash')} clanTag={label(dashboard.clanTag, '#2Q0Q82C9R')} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="min-w-0 flex-1">
          <header className="border-b border-border/80 bg-background/80 px-5 py-4 backdrop-blur-md md:px-8">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="rounded-xl border border-border bg-card p-2 lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="size-4" />
                </button>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                    Live krig / {label(currentWar.state, 'status')}
                  </p>
                  <h1 className="mt-1 font-display text-xl font-bold tracking-[-.05em] md:text-2xl">
                    War Center
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 text-right sm:flex">
                  <span className="size-2 rounded-full bg-[#2b9f78]" />
                  <div>
                    <p className="text-xs font-bold">Live feed</p>
                    <p className="text-[10px] text-muted-foreground">
                      Official data
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="grid size-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Uppdatera kriget"
                  data-testid="button-refresh-war-center"
                >
                  <RefreshCw className="size-4" />
                </button>
                <div className="grid size-9 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                  MC
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] space-y-5 px-5 py-6 md:px-8 md:py-8">
            <section
              className="relative overflow-hidden rounded-3xl bg-sidebar p-6 text-sidebar-foreground shadow-lg md:p-8"
              data-testid="card-war-hero"
            >
              <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full border-[28px] border-sidebar-primary/10" />
              <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
                <div>
                  <div className="flex items-center gap-3">
                    <SwedishMark />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-3xl font-bold tracking-[-.065em] md:text-4xl">
                          {label(clan.name, 'Our clan')}
                        </h2>
                        <StatusPill state={str(currentWar.state)} />
                      </div>
                      <p className="mt-2 text-sm text-sidebar-foreground/60">
                        vs. {label(opponent.name, 'the opponent')} ·{' '}
                        {num(currentWar.teamSize)} vs. {num(currentWar.teamSize)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative border-t border-sidebar-foreground/10 pt-5 md:min-w-[260px] md:border-l md:border-t-0 md:pl-7 md:pt-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-sidebar-foreground/45">
                    Score
                  </p>
                  <p className="mt-1 font-data text-4xl font-bold">
                    {stars}
                    <span className="text-sidebar-foreground/35"> : </span>
                    {opponentStars}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-sidebar-foreground/15">
                    <div
                      className="h-full rounded-full bg-sidebar-accent transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(4, destruction))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-sidebar-foreground/55">
                    {destruction}% destruction ·{' '}
                    {formatDate(currentWar.endTime, true)}
                  </p>
                  {countdown && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-sidebar-accent">
                      <Clock3 className="size-3" />
                      {countdown}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3" aria-label="War status">
              <StatTile
                icon={Zap}
                title="Attacks used"
                value={`${attacksUsed}/${members.length * 2}`}
                detail={`${attacksRemaining} attacks remaining`}
                tone="blue"
              />
              <StatTile
                icon={ShieldAlert}
                title="Needs attack"
                value={String(attackOrder.length)}
                detail="members in queue"
                tone="gold"
              />
              <StatTile
                icon={Trophy}
                title="Our stars"
                value={String(stars)}
                detail={`${destruction}% average destruction`}
                tone="green"
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
              <article
                className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm"
                data-testid="card-attack-order"
              >
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-primary" />
                    <h2 className="text-sm font-bold">Recommended order</h2>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                    {attackOrder.length} remaining
                  </span>
                </div>
                <div className="border-b border-border/70 bg-secondary/35 px-5 py-3 text-xs leading-5 text-muted-foreground">
                  Prioritizes members with attacks remaining, higher Town Hall and
                  lower map position.
                </div>
                {attackOrder.length ? (
                  <div className="divide-y divide-border/60">
                    {attackOrder.slice(0, 8).map((item, index) => (
                      <div
                        key={str(item.member.tag, String(index))}
                        className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-secondary/40"
                        data-testid={`row-attack-order-${index}`}
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 font-data text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f4c542]/20 text-[10px] font-bold text-[#9c6e00]">
                          {initials(label(item.member.name, 'MC'))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {label(item.member.name, 'Unknown member')}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            TH {num(item.member.townhallLevel)} · map #
                            {num(item.member.mapPosition)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-data text-sm font-bold text-[#9c6e00]">
                            {item.attacksRemaining} remaining
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            target #{num(item.target?.mapPosition, num(item.member.mapPosition))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[230px] flex-col items-center justify-center px-6 text-center">
                    <CheckCircle2 className="size-8 text-[#2b9f78]" />
                    <p className="mt-3 text-sm font-bold">
                      All attacks are used
                    </p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                      Good work. Follow the opponent’s remaining attacks here
                      as the war develops.
                    </p>
                  </div>
                )}
                <div className="border-t border-border/70 px-5 py-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <CalendarClock className="size-3.5 text-primary" />
                    War ends {formatDate(currentWar.endTime, true)}
                  </span>
                </div>
              </article>

              <article
                className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm"
                data-testid="card-war-members"
              >
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    <h2 className="text-sm font-bold">Members' attacks</h2>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                    {members.length} in war
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[690px] text-left">
                    <thead>
                      <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
                        <th className="px-5 py-3 font-bold">Member</th>
                        <th className="px-3 py-3 font-bold">TH</th>
                        <th className="px-3 py-3 font-bold">Attacks</th>
                        <th className="px-3 py-3 font-bold">Stars</th>
                        <th className="px-3 py-3 font-bold">Destruction</th>
                        <th className="px-5 py-3 text-right font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {memberStats.map((item, index) => (
                        <tr
                          key={str(item.member.tag, String(index))}
                          className={`transition hover:bg-secondary/40 ${
                            item.attacksRemaining > 0
                              ? 'bg-[#f4c542]/[0.07]'
                              : ''
                          }`}
                          data-testid={`row-war-member-${index}`}
                        >
                          <td className="px-5 py-3">
                            <Link
                              href={`/player/${encodeURIComponent(str(item.member.tag))}`}
                              className="flex w-full items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                              data-testid={`button-war-member-${index}`}
                              aria-label={`Open player card for ${label(item.member.name, 'Unknown member')}`}
                            >
                              <div
                                className={`grid size-8 place-items-center rounded-lg text-[10px] font-bold ${
                                  item.attacksRemaining > 0
                                    ? 'bg-[#f4c542]/25 text-[#9c6e00]'
                                    : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {item.attacksRemaining > 0 ? (
                                  <Swords className="size-3.5" />
                                ) : (
                                  initials(label(item.member.name, 'MC'))
                                )}
                              </div>
                              <div>
                                <p className="max-w-[170px] truncate text-sm font-bold hover:text-primary">
                                  {label(item.member.name, 'Unknown member')}
                                </p>
                                <p className="font-data text-[10px] text-muted-foreground">
                                  #{String(num(item.member.mapPosition, index + 1)).padStart(2, '0')}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-3 py-3 font-data text-xs font-bold">
                            {num(item.member.townhallLevel)}
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-data text-xs font-bold">
                              {item.attacksUsed}/2
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {item.attacksRemaining} remaining
                            </span>
                          </td>
                          <td className="px-3 py-3 font-data text-xs font-bold">
                            {item.stars}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${item.destruction}%` }}
                                />
                              </div>
                              <span className="font-data text-xs font-bold">
                                {item.destruction}%
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {item.attacksRemaining > 0 ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4c542]/20 px-2 py-1 text-[10px] font-bold text-[#9c6e00]">
                                <CircleDot className="size-3" />
                                Needs attack
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2b9f78]/12 px-2 py-1 text-[10px] font-bold text-[#267a5e]">
                                <CheckCircle2 className="size-3" />
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>

            <article
              className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm"
              data-testid="card-target-map"
            >
              <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                <div className="flex items-center gap-2">
                  <MapPinned className="size-4 text-primary" />
                  <h2 className="text-sm font-bold">Target map</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                  {opponentMembers.length} bases
                </span>
              </div>
              <div className="border-b border-border/70 bg-secondary/35 px-5 py-3 text-xs leading-5 text-muted-foreground">
                Every opponent base, sorted by map position. Green is 3-starred,
                amber has been hit but is still open, gray has not been attacked
                yet.
              </div>
              <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8">
                {targetMap.map((entry, index) => {
                  const bestStars = entry.hits.length
                    ? Math.max(...entry.hits.map((hit) => hit.stars))
                    : 0;
                  const bestDestruction = entry.hits.length
                    ? Math.max(...entry.hits.map((hit) => hit.destructionPercentage))
                    : 0;
                  const attackedBy = entry.hits.length
                    ? Array.from(new Set(entry.hits.map((hit) => hit.attackerName))).join(', ')
                    : 'Not attacked yet';
                  const tone =
                    bestStars >= 3
                      ? 'border-[#2b9f78]/40 bg-[#2b9f78]/10 text-[#267a5e]'
                      : entry.hits.length
                        ? 'border-[#f4c542]/40 bg-[#f4c542]/10 text-[#9c6e00]'
                        : 'border-border bg-secondary/30 text-muted-foreground';
                  return (
                    <div
                      key={str(entry.opponent.tag, String(index))}
                      className={`rounded-xl border p-2.5 text-center ${tone}`}
                      title={attackedBy}
                      data-testid={`tile-target-${index}`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        #{num(entry.opponent.mapPosition, index + 1)}
                      </p>
                      <p className="mt-0.5 font-data text-sm font-black">
                        TH{num(entry.opponent.townhallLevel)}
                      </p>
                      <p className="mt-1 text-[11px] font-bold">
                        {entry.hits.length ? `${bestStars}★ · ${bestDestruction}%` : 'Open'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </article>

            <article
              className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm"
              data-testid="card-defensive-attacks"
            >
              <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-primary" />
                  <h2 className="text-sm font-bold">Defensive Attacks</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                  {defensiveAttacks.length} received
                </span>
              </div>
              {defensiveAttacks.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[690px] text-left">
                    <thead>
                      <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
                        <th className="px-5 py-3">Our base</th>
                        <th className="px-3 py-3">TH</th>
                        <th className="px-3 py-3">Attacker</th>
                        <th className="px-3 py-3">Stars</th>
                        <th className="px-3 py-3">Destruction</th>
                        <th className="px-5 py-3 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {defensiveAttacks.slice(0, 20).map((item, index) => {
                        const starsAgainstUs = num(item.attack.stars);
                        const destructionAgainstUs = num(item.attack.destructionPercentage);
                        return (
                          <tr key={`${str(item.attacker.tag, index.toString())}-${str(item.defender.tag, index.toString())}-${index}`} className="transition hover:bg-secondary/40">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                                  {initials(label(item.defender.name, 'MC'))}
                                </div>
                                <div>
                                  <p className="max-w-[170px] truncate text-sm font-bold">{label(item.defender.name, 'Unknown member')}</p>
                                  <p className="font-data text-[10px] text-muted-foreground">#{String(num(item.defender.mapPosition, index + 1)).padStart(2, '0')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 font-data text-xs font-bold">{num(item.defender.townhallLevel)}</td>
                            <td className="px-3 py-3 text-sm font-bold">{label(item.attacker.name, 'Unknown attacker')}</td>
                            <td className="px-3 py-3 font-data text-xs font-bold">{starsAgainstUs}</td>
                            <td className="px-3 py-3 font-data text-xs font-bold">{destructionAgainstUs}%</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ${starsAgainstUs === 0 ? 'bg-[#2b9f78]/12 text-[#267a5e]' : starsAgainstUs === 1 ? 'bg-[#f4c542]/20 text-[#9c6e00]' : 'bg-[#cf5b4d]/12 text-[#a84439]'}`}>
                                {starsAgainstUs === 0 ? 'Defended' : `${starsAgainstUs} star${starsAgainstUs === 1 ? '' : 's'}`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex min-h-[150px] items-center justify-center px-6 text-center">
                  <p className="text-xs text-muted-foreground">No defensive attacks recorded yet.</p>
                </div>
              )}
            </article>

            <footer className="flex flex-col justify-between gap-2 border-t border-border/70 pt-5 text-[11px] text-muted-foreground sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
              >
                <ArrowLeft className="size-3.5" />
                Back to overview
              </Link>
              <p className="flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                Live data from the Clash of Clans API
                <ChevronRight className="ml-1 size-3" />
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}