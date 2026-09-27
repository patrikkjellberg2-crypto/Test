import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, History, RefreshCw, Search, Users } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";

type Player = { playerTag: string; playerName: string; warsCounted: number; attacksUsed: number; attacksPossible: number; starsTotal: number; threeStars: number; };

export default function PlayerHistoryPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const load = async () => {
    setLoading(true);
    try { const response = await fetch("/api/clash/war-archive"); const data = await response.json(); setPlayers(Array.isArray(data.players) ? data.players : []); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const filtered = players.filter((player) => `${player.playerName} ${player.playerTag}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white"><div className="flex min-h-screen"><AppSidebar clanName="CLASHIQ" clanTag="" /><main className="min-w-0 flex-1"><div className="mx-auto max-w-[1200px] space-y-6 px-4 pb-16 pt-8 md:px-7">
      <div><Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300"><ArrowLeft className="h-4 w-4" /> Command Center</Link><div className="mt-3 flex items-center gap-3"><History className="h-7 w-7 text-amber-300" /><div><h1 className="text-3xl font-black">Player History</h1><p className="text-sm text-slate-500">Persistent war history plus Clash of Stats history where available.</p></div></div></div>
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-600" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search player..." className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm outline-none focus:border-amber-400/40" /></div><button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button></div>
      {filtered.length === 0 && !loading ? <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500"><Users className="mx-auto mb-3 h-8 w-8 text-slate-700" />No tracked players yet. Open War Archive once to recover historical wars.</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((player) => <Link key={player.playerTag} href={`/player/${encodeURIComponent(player.playerTag)}`} className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-4 transition hover:border-amber-400/30 hover:bg-white/[0.04]"><p className="font-black text-white">{player.playerName}</p><p className="mt-1 font-mono text-[10px] text-slate-600">{player.playerTag}</p><div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><p className="text-slate-600">Wars</p><p className="mt-1 font-bold">{player.warsCounted}</p></div><div><p className="text-slate-600">Attacks</p><p className="mt-1 font-bold">{player.attacksUsed}/{player.attacksPossible}</p></div><div><p className="text-slate-600">3★</p><p className="mt-1 font-bold text-amber-300">{player.threeStars}</p></div></div></Link>)}</div>}
    </div></main></div></div>
  );
}