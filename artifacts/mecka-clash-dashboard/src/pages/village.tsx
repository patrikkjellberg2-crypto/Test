import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Castle,
  Crown,
  Hammer,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { ClashIQInlineBanner } from '@/components/clashiq-inline-banner';

type Dict = Record<string, any>;

const STORAGE_KEY = 'clashiq.village.v1';

/* ------------------------------------------------------------------ */
/* ID -> name mapping for the in-game "Data Export" (home village).    */
/* Unknown IDs (new game content) are shown as "Item #ID".             */
/* ------------------------------------------------------------------ */
const NAMES: Record<string, string> = {
  // Buildings & traps
  '1000000': 'Army Camp', '1000001': 'Town Hall', '1000002': 'Elixir Collector',
  '1000003': 'Elixir Storage', '1000004': 'Gold Mine', '1000005': 'Gold Storage',
  '1000006': 'Barracks', '1000007': 'Laboratory', '1000008': 'Cannon',
  '1000009': 'Archer Tower', '1000010': 'Wall', '1000011': 'Wizard Tower',
  '1000012': 'Air Defense', '1000013': 'Mortar', '1000014': 'Clan Castle',
  '1000015': "Builder's Hut", '1000019': 'Hidden Tesla', '1000020': 'Spell Factory',
  '1000021': 'X-Bow', '1000023': 'Dark Elixir Drill', '1000024': 'Dark Elixir Storage',
  '1000026': 'Dark Barracks', '1000027': 'Inferno Tower', '1000028': 'Air Sweeper',
  '1000029': 'Dark Spell Factory', '1000031': 'Eagle Artillery', '1000032': 'Bomb Tower',
  '1000059': 'Workshop', '1000064': "B.O.B's Hut", '1000067': 'Scattershot',
  '1000068': 'Pet House', '1000070': 'Blacksmith', '1000071': 'Hero Hall',
  '1000072': 'Spell Tower', '1000077': 'Monolith', '1000079': 'Multi-Gear Tower',
  '1000084': 'Multi-Archer Tower', '1000085': 'Ricochet Cannon', '1000086': 'Revenge Tower',
  '1000089': 'Firespitter', '1000093': 'Helper Hut', '1000097': 'Crafting Station',
  '1000102': 'Super Wizard Tower',
  '12000000': 'Bomb', '12000001': 'Spring Trap', '12000002': 'Giant Bomb',
  '12000005': 'Air Bomb', '12000006': 'Seeking Air Mine', '12000008': 'Skeleton Trap',
  '12000016': 'Tornado Trap', '12000020': 'Giga Bomb',
  // Heroes
  '28000000': 'Barbarian King', '28000001': 'Archer Queen', '28000002': 'Grand Warden',
  '28000004': 'Royal Champion', '28000006': 'Minion Prince', '28000007': 'Dragon Duke',
  // Pets
  '73000000': 'L.A.S.S.I', '73000001': 'Mighty Yak', '73000002': 'Electro Owl',
  '73000003': 'Unicorn', '73000004': 'Phoenix', '73000007': 'Poison Lizard',
  '73000008': 'Diggy', '73000009': 'Frosty', '73000010': 'Spirit Fox',
  '73000011': 'Angry Jelly', '73000016': 'Sneezy', '73000017': 'Greedy Raven',
  // Troops & siege machines
  '4000000': 'Barbarian', '4000001': 'Archer', '4000002': 'Goblin', '4000003': 'Giant',
  '4000004': 'Wall Breaker', '4000005': 'Balloon', '4000006': 'Wizard', '4000007': 'Healer',
  '4000008': 'Dragon', '4000009': 'P.E.K.K.A', '4000010': 'Minion', '4000011': 'Hog Rider',
  '4000012': 'Valkyrie', '4000013': 'Golem', '4000015': 'Witch', '4000017': 'Lava Hound',
  '4000022': 'Bowler', '4000023': 'Baby Dragon', '4000024': 'Miner', '4000051': 'Wall Wrecker',
  '4000052': 'Battle Blimp', '4000053': 'Yeti', '4000058': 'Ice Golem',
  '4000059': 'Electro Dragon', '4000062': 'Stone Slammer', '4000065': 'Dragon Rider',
  '4000075': 'Siege Barracks', '4000082': 'Headhunter', '4000087': 'Log Launcher',
  '4000091': 'Flame Flinger', '4000092': 'Battle Drill', '4000095': 'Electro Titan',
  '4000097': 'Apprentice Warden', '4000109': 'Ruin Witch', '4000110': 'Root Rider',
  '4000123': 'Druid', '4000132': 'Thrower', '4000135': 'Troop Launcher', '4000150': 'Furnace',
  '4000177': 'Meteor Golem', '4000188': 'Sky Wagon',
  // Spells
  '26000000': 'Lightning Spell', '26000001': 'Healing Spell', '26000002': 'Rage Spell',
  '26000003': 'Jump Spell', '26000005': 'Freeze Spell', '26000009': 'Poison Spell',
  '26000010': 'Earthquake Spell', '26000011': 'Haste Spell', '26000016': 'Clone Spell',
  '26000017': 'Skeleton Spell', '26000028': 'Bat Spell', '26000035': 'Invisibility Spell',
  '26000053': 'Recall Spell', '26000070': 'Overgrowth Spell', '26000098': 'Revive Spell',
  '26000109': 'Ice Block Spell', '26000120': 'Totem Spell', '26000123': 'Angry Spell',
};

