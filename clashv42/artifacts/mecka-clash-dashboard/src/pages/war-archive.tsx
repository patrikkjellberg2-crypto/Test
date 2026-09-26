import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, RefreshCw, Trophy, WifiOff, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { ClashIQInlineBanner } from '@/components/clashiq-inline-banner';
import {
  WARS_EVENT,
  readWars,
  warOutcome as localWarOutcome,
  warTime as localWarTime,
  type ArchivedWar,
} from '@/lib/war-archive';

type Attack = {
  attackerTag: string;
  defenderTag: string;
  stars: number;
  destructionPercentage: number;
  order: number;
};

type Member = {
  tag: string;
  name: string;
  townhallLevel: number;
  mapPosition: number;
  attacks?: Attack[];
};

type ServerWar = {
  id: string;
  clanTag: string;
  clanName: string | null;
  opponentTag: string;
  opponentName: string | null;
  state: string;
  result: string | null;
  teamSize: number;
  attacksPerMember: number;
  endTime: string;
  clanStars: number;
  clanDestruction: number;
  clanAttacksUsed: number;
  opponentStars: number;
  opponentDestruction: number;
  members: Member[];
  opponentMembers: Member[];
  source: 'live' | 'warlog';
};

type PlayerPerformance = {
  playerTag: string;
  playerName: string;
  warsCounted: number;
  attacksPossible: number;
  attacksUsed: number;
  missedAttacks: number;
  starsTotal: number;
  threeStars: number;
  avgStars: number;
  avgDestruction: number;
  threeStarRate: number;
  recentWars: number;
  recentAvgStars: number;
  previousAvgStars: number;
  recentAvgDestruction: number;
  previousAvgDestruction: number;
  trend: 'improving' | 'declining' | 'stable';
};

type PlayerStat = {
  playerTag: string;
  playerName: string;
  warsCounted: number;
  attacksPossible: number;
  attacksUsed: number;
  starsTotal: number;
  threeStars: number;
  destructionTotal: number;
};

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));

function warTime(value: string) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(value || '');
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

const dateOf = (endTime: string) => {
  const t = warTime(endTime);
  return t ? new Date(t).toLocaleDateString() : '—';
};

function outcomeOf(w: ServerWar): 'win' | 'lose' | 'tie' | 'live' {
  if (w.result === 'win' || w.result === 'lose' || w.result === 'tie') return w.result;
  const finished = w.state === 'warEnded';
  if (!finished) return 'live';
  if (w.clanStars !== w.opponentStars) return w.clanStars > w.opponentStars ? 'win' : 'lose';
  if (w.clanDestruction !== w.opponentDestruction)
    return w.clanDestruction > w.opponentDestruction ? 'win' : 'lose';
  return 'tie';
}

const OUTCOME_STYLE: Record<string, string> = {
  win: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  lose: 'border-red-400/30 bg-red-400/10 text-red-300',
  tie: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  live: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
};

/** Converts a locally-saved war (old format) into the server war shape,
 *  so the UI below can render both the same way. */
