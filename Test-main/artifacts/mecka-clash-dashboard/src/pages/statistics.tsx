import { useMemo } from 'react';
import { ArrowLeft, BarChart3, Swords, Target, Trophy, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { AppSidebar } from '@/components/app-sidebar';

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => v && typeof v === 'object' ? (v as Dict) : {};
const arr = (v: unknown): Dict[] => Array.isArray(v) ? v.map(d) : [];
const s = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
const n = (v: unknown, fallback = 0) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) { const value = Number(v.replace(/,/g, '')); if (Number.isFinite(value)) return value; }
  return fallback;
};
const warTime = (war: Dict) => {
  for (const value of [war.endTime, war.warEndTime, war.startTime, war.warStartTime, war.prepStartTime]) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const clash = value.trim().match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (clash) return Date.UTC(+clash[1], +clash[2] - 1, +clash[3], +clash[4], +clash[5], +clash[6]);
    const parsed = Date.parse(value); if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};
const ownSideOf = (war: Dict, clanTag: string) => {
  const clan = d(war.clan), opponent = d(war.opponent), tag = clanTag.toUpperCase();
  return s(clan.tag).toUpperCase() === tag ? clan : s(opponent.tag).toUpperCase() === tag ? opponent : clan;
};
const resultOf = (war: Dict, clanTag: string) => {
  const state = s(war.state).toLowerCase();
  if (['won','win','victory'].includes(state)) return 'WIN';
  if (['lost','loss','lose','defeat'].includes(state)) return 'LOSS';
  if (['draw','tied'].includes(state)) return 'DRAW';
  const own = ownSideOf(war, clanTag), enemy = own === d(war.clan) ? d(war.opponent) : d(war.clan);
  if (n(own.stars) !== n(enemy.stars)) return n(own.stars) > n(enemy.stars) ? 'WIN' : 'LOSS';
  if (n(own.destructionPercentage) !== n(enemy.destructionPercentage)) return n(own.destructionPercentage) > n(enemy.destructionPercentage) ? 'WIN' : 'LOSS';
  return 'DRAW';
};

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Trophy; label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5 shadow-[0_16px_50px_rgba(0,0,0,.18)]">
    <div className="grid size-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/[.06] text-amber-300"><Icon className="size-5" /></div>
    <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-slate-500">{label}</p>
    <p className="mt-1 text-3xl font-black tracking-tight text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{detail}</p>
  </article>;
}

export default function StatisticsPage() {
  const { data, isLoading, isError } = useGetClashDashboard();
  const dashboard = data as unknown as Dict | undefined;
  const clan = d(dashboard?.clan), clanTag = s(dashboard?.clanTag);
  const wars = useMemo(() => arr(dashboard?.warlog).sort((a,b) => warTime(b)-warTime(a)).map(war => ({ war, result: resultOf(war, clanTag) })), [dashboard?.warlog, clanTag]);
  const stats = useMemo(() => {
    let wins=0, losses=0, draws=0, destructionTotal=0, destructionCount=0, attacks=0, threeStars=0;
    for (const {war,result} of wars) {
      if(result==='WIN') wins++; else if(result==='LOSS') losses++; else draws++;
      const own=ownSideOf(war,clanTag), destruction=n(own.destructionPercentage);
      if(destruction>0){destructionTotal+=destruction;destructionCount++;}
      for(const member of arr(own.members)) for(const attack of arr(member.attacks)){attacks++;if(n(attack.stars)>=3)threeStars++;}
      for(const attack of arr(own.attacks)){attacks++;if(n(attack.stars)>=3)threeStars++;}
    }
    const completed=wins+losses+draws;
    return {completed,wins,losses,draws,winRate:completed?Math.round(wins/completed*100):0,avgDestruction:destructionCount?Math.round(destructionTotal/destructionCount):null,attacks,threeStars,threeStarRate:attacks?Math.round(threeStars/attacks*100):null};
  }, [wars,clanTag]);

  if(isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] text-white"><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Loading statistics...</p></div>;
  if(isError) return <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] p-6 text-white"><div className="rounded-3xl border border-white/10 bg-[#0b1119] p-8 text-center"><BarChart3 className="mx-auto size-8 text-amber-300"/><h1 className="mt-4 text-2xl font-black">Statistics Offline</h1><p className="mt-2 text-sm text-slate-500">CLASHIQ could not load the clan statistics.</p></div></div>;

  return <div className="min-h-[100dvh] bg-[#07090d] text-white"><div className="flex min-h-[100dvh]"><AppSidebar clanName={s(clan.name,'BHABE DHEMONS')} clanTag={clanTag||'#2Q0Q82C9R'}/><main className="min-w-0 flex-1"><div className="mx-auto max-w-[1400px] px-5 pb-10 pt-3 md:px-8 md:pt-4">
    <Link href="/" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-amber-300 hover:text-amber-200"><ArrowLeft className="size-4"/>Command Center</Link>
    <header className="mt-4 border-b border-white/[.06] pb-5"><p className="text-[9px] font-black uppercase tracking-[.22em] text-slate-500">CLASHIQ / Intelligence</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Statistics</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">A clear summary of the verified war data available to Clash IQ.</p></header>
    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Trophy} label="Win Rate" value={`${stats.winRate}%`} detail={`${stats.wins} wins · ${stats.losses} losses · ${stats.draws} draws`}/>
      <StatCard icon={Swords} label="Completed Wars" value={String(stats.completed)} detail="Wars in the available log"/>
      <StatCard icon={Target} label="Three-Star Rate" value={stats.threeStarRate==null?'—':`${stats.threeStarRate}%`} detail={stats.attacks?`${stats.threeStars} of ${stats.attacks} verified attacks were 3★`:'Attack-level data is not available in the war log'}/>
      <StatCard icon={TrendingUp} label="Avg. Destruction" value={stats.avgDestruction==null?'—':`${stats.avgDestruction}%`} detail={stats.avgDestruction==null?'No verified destruction values available':'Average destruction per completed war'}/>
    </section>
    <section className="mt-5 rounded-2xl border border-white/[.08] bg-[#0b1119] p-5"><div className="flex items-end justify-between gap-4 border-b border-white/[.06] pb-4"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">War History</p><h2 className="mt-1 text-xl font-black">Recent Performance</h2></div><span className="rounded-full border border-white/[.08] bg-white/[.02] px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">{wars.length} wars</span></div>
      {wars.length?<div className="mt-4 grid gap-2 lg:grid-cols-2">{wars.slice(0,12).map(({war,result},index)=>{const own=ownSideOf(war,clanTag),enemy=own===d(war.clan)?d(war.opponent):d(war.clan);return <div key={`${warTime(war)}-${index}`} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg border border-amber-400/15 bg-amber-400/[.05] text-amber-300"><Swords className="size-4"/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">vs {s(enemy.name,'Unknown opponent')}</p><span className="text-[8px] font-black tracking-[.15em] text-amber-300">{result}</span></div><p className="mt-0.5 text-[10px] text-slate-500">{Math.round(n(own.destructionPercentage))}% destruction</p></div><p className="text-sm font-black">{n(own.stars)} - {n(enemy.stars)}</p></div>})}</div>:<div className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No completed war statistics available yet.</div>}
    </section>
  </div></main></div></div>;
}