const DEFENSES = new Set([
  'Cannon', 'Archer Tower', 'Mortar', 'Air Defense', 'Wizard Tower', 'Air Sweeper',
  'Hidden Tesla', 'Bomb Tower', 'X-Bow', 'Inferno Tower', 'Eagle Artillery', 'Scattershot',
  'Spell Tower', 'Monolith', 'Multi-Archer Tower', 'Multi-Gear Tower', 'Ricochet Cannon',
  'Revenge Tower', 'Firespitter', 'Super Wizard Tower',
]);

const ARMY = new Set([
  'Army Camp', 'Barracks', 'Dark Barracks', 'Laboratory', 'Spell Factory',
  'Dark Spell Factory', 'Workshop', 'Pet House', 'Blacksmith', 'Hero Hall',
  'Clan Castle', 'Crafting Station',
]);

const RESOURCES = new Set([
  'Elixir Collector', 'Elixir Storage', 'Gold Mine', 'Gold Storage',
  'Dark Elixir Drill', 'Dark Elixir Storage',
]);

/* ------------------------------------------------------------------ */

type Row = {
  id: string;
  name: string;
  count: number;
  levels: Map<number, number>; // level -> how many
};

const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function aggregate(list: any): Row[] {
  const rows = new Map<string, Row>();
  if (!Array.isArray(list)) return [];

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.data ?? '');
    if (!id) continue;

    const level = toNum(item.lvl, 0);
    const count = Math.max(1, toNum(item.cnt, 1));

    let row = rows.get(id);
    if (!row) {
      row = { id, name: NAMES[id] || `Item #${id}`, count: 0, levels: new Map() };
      rows.set(id, row);
    }

    row.count += count;
    row.levels.set(level, (row.levels.get(level) || 0) + count);
  }

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function parseExport(text: string): Dict {
  const raw = text.trim();
  let parsed: any;

  try {
    parsed = JSON.parse(raw);
  } catch {
    const a = raw.indexOf('{');
    const b = raw.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('not json');
    parsed = JSON.parse(raw.slice(a, b + 1));
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.buildings)) {
    throw new Error('missing buildings');
  }

  return parsed;
}

function loadSaved(): Dict | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function levelsSorted(row: Row) {
  return Array.from(row.levels.entries()).sort((a, b) => b[0] - a[0]);
}

/* ------------------------------------------------------------------ */