function fromLocal(w: ArchivedWar): ServerWar {
  return {
    id: w.id,
    clanTag: w.clan.tag,
    clanName: w.clan.name,
    opponentTag: w.opponent.tag,
    opponentName: w.opponent.name,
    state: w.state,
    result: localWarOutcome(w) === 'live' ? null : localWarOutcome(w),
    teamSize: w.teamSize,
    attacksPerMember: w.attacksPerMember,
    endTime: w.endTime,
    clanStars: w.clan.stars,
    clanDestruction: w.clan.destruction,
    clanAttacksUsed: w.clan.attacks,
    opponentStars: w.opponent.stars,
    opponentDestruction: w.opponent.destruction,
    members: w.members.map(m => ({
      tag: m.tag,
      name: m.name,
      townhallLevel: m.th,
      mapPosition: m.pos,
      attacks: m.attacks.map(a => ({
        attackerTag: a.attackerTag,
        defenderTag: a.defenderTag,
        stars: a.stars,
        destructionPercentage: a.destruction,
        order: a.order,
      })),
    })),
    opponentMembers: w.opponentMembers.map(m => ({
      tag: m.tag,
      name: m.name,
      townhallLevel: m.th,
      mapPosition: m.pos,
    })),
    source: w.members.length ? 'live' : 'warlog',
  };
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function WarCard({ war }: { war: ServerWar }) {
  const [open, setOpen] = useState(false);
  const outcome = outcomeOf(war);

  const oppByTag = useMemo(() => {
    const map = new Map<string, { pos: number; name: string }>();
    for (const m of war.opponentMembers || []) map.set(m.tag, { pos: m.mapPosition, name: m.name });
    return map;
  }, [war]);

  const members = useMemo(
    () => (war.members || []).slice().sort((a, b) => a.mapPosition - b.mapPosition),
    [war],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#11151c]/90">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${OUTCOME_STYLE[outcome]}`}
        >
          {outcome === 'live' ? 'In war' : outcome}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">
            vs {war.opponentName || 'Unknown'}
          </span>
          <span className="block text-xs text-slate-500">
            {dateOf(war.endTime)} · {war.teamSize || '?'} vs {war.teamSize || '?'}
          </span>
        </span>

        <span className="text-right text-sm font-black">
          {war.clanStars} – {war.opponentStars}
          <span className="block text-[11px] font-medium text-slate-500">
            {war.clanDestruction.toFixed(1)}% – {war.opponentDestruction.toFixed(1)}%
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-white/5 p-4">
          {members.length === 0 ? (
            <p className="text-sm text-slate-500">
              Only the result was saved for this war (from the official war log). Wars
              captured live while running have full attack detail.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.tag} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-sm font-bold">
                    #{m.mapPosition} {m.name}{' '}
                    <span className="text-xs font-semibold text-slate-500">
                      TH{m.townhallLevel}
                    </span>
                  </p>
                  {!m.attacks?.length ? (
                    <p className="mt-1 text-xs text-red-300">No attacks used</p>
                  ) : (
                    <div className="mt-1 space-y-0.5">
                      {m.attacks
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((a, i) => {
                          const target = oppByTag.get(a.defenderTag);
                          return (
                            <p key={i} className="text-xs text-slate-300">
                              <span className="text-amber-300">{stars(a.stars)}</span>{' '}
                              {a.destructionPercentage}%
                              {target ? ` → #${target.pos} ${target.name}` : ''}
                            </p>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WarArchivePage() {
  const [wars, setWars] = useState<ServerWar[]>([]);
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [performance, setPerformance] = useState<PlayerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [archiveRes, intelligenceRes] = await Promise.all([
        fetch('/api/clash/war-archive'),
        fetch('/api/clash/war-intelligence'),
      ]);
      if (!archiveRes.ok) throw new Error(String(archiveRes.status));
      const data = await archiveRes.json();
      const intelligence = intelligenceRes.ok ? await intelligenceRes.json() : { players: [] };
      setWars(Array.isArray(data.wars) ? data.wars : []);
      setPlayers(Array.isArray(data.players) ? data.players : []);
      setPerformance(Array.isArray(intelligence.players) ? intelligence.players : []);
      setOffline(false);
    } catch {
      // Server archive unavailable: fall back to whatever this device saved
      // locally, so the page still shows something useful.
      setWars(readWars().map(fromLocal));
      setPlayers([]);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const onLocalChange = () => {
      if (offline) setWars(readWars().map(fromLocal));
    };
    window.addEventListener(WARS_EVENT, onLocalChange);
    return () => window.removeEventListener(WARS_EVENT, onLocalChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(
    () => wars.slice().sort((a, b) => warTime(b.endTime) - warTime(a.endTime)),
    [wars],
  );

  const summary = useMemo(() => {
    let win = 0;
    let lose = 0;
    let tie = 0;
    let totalStars = 0;

    for (const w of sorted) {
      const o = outcomeOf(w);
      if (o === 'win') win++;
      else if (o === 'lose') lose++;
      else if (o === 'tie') tie++;
      if (o !== 'live') totalStars += w.clanStars;
    }

    const finished = win + lose + tie;
    return { win, lose, tie, totalStars, finished };
  }, [sorted]);

  const board = useMemo(
    () =>
      players
        .map(p => ({ ...p, avg: p.attacksUsed ? p.starsTotal / p.attacksUsed : 0 }))
        .sort((a, b) => b.avg - a.avg || b.attacksUsed - a.attacksUsed),
    [players],
  );

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-screen bg-[#07090d]">
        <AppSidebar clanName="CLASHIQ" clanTag="" />

        <main className="min-w-0 flex-1">
          <ClashIQInlineBanner />

          <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-16 pt-2 md:px-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 transition hover:text-amber-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Command Center
                </Link>

                <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight md:text-3xl">
                  <Trophy className="h-6 w-6 text-amber-300" />
                  War Archive
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Every war is saved automatically on the server as the clan uses the
                  app, shared by everyone. A war gets full per-player attack detail
                  when it is captured while running; older results come from the
                  official war log.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-slate-300 hover:bg-white/10 disabled:opacity-40"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {offline && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs font-semibold text-amber-200">
                <WifiOff className="h-4 w-4 shrink-0" />
                Could not reach the server archive. Showing wars saved on this device
                only.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Wars saved" value={String(sorted.length)} />
              <Stat
                label="Record"
                value={`${summary.win}–${summary.lose}${summary.tie ? `–${summary.tie}` : ''}`}
                sub={
                  summary.finished
                    ? `${Math.round((summary.win / summary.finished) * 100)}% win rate`
                    : undefined
                }
              />
              <Stat label="Stars earned" value={String(summary.totalStars)} sub="finished wars" />
              <Stat label="Players tracked" value={String(board.length)} />
            </div>

            {board.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                  Clan-wide
                </p>
                <h2 className="text-lg font-black">Player stats</h2>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">Player</th>
                        <th className="py-2 pr-3">Wars</th>
                        <th className="py-2 pr-3">Attacks</th>
                        <th className="py-2 pr-3">Avg ★</th>
                        <th className="py-2">3★</th>
                      </tr>
                    </thead>
                    <tbody>
                      {board.map(p => (
                        <tr key={p.playerTag} className="border-t border-white/5">
                          <td className="py-2 pr-3 font-bold">{p.playerName}</td>
                          <td className="py-2 pr-3">{p.warsCounted}</td>
                          <td className="py-2 pr-3">
                            <span className={p.attacksUsed < p.attacksPossible ? 'text-red-300' : ''}>
                              {p.attacksUsed}/{p.attacksPossible}
                            </span>
                          </td>
                          <td className="py-2 pr-3">{p.avg.toFixed(2)}</td>
                          <td className="py-2">{p.threeStars}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {performance.length > 0 && (
              <section className="rounded-2xl border border-amber-400/15 bg-[#0d131b]/95 p-5 shadow-[0_18px_55px_rgba(0,0,0,.16)]">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[.06] pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">War Intelligence 2.0</p>
                    <h2 className="mt-1 text-xl font-black">Player Performance</h2>
                    <p className="mt-1 max-w-2xl text-xs text-slate-500">
                      Recent performance is compared with the previous five completed wars. Trend data comes from archived live attack data.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/[.08] bg-white/[.02] px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">
                    {performance.length} tracked players
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {(['improving', 'stable', 'declining'] as const).map(trend => {
                    const count = performance.filter(p => p.trend === trend).length;
                    const Icon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;
                    const tone = trend === 'improving' ? 'text-emerald-300' : trend === 'declining' ? 'text-red-300' : 'text-slate-300';
                    return (
                      <div key={trend} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`size-4 ${tone}`} />
                          <span className={`text-[9px] font-black uppercase tracking-[.18em] ${tone}`}>{trend}</span>
                        </div>
                        <p className="mt-2 text-2xl font-black">{count}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="text-[9px] uppercase tracking-[.16em] text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">Player</th>
                        <th className="py-2 pr-3">Trend</th>
                        <th className="py-2 pr-3">Recent ★</th>
                        <th className="py-2 pr-3">Destruction</th>
                        <th className="py-2 pr-3">3★ Rate</th>
                        <th className="py-2 pr-3">Missed</th>
                        <th className="py-2">Wars</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.map(p => {
                        const Icon = p.trend === 'improving' ? TrendingUp : p.trend === 'declining' ? TrendingDown : Minus;
                        const tone = p.trend === 'improving' ? 'text-emerald-300' : p.trend === 'declining' ? 'text-red-300' : 'text-slate-400';
                        const delta = p.previousAvgStars ? p.recentAvgStars - p.previousAvgStars : 0;
                        return (
                          <tr key={p.playerTag} className="border-t border-white/5">
                            <td className="py-3 pr-3">
                              <p className="font-bold">{p.playerName}</p>
                              <p className="font-mono text-[9px] text-slate-600">{p.playerTag}</p>
                            </td>
                            <td className="py-3 pr-3">
                              <span className={`inline-flex items-center gap-1 rounded-full border border-white/[.08] bg-white/[.03] px-2 py-1 text-[9px] font-black uppercase ${tone}`}>
                                <Icon className="size-3" /> {p.trend}
                              </span>
                              {p.previousAvgStars > 0 && <span className="ml-2 text-[10px] text-slate-500">{delta >= 0 ? '+' : ''}{delta.toFixed(2)}★</span>}
                            </td>
                            <td className="py-3 pr-3 font-black">{p.recentAvgStars.toFixed(2)}</td>
                            <td className="py-3 pr-3">{p.recentAvgDestruction.toFixed(1)}%</td>
                            <td className="py-3 pr-3">{p.threeStarRate.toFixed(0)}%</td>
                            <td className={`py-3 pr-3 ${p.missedAttacks ? 'text-red-300' : 'text-emerald-300'}`}>{p.missedAttacks}</td>
                            <td className="py-3">{p.warsCounted}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-lg font-black">Wars</h2>
              {loading ? (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-500">
                  Loading…
                </p>
              ) : sorted.length === 0 ? (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-500">
                  No wars saved yet. Wars are captured automatically as the app is
                  used.
                </p>
              ) : (
                sorted.map(w => <WarCard key={w.id} war={w} />)
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
