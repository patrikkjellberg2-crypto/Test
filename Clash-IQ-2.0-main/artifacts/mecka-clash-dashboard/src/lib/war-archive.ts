/**
 * Local war archive. Everything is stored in this device's browser storage
 * (localStorage), so it survives app restarts but not "clear app data".
 * Use Export on the War Archive page to keep a backup.
 */

export type ArchivedAttack = {
  attackerTag: string;
  defenderTag: string;
  stars: number;
  destruction: number;
  order: number;
};

export type ArchivedMember = {
  tag: string;
  name: string;
  th: number;
  pos: number;
  attacks: ArchivedAttack[];
};

export type ArchivedWar = {
  id: string;
  updatedAt: number;
  state: string;
  result: 'win' | 'lose' | 'tie' | '';
  teamSize: number;
  attacksPerMember: number;
  startTime: string;
  endTime: string;
  clan: { tag: string; name: string; stars: number; destruction: number; attacks: number };
  opponent: { tag: string; name: string; stars: number; destruction: number };
  members: ArchivedMember[];
  opponentMembers: { tag: string; name: string; th: number; pos: number }[];
};

const KEY = 'clashiq.wars.v1';
const MAX_WARS = 120;
export const WARS_EVENT = 'clashiq:wars-changed';

type Dict = Record<string, any>;
const d = (v: any): Dict => (v && typeof v === 'object' ? v : {});
const s = (v: any) => (typeof v === 'string' ? v : '');
const n = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Supercell timestamps look like 20260924T031500.000Z */
export function warTime(value: string): number {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(value || '');
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function warId(opponentTag: string, endTime: string) {
  const t = warTime(endTime);
  const day = t ? new Date(t).toISOString().slice(0, 10) : 'unknown';
  return `${opponentTag}|${day}`;
}

export function readWars(): ArchivedWar[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeWars(wars: ArchivedWar[]) {
  let list = wars
    .slice()
    .sort((a, b) => warTime(b.endTime) - warTime(a.endTime))
    .slice(0, MAX_WARS);

  for (let i = 0; i < 6; i++) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      window.dispatchEvent(new Event(WARS_EVENT));
      return;
    } catch {
      // storage full: drop the oldest quarter and retry
      list = list.slice(0, Math.max(1, Math.floor(list.length * 0.75)));
    }
  }
}

function fromWarObject(war: Dict): ArchivedWar | null {
  const clan = d(war.clan);
  const opp = d(war.opponent);
  const endTime = s(war.endTime);
  if (!s(clan.tag) || !s(opp.tag) || !endTime) return null;

  const members = (Array.isArray(clan.members) ? clan.members : []).map((m: any) => ({
    tag: s(m?.tag),
    name: s(m?.name),
    th: n(m?.townhallLevel),
    pos: n(m?.mapPosition),
    attacks: (Array.isArray(m?.attacks) ? m.attacks : []).map((a: any) => ({
      attackerTag: s(a?.attackerTag),
      defenderTag: s(a?.defenderTag),
      stars: n(a?.stars),
      destruction: n(a?.destructionPercentage),
      order: n(a?.order),
    })),
  }));

  const opponentMembers = (Array.isArray(opp.members) ? opp.members : []).map((m: any) => ({
    tag: s(m?.tag),
    name: s(m?.name),
    th: n(m?.townhallLevel),
    pos: n(m?.mapPosition),
  }));

  return {
    id: warId(s(opp.tag), endTime),
    updatedAt: Date.now(),
    state: s(war.state),
    result: '',
    teamSize: n(war.teamSize),
    attacksPerMember: n(war.attacksPerMember) || 2,
    startTime: s(war.startTime),
    endTime,
    clan: {
      tag: s(clan.tag),
      name: s(clan.name),
      stars: n(clan.stars),
      destruction: n(clan.destructionPercentage),
      attacks: n(clan.attacks),
    },
    opponent: {
      tag: s(opp.tag),
      name: s(opp.name),
      stars: n(opp.stars),
      destruction: n(opp.destructionPercentage),
    },
    members,
    opponentMembers,
  };
}

