import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Castle,
  Clock3,
  Coins,
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
import { getUpgradeCost, type UpgradeCost } from '@/lib/upgrade-catalog';

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

/*
 * Current TH18 max-level catalog.
 * Source: Clash Ninja's current max-level table (updated for 2026).
 * We keep the catalog in Clash IQ rather than depending on a live scrape.
 */
const TH13_MAX: Record<string, number> = {
  Cannon: 19, 'Archer Tower': 19, Mortar: 13, 'Air Defense': 11, 'Wizard Tower': 13,
  'Air Sweeper': 7, 'Hidden Tesla': 12, 'Bomb Tower': 8, 'X-Bow': 8, 'Inferno Tower': 7,
  'Eagle Artillery': 4, Scattershot: 2,
  Bomb: 9, 'Spring Trap': 8, 'Air Bomb': 8, 'Giant Bomb': 7, 'Seeking Air Mine': 4,
  'Skeleton Trap': 4, 'Tornado Trap': 3,
  'Army Camp': 11, Barracks: 15, 'Clan Castle': 9, Laboratory: 11, 'Hero Hall': 7,
  'Spell Factory': 7, 'Dark Barracks': 10, 'Dark Spell Factory': 6, Blacksmith: 6, Workshop: 5,
  'Gold Mine': 15, 'Elixir Collector': 15, 'Gold Storage': 14, 'Elixir Storage': 14,
  'Dark Elixir Drill': 9, 'Dark Elixir Storage': 8, 'Helper Hut': 1, Wall: 15,
  Barbarian: 9, Archer: 9, Giant: 10, Goblin: 8, 'Wall Breaker': 9, Balloon: 9,
  Wizard: 10, Healer: 6, Dragon: 8, 'P.E.K.K.A': 9, 'Baby Dragon': 7, Miner: 7,
  'Electro Dragon': 4, Yeti: 2, 'Dragon Rider': 2,
  Minion: 9, 'Hog Rider': 10, Valkyrie: 8, Golem: 10, Witch: 5, 'Lava Hound': 6,
  Bowler: 5, 'Ice Golem': 5, Headhunter: 3, 'Apprentice Warden': 3, Druid: 2,
  'Lightning Spell': 9, 'Healing Spell': 8, 'Rage Spell': 6, 'Poison Spell': 7,
  'Earthquake Spell': 5, 'Jump Spell': 4, 'Freeze Spell': 7, 'Haste Spell': 5,
  'Skeleton Spell': 7, 'Clone Spell': 6, 'Bat Spell': 5, 'Invisibility Spell': 4,
  'Overgrowth Spell': 2, 'Recall Spell': 2,
  'Wall Wrecker': 4, 'Battle Blimp': 4, 'Stone Slammer': 4, 'Siege Barracks': 4, 'Log Launcher': 4,
  'Barbarian King': 75, 'Archer Queen': 75, 'Grand Warden': 50,
};

