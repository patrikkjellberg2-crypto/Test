import { useMemo, useState } from "react";
import { Castle, Coins, RefreshCw, Swords, Trophy, Users } from "lucide-react";
import { useGetClashDashboard } from "@workspace/api-client-react";
import { ClashIQPageShell } from "@/components/clashiq-page-shell";

type D = Record<string, any>;
const obj = (v: any): D => v && typeof v === "object" ? v : {};
const arr = (v: any): D[] => Array.isArray(v) ? v.map(obj) : [];
const n = (v: any) => typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;
const s = (v: any, fallback = "—") => typeof v === "string" && v.trim() ? v : fallback;
const fmt = (v: any) => {
  const d = new Date(s(v, ""));
  return Number.isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(d);
};
const compact = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export default function CapitalRaidsPage() {
  const { data, isLoading, isError, refetch } = useGetClashDashboard();
  const [selected, setSelected] = useState(0);
  const d = data as any;
  const clan = obj(d?.clan);
  const seasons = useMemo(
    () => arr(d?.capitalRaidSeasons).sort((a, b) => new Date(s(b.endTime, "")).getTime() - new Date(s(a.endTime, "")).getTime()),
    [d?.capitalRaidSeasons],
  );
  const season = seasons[selected] ?? seasons[0] ?? {};
  const members = arr(season.members).sort((a, b) => n(b.capitalResourcesLooted) - n(a.capitalResourcesLooted));
  const totalLoot = seasons.reduce((sum, x) => sum + n(x.capitalTotalLoot), 0);
  const totalRaids = seasons.reduce((sum, x) => sum + n(x.raidsCompleted), 0);
  const averageLoot = seasons.length ? Math.round(totalLoot / seasons.length) : 0;
  const league = s(clan.capitalLeague ?? clan.capitalLeagueName);

  if (isLoading) {
    return <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] text-white"><b>Loading Capital Raids…</b></div>;
  }

  if (isError) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] p-6 text-white">
        <section className="rounded-3xl border border-white/[0.08] bg-[#0b1119] p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Could not load Capital Raids</h1>
          <button onClick={() => void refetch()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-[#07090d]">
            <RefreshCw className="size-4" /> Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <ClashIQPageShell
      clanName={s(clan.name, "BHABE DHEMONS")}
      clanTag={s(d.clanTag, "#2Q0Q82C9R")}
      title="Capital Raids"
      subtitle="Capital League, raid seasons, loot and clan participation"
      onRefresh={() => void refetch()}
    >
      <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#101722] to-[#0b1017] p-5 shadow-2xl shadow-black/20 md:p-7">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-300/80">Capital Command</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.05em]">Raid Intelligence</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Persistent history is collected whenever Clash IQ sees a completed raid season.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Capital League</p>
            <p className="mt-1 font-display text-xl font-black text-amber-300">{league}</p>
          </div>
        </div>
      </section>

      {seasons.length === 0 ? (
        <section className="rounded-2xl border border-white/[0.07] bg-[#0b1119] p-8 text-center">
          <Castle className="mx-auto size-8 text-slate-600" />
          <h2 className="mt-4 font-bold">No Capital Raid data yet</h2>
          <p className="mt-2 text-sm text-slate-500">When the Clash API returns a raid season, Clash IQ will archive it automatically.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={Trophy} label="Raid seasons tracked" value={seasons.length.toString()} />
            <Metric icon={Coins} label="Total capital loot" value={compact(totalLoot)} />
            <Metric icon={Coins} label="Average loot / season" value={compact(averageLoot)} />
            <Metric icon={Swords} label="Total raids completed" value={totalRaids.toString()} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
            <article className="rounded-2xl border border-white/[0.07] bg-[#0b1119] p-5 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Raid Season History</h2>
                  <p className="mt-1 text-[10px] text-slate-600">Archived seasons are kept in the TEST database.</p>
                </div>
                <span className="rounded-full border border-amber-400/15 bg-amber-400/[0.05] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-300">
                  {seasons.length} tracked
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {seasons.map((x, i) => (
                  <button
                    key={String(x.endTime ?? i)}
                    onClick={() => setSelected(i)}
                    className={[
                      "w-full rounded-xl border p-3 text-left transition",
                      i === selected
                        ? "border-amber-400/20 bg-amber-400/[0.08]"
                        : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-white">{fmt(x.startTime)} – {fmt(x.endTime)}</span>
                      <span className="font-data text-xs font-bold text-amber-300">{compact(n(x.capitalTotalLoot))}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">{s(x.state, "completed")} · {n(x.raidsCompleted)} raids</p>
                  </button>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/[0.07] bg-[#0b1119] p-5 shadow-xl shadow-black/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold">Season Performance</h2>
                  <p className="mt-1 text-[10px] text-slate-500">{fmt(season.startTime)} – {fmt(season.endTime)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-right">
                  <MiniStat label="Loot" value={compact(n(season.capitalTotalLoot))} />
                  <MiniStat label="Rewards" value={compact(n(season.offensiveReward) + n(season.defensiveReward))} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MiniCard label="Raids" value={n(season.raidsCompleted).toString()} />
                <MiniCard label="Participants" value={members.length.toString()} />
                <MiniCard label="League" value={league} />
              </div>

              <div className="mt-6 flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2"><Users className="size-4 text-amber-300" /><h3 className="text-sm font-bold">Participants</h3></div>
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">Loot</span>
              </div>

              {members.length ? (
                <div className="divide-y divide-white/[0.05]">
                  {members.map((m, i) => (
                    <div key={String(m.tag ?? i)} className="flex items-center gap-3 py-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-xs font-bold text-slate-300">
                        {String(m.name ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{s(m.name)}</p>
                        <p className="text-[10px] text-slate-600">{s(m.tag)} · {n(m.attacks)}/{n(m.attackLimit) + n(m.bonusAttackLimit)} attacks</p>
                      </div>
                      <div className="text-right">
                        <p className="font-data text-sm font-bold text-white">{compact(n(m.capitalResourcesLooted))}</p>
                        <p className="text-[10px] text-slate-600">loot</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No member details are available for this season.</p>
              )}
            </article>
          </section>
        </>
      )}
    </ClashIQPageShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b1119] p-4 shadow-lg shadow-black/10">
      <Icon className="size-4 text-amber-300" />
      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">{label}</p>
      <p className="mt-1 font-data text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">{label}</p><p className="mt-1 font-data text-lg font-bold text-white">{value}</p></div>;
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">{label}</p><p className="mt-1 truncate text-sm font-bold text-white">{value}</p></div>;
}