function Chip({ level, count, low }: { level: number; count: number; low?: boolean }) {
  return (
    <span
      className={[
        'rounded-lg border px-2 py-1 text-xs font-bold',
        low
          ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
          : 'border-white/10 bg-white/[0.04] text-slate-200',
      ].join(' ')}
    >
      Lv {level}
      {count > 1 ? ` ×${count}` : ''}
    </span>
  );
}

function RowItem({ row, showCount = true }: { row: Row; showCount?: boolean }) {
  const levels = levelsSorted(row);
  const lowest = levels.length > 1 ? levels[levels.length - 1][0] : null;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{row.name}</p>
        {showCount && row.count > 1 && (
          <span className="text-xs font-semibold text-slate-400">×{row.count}</span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {levels.map(([level, count]) => (
          <Chip key={level} level={level} count={count} low={lowest === level} />
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  eyebrow,
  icon,
  rows,
  showCount = true,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  rows: Row[];
  showCount?: boolean;
}) {
  if (!rows.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-amber-300">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
            {eyebrow}
          </p>
          <h2 className="text-lg font-black">{title}</h2>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(row => (
          <RowItem key={row.id} row={row} showCount={showCount} />
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function VillagePage() {
  const [village, setVillage] = useState<Dict | null>(() => loadSaved());
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const importText = (value: string) => {
    try {
      const parsed = parseExport(value);
      setVillage(parsed);
      setError('');
      setText('');
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        /* storage full or blocked: the data still works for this session */
      }
    } catch {
      setError(
        'Could not read this data. Use the JSON from Clash of Clans: Settings → More Settings → Data Export.',
      );
    }
  };

  const onFile = async (file?: File | null) => {
    if (!file) return;
    importText(await file.text());
    if (fileRef.current) fileRef.current.value = '';
  };

  const clear = () => {
    setVillage(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const view = useMemo(() => {
    if (!village) return null;

    const all = aggregate(village.buildings);
    const walls = all.filter(r => r.name === 'Wall');
    const buildings = all.filter(r => r.name !== 'Wall');

    const townHall = buildings.find(r => r.name === 'Town Hall');
    const thLevel = townHall ? levelsSorted(townHall)[0]?.[0] || 0 : 0;

    const defenses = buildings.filter(r => DEFENSES.has(r.name));
    const army = buildings.filter(r => ARMY.has(r.name));
    const resources = buildings.filter(r => RESOURCES.has(r.name));
    const other = buildings.filter(
      r => !DEFENSES.has(r.name) && !ARMY.has(r.name) && !RESOURCES.has(r.name),
    );

    const traps = aggregate(village.traps);
    const heroes = aggregate(village.heroes);
    const pets = aggregate(village.pets);
    const troops = aggregate([...(village.units || []), ...(village.siege_machines || [])]);
    const spells = aggregate(village.spells);
    const equipment = Array.isArray(village.equipment) ? village.equipment : [];

    const wallCount = walls.reduce((t, r) => t + r.count, 0);
    const buildingCount = buildings.reduce((t, r) => t + r.count, 0);

    // Lowest-level defenses (relative to your own base)
    const defenseInstances: { name: string; level: number; count: number }[] = [];
    for (const row of defenses) {
      for (const [level, count] of Array.from(row.levels.entries())) {
        defenseInstances.push({ name: row.name, level, count });
      }
    }
    defenseInstances.sort((a, b) => a.level - b.level);

    const heroLevels = heroes.reduce(
      (t, r) => t + Array.from(r.levels.keys()).reduce((s, l) => s + l, 0),
      0,
    );

    return {
      thLevel,
      defenses,
      army,
      resources,
      other,
      walls,
      traps,
      heroes,
      pets,
      troops,
      spells,
      equipmentCount: equipment.length,
      wallCount,
      buildingCount,
      weakest: defenseInstances.slice(0, 8),
      heroLevels,
    };
  }, [village]);

  const exportedAt = village?.timestamp
    ? new Date(toNum(village.timestamp) * 1000).toLocaleDateString()
    : null;

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-screen bg-[#07090d]">
        <AppSidebar clanName="CLASHIQ" clanTag={String(village?.tag || '')} />

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

              <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                Village Import
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Buildings, defenses, traps and walls are not available from the
                official Clash API. Import your in-game Data Export to see them here.
                Your data is read in this app and stays on this device.
              </p>
            </div>

            {/* Import */}
            <section className="rounded-2xl border border-sky-300/20 bg-[#11151c]/90 p-5 shadow-xl">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
                >
                  <Upload className="h-4 w-4" />
                  Choose file
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,.txt,application/json,text/plain"
                  className="hidden"
                  onChange={e => void onFile(e.target.files?.[0])}
                />

                {village && (
                  <button
                    type="button"
                    onClick={clear}
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove imported data
                  </button>
                )}
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                Or paste the data
              </p>

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder='{"tag":"#...","buildings":[...]}'
                spellCheck={false}
                className="mt-2 h-28 w-full resize-y rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs outline-none focus:border-amber-300/50"
              />

              <button
                type="button"
                disabled={!text.trim()}
                onClick={() => importText(text)}
                className="mt-3 inline-flex h-11 items-center rounded-xl border border-amber-300/40 bg-amber-300/10 px-5 text-sm font-bold text-amber-200 transition hover:bg-amber-300/20 disabled:opacity-40"
              >
                Import pasted data
              </button>

              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            </section>

            {!view && (
              <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-500">
                No village imported yet. In Clash of Clans open Settings → More
                Settings → Data Export, copy or save the data, then choose the file
                or paste it above.
              </p>
            )}

            {view && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat
                    label="Town Hall"
                    value={view.thLevel ? `TH ${view.thLevel}` : '—'}
                    sub={exportedAt ? `Exported ${exportedAt}` : undefined}
                  />
                  <Stat label="Buildings" value={String(view.buildingCount)} sub="excluding walls" />
                  <Stat label="Walls" value={String(view.wallCount)} />
                  <Stat
                    label="Hero levels"
                    value={String(view.heroLevels)}
                    sub={`${view.equipmentCount} equipment items`}
                  />
                </div>

                {view.weakest.length > 0 && (
                  <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                      Upgrade focus
                    </p>
                    <h2 className="text-lg font-black">Lowest-level defenses</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Sorted by level within your own base.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {view.weakest.map((d, i) => (
                        <span
                          key={`${d.name}-${d.level}-${i}`}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-bold"
                        >
                          {d.name} · Lv {d.level}
                          {d.count > 1 ? ` ×${d.count}` : ''}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <Section title="Defenses" eyebrow="Home village" icon={<Shield className="h-5 w-5" />} rows={view.defenses} />
                <Section title="Traps" eyebrow="Home village" icon={<Zap className="h-5 w-5" />} rows={view.traps} />
                <Section title="Army buildings" eyebrow="Home village" icon={<Swords className="h-5 w-5" />} rows={view.army} />
                <Section title="Resources" eyebrow="Home village" icon={<Hammer className="h-5 w-5" />} rows={view.resources} />
                <Section title="Other buildings" eyebrow="Home village" icon={<Castle className="h-5 w-5" />} rows={view.other} />
                <Section title="Walls" eyebrow="Home village" icon={<Castle className="h-5 w-5" />} rows={view.walls} showCount={false} />
                <Section title="Heroes" eyebrow="Units" icon={<Crown className="h-5 w-5" />} rows={view.heroes} />
                <Section title="Pets" eyebrow="Units" icon={<Sparkles className="h-5 w-5" />} rows={view.pets} />
                <Section title="Troops & siege machines" eyebrow="Units" icon={<Swords className="h-5 w-5" />} rows={view.troops} />
                <Section title="Spells" eyebrow="Units" icon={<Sparkles className="h-5 w-5" />} rows={view.spells} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