const TH18_MAX: Record<string, number> = {
  'Cannon': 21, 'Archer Tower': 21, 'Mortar': 18, 'Air Defense': 16,
  'Wizard Tower': 17, 'Air Sweeper': 7, 'Hidden Tesla': 17, 'Bomb Tower': 13,
  'X-Bow': 13, 'Inferno Tower': 12, 'Scattershot': 7, 'Builder Hut': 8,
  'Monolith': 5, 'Spell Tower': 4, 'Multi-Archer Tower': 4,
  'Ricochet Cannon': 4, 'Firespitter': 3, 'Multi-Gear Tower': 3,
  'Revenge Tower': 2, 'Super Wizard Tower': 2,
  'Bomb': 14, 'Spring Trap': 13, 'Air Bomb': 13, 'Giant Bomb': 12,
  'Seeking Air Mine': 8, 'Skeleton Trap': 5, 'Tornado Trap': 3, 'Giga Bomb': 4,
  'Army Camp': 14, 'Barracks': 19, 'Clan Castle': 14, 'Laboratory': 16,
  'Hero Hall': 12, 'Spell Factory': 9, 'Dark Barracks': 13,
  'Dark Spell Factory': 8, 'Blacksmith': 10, 'Workshop': 9, 'Pet House': 12,
  'Gold Mine': 17, 'Elixir Collector': 17, 'Gold Storage': 19,
  'Elixir Storage': 19, 'Dark Elixir Drill': 11, 'Dark Elixir Storage': 13,
  'Helper Hut': 1, 'Wall': 19,
  'Barbarian': 13, 'Archer': 14, 'Giant': 14, 'Goblin': 10,
  'Wall Breaker': 14, 'Balloon': 13, 'Wizard': 14, 'Healer': 11,
  'Dragon': 13, 'P.E.K.K.A': 13, 'Baby Dragon': 12, 'Miner': 12,
  'Electro Dragon': 9, 'Yeti': 8, 'Dragon Rider': 6, 'Electro Titan': 5,
  'Root Rider': 4, 'Thrower': 4, 'Meteor Golem': 3,
  'Minion': 14, 'Hog Rider': 15, 'Valkyrie': 12, 'Golem': 15,
  'Witch': 8, 'Lava Hound': 8, 'Bowler': 10, 'Ice Golem': 9,
  'Headhunter': 4, 'Apprentice Warden': 4, 'Druid': 6, 'Furnace': 4,
  'Ruin Witch': 4,
  'Lightning Spell': 13, 'Healing Spell': 12, 'Rage Spell': 7,
  'Poison Spell': 12, 'Earthquake Spell': 8, 'Jump Spell': 5,
  'Freeze Spell': 8, 'Haste Spell': 7, 'Skeleton Spell': 8,
  'Clone Spell': 9, 'Bat Spell': 8, 'Invisibility Spell': 4,
  'Overgrowth Spell': 5, 'Recall Spell': 7, 'Ice Block Spell': 6,
  'Revive Spell': 5, 'Angry Spell': 4, 'Totem Spell': 4,
  'Wall Wrecker': 6, 'Battle Blimp': 6, 'Stone Slammer': 6,
  'Siege Barracks': 6, 'Log Launcher': 6, 'Flame Flinger': 5,
  'Battle Drill': 6, 'Troop Launcher': 4, 'Sky Wagon': 4,
  'Barbarian King': 110, 'Archer Queen': 110, 'Minion Prince': 95,
  'Grand Warden': 85, 'Royal Champion': 55, 'Dragon Duke': 25,
  'L.A.S.S.I': 15, 'Electro Owl': 15, 'Mighty Yak': 15, 'Unicorn': 15,
  'Frosty': 15, 'Diggy': 15, 'Poison Lizard': 15, 'Phoenix': 10,
  'Spirit Fox': 10, 'Angry Jelly': 10, 'Sneezy': 10, 'Greedy Raven': 10,
};

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

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function maxLevelFor(thLevel: number, name: string): number | undefined {
  if (thLevel === 13) return TH13_MAX[name];
  if (thLevel === 18) return TH18_MAX[name];
  return undefined;
}

function progressForRow(row: Row, maxLevel: number | undefined) {
  if (!maxLevel) return null;
  let current = 0;
  let remaining = 0;
  let possible = 0;
  for (const [level, count] of row.levels) {
    current += level * count;
    remaining += Math.max(0, maxLevel - level) * count;
    possible += maxLevel * count;
  }
  return {
    maxLevel,
    current,
    remaining,
    percent: possible > 0 ? Math.min(100, Math.round((current / possible) * 100)) : 0,
  };
}