/** Save/refresh the war that is running right now (with per-player attacks). */
export function archiveCurrentWar(currentWar: unknown) {
  const war = d(currentWar);
  const state = s(war.state);
  if (!['inWar', 'warEnded'].includes(state)) return;

  const next = fromWarObject(war);
  if (!next) return;

  const all = readWars();
  const index = all.findIndex(w => w.id === next.id);
  if (index >= 0) next.result = all[index].result;
  if (index >= 0) all[index] = next;
  else all.push(next);
  writeWars(all);
}

/** Merge the official war log (results of finished wars, no per-player detail). */
export function archiveWarLog(warlog: unknown) {
  const items = Array.isArray(warlog) ? warlog : [];
  if (!items.length) return;

  const all = readWars();
  let changed = false;

  for (const raw of items) {
    const item = d(raw);
    const opp = d(item.opponent);
    const clan = d(item.clan);
    const endTime = s(item.endTime);
    const result = s(item.result).toLowerCase();
    if (!s(opp.tag) || !endTime) continue;

    const id = warId(s(opp.tag), endTime);
    const index = all.findIndex(w => w.id === id);
    const res: ArchivedWar['result'] =
      result === 'win' || result === 'lose' || result === 'tie' ? result : '';

    if (index >= 0) {
      if (all[index].result !== res && res) {
        all[index] = { ...all[index], result: res, state: 'warEnded' };
        changed = true;
      }
      continue;
    }

    all.push({
      id,
      updatedAt: Date.now(),
      state: 'warEnded',
      result: res,
      teamSize: n(item.teamSize),
      attacksPerMember: n(item.attacksPerMember) || 2,
      startTime: '',
      endTime,
      clan: {
        tag: s(clan.tag),
        name: s(clan.name),
        stars: n(clan.stars),
        destruction: n(clan.destructionPercentage),
        attacks: n(clan.attacks),
      },
      opponent: {
        tag: s(opp.tag),
        name: s(opp.name),
        stars: n(opp.stars),
        destruction: n(opp.destructionPercentage),
      },
      members: [],
      opponentMembers: [],
    });
    changed = true;
  }

  if (changed) writeWars(all);
}

export function warOutcome(w: ArchivedWar): 'win' | 'lose' | 'tie' | 'live' {
  if (w.result) return w.result;
  const finished = w.state === 'warEnded' || warTime(w.endTime) < Date.now();
  if (!finished) return 'live';
  if (w.clan.stars !== w.opponent.stars) return w.clan.stars > w.opponent.stars ? 'win' : 'lose';
  if (w.clan.destruction !== w.opponent.destruction)
    return w.clan.destruction > w.opponent.destruction ? 'win' : 'lose';
  return 'tie';
}

export function exportWarsJson(): string {
  return JSON.stringify({ app: 'clashiq', version: 1, exportedAt: new Date().toISOString(), wars: readWars() });
}

/** Merge a backup file into the local archive. Returns how many wars were added/updated. */
export function importWarsJson(text: string): number {
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

  const incoming: ArchivedWar[] = Array.isArray(parsed) ? parsed : parsed?.wars;
  if (!Array.isArray(incoming)) throw new Error('no wars');

  const all = readWars();
  let count = 0;

  for (const w of incoming) {
    if (!w || typeof w.id !== 'string' || !w.clan || !w.opponent) continue;
    const index = all.findIndex(x => x.id === w.id);
    if (index < 0) {
      all.push(w);
      count++;
    } else if ((w.updatedAt || 0) > (all[index].updatedAt || 0)) {
      all[index] = w;
      count++;
    }
  }

  writeWars(all);
  return count;
}

export function clearWars() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(WARS_EVENT));
}
