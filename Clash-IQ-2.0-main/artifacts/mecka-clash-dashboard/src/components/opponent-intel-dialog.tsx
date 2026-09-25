import { useEffect, useMemo, useState } from 'react';
import { Activity, Crown, Shield, Swords, Trophy, UserRound, X, Zap } from 'lucide-react';

type Dict = Record<string, unknown>;
const asDict = (value: unknown): Dict => value && typeof value === 'object' ? value as Dict : {};
const asArray = (value: unknown): Dict[] => Array.isArray(value) ? value.map(asDict) : [];
const str = (value: unknown, fallback = '—') => typeof value === 'string' ? value : fallback;
const num = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback;
const compact = (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'OP';

function Stat({ icon: Icon, title, value, detail }: { icon: typeof Trophy; title: string; value: string; detail?: string }) {
  return <div className="rounded-2xl bg-secondary/60 p-4"><div className="flex items-center gap-2 text-primary"><Icon className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">{title}</span></div><p className="mt-2 font-data text-2xl font-bold">{value}</p>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>;
}

export function OpponentIntelDialog({ member, onClose }: { member: Dict | null; onClose: () => void }) {
  const tag = str(member?.tag, '');
  const [profile, setProfile] = useState<Dict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProfile(null);
    fetch(`/api/clash/player/${encodeURIComponent(tag)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load the opponent profile.');
        return response.json() as Promise<Dict>;
      })
      .then((value) => { if (!cancelled) setProfile(value); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the opponent profile.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tag]);

  const source = profile ?? member ?? {};
  const name = str(source.name, 'Unknown opponent');
  const league = asDict(source.league);
  const builderLeague = asDict(source.builderBaseLeague);
  const heroes = asArray(source.heroes);
  const pets = asArray(source.heroEquipment);
  const historical = asDict(source.historicalWarStats);
  const currentAttacks = asArray(member?.attacks);
  const currentStars = currentAttacks.reduce((sum, attack) => sum + num(attack.stars), 0);
  const currentDestruction = currentAttacks.length ? Math.round(currentAttacks.reduce((sum, attack) => sum + num(attack.destructionPercentage), 0) / currentAttacks.length) : 0;
  const heroLevels = useMemo(() => heroes.map((hero) => num(hero.level)).filter(Boolean), [heroes]);
  const strongestHero = heroLevels.length ? Math.max(...heroLevels) : 0;

  if (!member) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#061827]/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Opponent intelligence ${name}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="max-h-[92dvh] w-full max-w-[760px] overflow-y-auto rounded-t-3xl border border-card-border bg-card shadow-2xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-border/70 bg-card/95 p-5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#cf5b4d]/10 font-display text-sm font-bold text-[#a84439]">{initials(name)}</div>
            <div className="min-w-0"><p className="truncate font-display text-xl font-bold tracking-[-.04em]">{name}</p><p className="mt-1 font-data text-xs text-muted-foreground">{tag} · Enemy position #{num(member.mapPosition)}</p></div>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:border-primary/40 hover:text-primary" aria-label="Close opponent intelligence"><X className="size-4" /></button>
        </header>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Shield} title="Town Hall" value={`TH ${num(source.townHallLevel, num(source.townhallLevel))}`} detail={`War position #${num(member.mapPosition)}`} />
            <Stat icon={Trophy} title="Trophies" value={compact(num(source.trophies))} detail={str(league.name, 'Unranked')} />
            <Stat icon={Crown} title="Experience" value={`Lv ${num(source.expLevel)}`} detail={`Builder ${compact(num(source.builderBaseTrophies))}`} />
            <Stat icon={Swords} title="Current war" value={`${currentStars}★`} detail={`${currentDestruction}% destruction · ${currentAttacks.length}/2 attacks`} />
          </div>

          <section className="rounded-2xl border border-card-border bg-card p-4">
            <div className="flex items-center gap-2"><Activity className="size-4 text-primary" /><h3 className="text-sm font-bold">Enemy war intelligence</h3></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-secondary/55 p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Attacks used</p><p className="mt-1 font-data text-xl font-bold">{currentAttacks.length}/2</p></div>
              <div className="rounded-xl bg-secondary/55 p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Stars earned</p><p className="mt-1 font-data text-xl font-bold">{currentStars}</p></div>
              <div className="rounded-xl bg-secondary/55 p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Average destruction</p><p className="mt-1 font-data text-xl font-bold">{currentDestruction}%</p></div>
            </div>
            {currentAttacks.length > 0 && <div className="mt-3 space-y-2">{currentAttacks.map((attack, index) => <div key={index} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-xs"><span className="font-bold">Attack {index + 1} → #{num(attack.defenderMapPosition)}</span><span className="font-data font-bold">{num(attack.stars)}★ · {num(attack.destructionPercentage)}%</span></div>)}</div>}
          </section>

          {loading && <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm text-primary"><Zap className="mr-2 inline size-4 animate-pulse" /> Loading full Clash profile…</div>}
          {error && <div className="rounded-2xl border border-[#cf5b4d]/30 bg-[#cf5b4d]/[0.07] px-4 py-3 text-sm text-[#a84439]">{error} The war data above is still available.</div>}

          {!loading && profile && <>
            <section className="rounded-2xl border border-card-border bg-card p-4">
              <div className="flex items-center gap-2"><Shield className="size-4 text-primary" /><h3 className="text-sm font-bold">Account strength</h3></div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-secondary/55 p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Strongest hero</p><p className="mt-1 font-data text-xl font-bold">{strongestHero ? `Level ${strongestHero}` : 'No hero data'}</p><p className="mt-1 text-xs text-muted-foreground">{heroes.length} heroes returned by Clash API</p></div>
                <div className="rounded-xl bg-secondary/55 p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Historical wars</p><p className="mt-1 font-data text-xl font-bold">{num(historical.wars)}</p><p className="mt-1 text-xs text-muted-foreground">{num(historical.threeStarAttacks)} three-star attacks · {num(historical.missedWars)} missed wars</p></div>
              </div>
            </section>
            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary/55 p-4"><div className="flex items-center gap-2 text-primary"><Swords className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Historical attack rate</span></div><p className="mt-2 font-data text-2xl font-bold">{num(historical.totalAttacks)} attacks</p><p className="mt-1 text-xs text-muted-foreground">Average {num(historical.averageStarsPerAttack).toFixed(2)} stars · {Math.round(num(historical.averageDestruction))}% destruction</p></div>
              <div className="rounded-2xl bg-secondary/55 p-4"><div className="flex items-center gap-2 text-primary"><UserRound className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Builder Base</span></div><p className="mt-2 font-data text-2xl font-bold">{compact(num(source.builderBaseTrophies))}</p><p className="mt-1 text-xs text-muted-foreground">{str(builderLeague.name, 'No league')}</p></div>
            </section>
          </>}
        </div>
      </section>
    </div>
  );
}