function economicsForRow(row: Row, maxLevel: number | undefined) {
  if (!maxLevel) return null;
  let gold = 0, elixir = 0, darkElixir = 0, seconds = 0;
  let coveredLevels = 0, missingLevels = 0;
  let next: { from: number; to: number; count: number; data: UpgradeCost } | null = null;

  for (const [level, count] of row.levels) {
    if (level >= maxLevel) continue;
    const first = getUpgradeCost(row.name, level + 1);
    if (first && !next) next = { from: level, to: level + 1, count, data: first };
    for (let target = level + 1; target <= maxLevel; target += 1) {
      const data = getUpgradeCost(row.name, target);
      if (!data) {
        missingLevels += count;
        continue;
      }
      coveredLevels += count;
      seconds += data.seconds * count;
      if (data.resource === 'Gold') gold += data.cost * count;
      if (data.resource === 'Elixir') elixir += data.cost * count;
      if (data.resource === 'Dark Elixir') darkElixir += data.cost * count;
    }
  }

  if (!coveredLevels && !missingLevels && !next) return null;
  return {
    gold, elixir, darkElixir, seconds, coveredLevels, missingLevels,
    coveragePercent: coveredLevels + missingLevels > 0
      ? Math.round((coveredLevels / (coveredLevels + missingLevels)) * 100)
      : 100,
    next,
  };
}

