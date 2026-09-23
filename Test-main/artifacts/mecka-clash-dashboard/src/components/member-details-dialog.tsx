import { X, Trophy, Swords, Shield, Gift, UserRound, Crown } from 'lucide-react';

type Dict = Record<string, unknown>;
const asDict = (value: unknown): Dict => value && typeof value === 'object' ? value as Dict : {};
const str = (value: unknown, fallback = '—') => typeof value === 'string' ? value : fallback;
const num = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback;
const label = (value: unknown, fallback = '—') => str(value, fallback);
const compact = (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'MC';

export function MemberDetailsDialog({ member, onClose }: { member: Dict | null; onClose: () => void }) {
  if (!member) return null;
  const name = label(member.name, 'Unknown player');
  const league = asDict(member.league);
  const builderLeague = asDict(member.builderBaseLeague);
  const attacks = Array.isArray(member.attacks) ? member.attacks.map(asDict) : [];
  const stars = attacks.reduce((sum, attack) => sum + num(attack.stars), 0);
  const destruction = attacks.length ? Math.round(attacks.reduce((sum, attack) => sum + num(attack.destructionPercentage), 0) / attacks.length) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#061827]/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Player card ${name}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="max-h-[90dvh] w-full max-w-[620px] overflow-y-auto rounded-t-3xl border border-card-border bg-card shadow-2xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-border/70 bg-card/95 p-5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 font-display text-sm font-bold text-primary">{initials(name)}</div>
            <div className="min-w-0"><p className="truncate font-display text-xl font-bold tracking-[-.04em]">{name}</p><p className="mt-1 font-data text-xs text-muted-foreground">{str(member.tag)} · #{num(member.clanRank)} in clan</p></div>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:border-primary/40 hover:text-primary" aria-label="Close player card"><X className="size-4" /></button>
        </header>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-secondary/60 p-4"><div className="flex items-center gap-2 text-primary"><Trophy className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Trophies</span></div><p className="mt-2 font-data text-2xl font-bold">{compact(num(member.trophies))}</p><p className="mt-1 text-xs text-muted-foreground">{label(league.name, 'Unranked')}</p></div>
          <div className="rounded-2xl bg-secondary/60 p-4"><div className="flex items-center gap-2 text-primary"><Crown className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Experience</span></div><p className="mt-2 font-data text-2xl font-bold">Lv {num(member.expLevel)}</p><p className="mt-1 text-xs text-muted-foreground">Town Hall {num(member.townHallLevel, num(member.townhallLevel))}</p></div>
          <div className="rounded-2xl bg-secondary/60 p-4"><div className="flex items-center gap-2 text-primary"><Gift className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Donations</span></div><p className="mt-2 font-data text-2xl font-bold">{compact(num(member.donations))}</p><p className="mt-1 text-xs text-muted-foreground">mottagna {compact(num(member.donationsReceived))}</p></div>
          <div className="rounded-2xl bg-secondary/60 p-4"><div className="flex items-center gap-2 text-primary"><UserRound className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Builder Base</span></div><p className="mt-2 font-data text-2xl font-bold">{compact(num(member.builderBaseTrophies))}</p><p className="mt-1 text-xs text-muted-foreground">{label(builderLeague.name, 'No league')}</p></div>
          {attacks.length > 0 && <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:col-span-2"><div className="flex items-center gap-2 text-primary"><Swords className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Current war</span></div><div className="mt-3 grid grid-cols-3 gap-3"><div><p className="text-xs text-muted-foreground">Attacks</p><p className="font-data text-lg font-bold">{attacks.length}/2</p></div><div><p className="text-xs text-muted-foreground">Stars</p><p className="font-data text-lg font-bold">{stars}</p></div><div><p className="text-xs text-muted-foreground">Average destruction</p><p className="font-data text-lg font-bold">{destruction}%</p></div></div></div>}
          {member.clanRank !== undefined && <div className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs text-muted-foreground sm:col-span-2"><Shield className="size-3.5 text-primary" /> Previous clan rank: <span className="font-data font-bold text-foreground">#{num(member.previousClanRank)}</span></div>}
        </div>
      </section>
    </div>
  );
}