function formatResource(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
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

function RowItem({
  row,
  showCount = true,
  maxLevel,
}: {
  row: Row;
  showCount?: boolean;
  maxLevel?: number;
}) {
  const levels = levelsSorted(row);
  const lowest = levels.length > 1 ? levels[levels.length - 1][0] : null;
  const progress = progressForRow(row, maxLevel);
  const economics = economicsForRow(row, maxLevel);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{row.name}</p>
          {progress && (
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
              {progress.remaining === 0 ? 'MAXED' : `${progress.remaining} levels left`}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {progress && (
            <span className="text-xs font-black text-amber-200">
              {Math.max(...levels.map(([level]) => level))}/{progress.maxLevel}
            </span>
          )}
          {showCount && row.count > 1 && (
            <span className="text-xs font-semibold text-slate-400">×{row.count}</span>
          )}
        </div>
      </div>

      {economics?.next && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-amber-200">
            Nästa: Lv {economics.next.from} → {economics.next.to}
          </span>
          <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-slate-300">
            {formatResource(economics.next.data.cost)} {economics.next.data.resource}
          </span>
          <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-slate-300">
            {formatDuration(economics.next.data.seconds)}
          </span>
        </div>
      )}

      {progress && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-amber-300 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}

      {economics && economics.coveredLevels > 0 && progress && progress.remaining > 0 && (
        <p className="mt-2 text-[10px] font-semibold text-slate-500">
          Kvar med katalogdata: {formatResource(economics.gold)} Gold · {formatResource(economics.elixir)} Elixir{economics.darkElixir > 0 ? ` · ${formatResource(economics.darkElixir)} Dark Elixir` : ''} · {formatDuration(economics.seconds)}{economics.coveragePercent < 100 ? ` · ${economics.coveragePercent}% täckning` : ''}
        </p>
      )}

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
  thLevel,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  rows: Row[];
  showCount?: boolean;
  thLevel: number;
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
          <RowItem
            key={row.id}
            row={row}
            showCount={showCount}
            maxLevel={maxLevelFor(thLevel, row.name)}
          />
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

    const progressRows = [...buildings, ...traps, ...heroes, ...pets, ...troops, ...spells, ...walls];
    const progress = progressRows
      .map(row => ({ row, stats: progressForRow(row, maxLevelFor(thLevel, row.name)) }))
      .filter((x): x is { row: Row; stats: NonNullable<ReturnType<typeof progressForRow>> } => Boolean(x.stats));

    const totalPossible = progress.reduce((t, x) => t + x.stats.maxLevel * x.row.count, 0);
    const totalCurrent = progress.reduce((t, x) => t + x.stats.current, 0);
    const totalRemainingLevels = progress.reduce((t, x) => t + x.stats.remaining, 0);
    const economicsRows = progress
      .map(x => ({ row: x.row, economics: economicsForRow(x.row, x.stats.maxLevel) }))
      .filter((x): x is { row: Row; economics: NonNullable<ReturnType<typeof economicsForRow>> } => Boolean(x.economics));
    const totalEconomics = economicsRows.reduce(
      (acc, x) => ({
        gold: acc.gold + x.economics.gold,
        elixir: acc.elixir + x.economics.elixir,
        darkElixir: acc.darkElixir + x.economics.darkElixir,
        seconds: acc.seconds + x.economics.seconds,
        coveredLevels: acc.coveredLevels + x.economics.coveredLevels,
        missingLevels: acc.missingLevels + x.economics.missingLevels,
      }),
      { gold: 0, elixir: 0, darkElixir: 0, seconds: 0, coveredLevels: 0, missingLevels: 0 },
    );
    const estimatedSixBuilderSeconds = Math.ceil(totalEconomics.seconds / 6);

    const completionPercent = totalPossible > 0
      ? Math.min(100, Math.round((totalCurrent / totalPossible) * 100))
      : 0;

    const rawSources = [
      ['Buildings', village.buildings],
      ['Traps', village.traps],
      ['Troops', village.units],
      ['Siege', village.siege_machines],
      ['Heroes', village.heroes],
      ['Pets', village.pets],
      ['Spells', village.spells],
    ] as const;

    const exportTimestamp = toNum(village.timestamp, Math.floor(Date.now() / 1000));
    const now = Date.now() / 1000;
    const activeUpgrades: { name: string; level: number; seconds: number; kind: string }[] = [];
    for (const [kind, source] of rawSources) {
      if (!Array.isArray(source)) continue;
      for (const item of source) {
        if (!item || typeof item !== 'object') continue;
        const timer = Number((item as Dict).timer);
        if (!Number.isFinite(timer) || timer <= 0) continue;
        const remainingSeconds = Math.max(0, timer - (now - exportTimestamp));
        if (remainingSeconds <= 0) continue;
        const id = String((item as Dict).data ?? '');
        activeUpgrades.push({
          name: NAMES[id] || `Item #${id}`,
          level: toNum((item as Dict).lvl, 0),
          seconds: remainingSeconds,
          kind,
        });
      }
    }
    activeUpgrades.sort((a, b) => a.seconds - b.seconds);

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
      progress,
      totalRemainingLevels,
      completionPercent,
      totalEconomics,
      estimatedSixBuilderSeconds,
      activeUpgrades,
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
                Buildings, defenses, traps, walls and active upgrade timers are not available
                from the official Clash API. Import your in-game Data Export to see them here.
                Clash IQ calculates the progress locally and does not need a live Clash Ninja connection.
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
                No village imported yet. In Clash of Clans open Settings → More Settings → Data Export,
                copy or save the data, then choose the file or paste it above.
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

                {/* Dynamic village progress */}
                <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5 shadow-xl">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                        Village intelligence
                      </p>
                      <h2 className="mt-1 text-lg font-black">How close are you to max?</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Calculated from your imported levels and the current max-level catalog for the detected Town Hall.
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-300/20 bg-black/20 px-4 py-2 text-right">
                      <p className="text-2xl font-black text-amber-200">{view.completionPercent}%</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">max progress</p>
                    </div>
                  </div>

                  <div className="mt-5 h-4 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-amber-500 to-yellow-300 transition-all"
                      style={{ width: `${view.completionPercent}%` }}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Stat label="Levels left" value={view.totalRemainingLevels.toLocaleString()} sub="recognized upgrade levels" />
                    <Stat label="Tracked items" value={String(view.progress.length)} sub="with current max data" />
                    <Stat
                      label="Active upgrades"
                      value={String(view.activeUpgrades.length)}
                      sub={view.activeUpgrades[0] ? `Next: ${formatDuration(view.activeUpgrades[0].seconds)}` : 'No active timers in export'}
                    />
                  </div>

                  {view.activeUpgrades.length > 0 && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {view.activeUpgrades.map((upgrade, index) => (
                        <div key={`${upgrade.name}-${index}`} className="rounded-xl border border-sky-300/15 bg-sky-300/[0.04] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">{upgrade.name}</p>
                              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                                {upgrade.kind} · Lv {upgrade.level}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-black text-sky-200">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatDuration(upgrade.seconds)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 font-bold text-slate-200">
                          <Coins className="h-4 w-4 text-amber-300" />
                          Upgrade economics
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Clash IQ calculates the next upgrade and its cost/time from the local upgrade catalog.
                        </p>
                      </div>
                      <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        {view.totalEconomics.coveredLevels} nivåer täckta{view.totalEconomics.missingLevels > 0 ? ` · ${view.totalEconomics.missingLevels} saknas` : ''}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">Gold remaining</p>
                        <p className="mt-1 text-xl font-black">{formatResource(view.totalEconomics.gold)}</p>
                      </div>
                      <div className="rounded-xl border border-pink-300/15 bg-pink-300/[0.04] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-pink-300">Elixir remaining</p>
                        <p className="mt-1 text-xl font-black">{formatResource(view.totalEconomics.elixir)}</p>
                      </div>
                      <div className="rounded-xl border border-purple-300/15 bg-purple-300/[0.04] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-300">Dark Elixir remaining</p>
                        <p className="mt-1 text-xl font-black">{formatResource(view.totalEconomics.darkElixir)}</p>
                      </div>
                      <div className="rounded-xl border border-sky-300/15 bg-sky-300/[0.04] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-300">Total builder time</p>
                        <p className="mt-1 text-xl font-black">{formatDuration(view.totalEconomics.seconds)}</p>
                        <p className="mt-1 text-[10px] text-slate-500">All upgrades combined</p>
                      </div>
                      <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">With 6 builders</p>
                        <p className="mt-1 text-xl font-black">{formatDuration(view.estimatedSixBuilderSeconds)}</p>
                        <p className="mt-1 text-[10px] text-slate-500">Ideal parallel estimate</p>
                      </div>
                    </div>
                    {view.totalEconomics.missingLevels > 0 && (
                      <p className="mt-3 text-[10px] font-semibold text-slate-500">
                        Totals are partial until the remaining upgrade data is verified. Clash IQ never guesses missing prices.
                      </p>
                    )}
                  </div>
                </section>

                {view.weakest.length > 0 && (
                  <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                      Upgrade focus
                    </p>
                    <h2 className="text-lg font-black">Lowest-level defenses</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Sorted by level within your village.
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

                <Section title="Defenses" eyebrow="Home village" icon={<Shield className="h-5 w-5" />} rows={view.defenses} thLevel={view.thLevel} />
                <Section title="Traps" eyebrow="Home village" icon={<Zap className="h-5 w-5" />} rows={view.traps} thLevel={view.thLevel} />
                <Section title="Army buildings" eyebrow="Home village" icon={<Swords className="h-5 w-5" />} rows={view.army} thLevel={view.thLevel} />
                <Section title="Resources" eyebrow="Home village" icon={<Hammer className="h-5 w-5" />} rows={view.resources} thLevel={view.thLevel} />
                <Section title="Other buildings" eyebrow="Home village" icon={<Castle className="h-5 w-5" />} rows={view.other} thLevel={view.thLevel} />
                <Section title="Walls" eyebrow="Home village" icon={<Castle className="h-5 w-5" />} rows={view.walls} showCount={false} thLevel={view.thLevel} />
                <Section title="Heroes" eyebrow="Units" icon={<Crown className="h-5 w-5" />} rows={view.heroes} thLevel={view.thLevel} />
                <Section title="Pets" eyebrow="Units" icon={<Sparkles className="h-5 w-5" />} rows={view.pets} thLevel={view.thLevel} />
                <Section title="Troops & siege machines" eyebrow="Units" icon={<Swords className="h-5 w-5" />} rows={view.troops} thLevel={view.thLevel} />
                <Section title="Spells" eyebrow="Units" icon={<Sparkles className="h-5 w-5" />} rows={view.spells} thLevel={view.thLevel} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
