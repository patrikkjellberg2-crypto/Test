import { useEffect, useMemo, useState } from 'react';
import { Clock3, Swords } from 'lucide-react';

type Dict = Record<string, any>;

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function parseClashTime(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 100000000000 ? value * 1000 : value;
  }

  const raw = str(value).trim();
  if (!raw) return null;

  // Clash of Clans commonly returns timestamps such as:
  // 20260916T120000.000Z
  const match = raw.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:\.(\d+))?Z?$/,
  );

  if (match) {
    const [, year, month, day, hour, minute, second, fraction] = match;
    const milliseconds = fraction
      ? Number(fraction.slice(0, 3).padEnd(3, '0'))
      : 0;

    const timestamp = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      milliseconds,
    );

    return Number.isFinite(timestamp) ? timestamp : null;
  }

  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeWarState(value: unknown): string {
  const state = str(value).toLowerCase();

  if (
    state === 'preparation' ||
    state === 'preparationinprogress' ||
    state === 'prep'
  ) {
    return 'preparation';
  }

  if (
    state === 'inwar' ||
    state === 'in_war' ||
    state === 'war' ||
    state === 'ongoing'
  ) {
    return 'inwar';
  }

  if (
    state === 'warended' ||
    state === 'war_ended' ||
    state === 'ended'
  ) {
    return 'ended';
  }

  return state;
}

function getPreparationStart(war: Dict): number | null {
  return (
    parseClashTime(war.preparationStartTime) ??
    parseClashTime(war.prepStartTime)
  );
}

function getWarStart(war: Dict): number | null {
  return (
    parseClashTime(war.startTime) ??
    parseClashTime(war.warStartTime)
  );
}

function getWarEnd(war: Dict): number | null {
  return (
    parseClashTime(war.endTime) ??
    parseClashTime(war.warEndTime)
  );
}

function getTargetTimestamp(war: Dict, state: string): number | null {
  if (state === 'preparation') {
    const explicitStart = getWarStart(war);
    if (explicitStart !== null) return explicitStart;

    const prepStart = getPreparationStart(war);
    if (prepStart !== null) {
      return prepStart + 24 * 60 * 60 * 1000;
    }

    return null;
  }

  if (state === 'inwar') {
    const explicitEnd = getWarEnd(war);
    if (explicitEnd !== null) return explicitEnd;

    const warStart = getWarStart(war);
    if (warStart !== null) {
      return warStart + 24 * 60 * 60 * 1000;
    }

    return null;
  }

  return null;
}

function formatCountdown(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function WarTimer({
  currentWar,
  compact = false,
}: {
  currentWar: Dict;
  compact?: boolean;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const state = normalizeWarState(currentWar?.state);

  const target = useMemo(
    () => getTargetTimestamp(currentWar ?? {}, state),
    [
      currentWar?.state,
      currentWar?.startTime,
      currentWar?.warStartTime,
      currentWar?.prepStartTime,
      currentWar?.preparationStartTime,
      currentWar?.endTime,
      currentWar?.warEndTime,
      state,
    ],
  );

  const remaining = target !== null ? Math.max(target - now, 0) : null;
  const countdown = remaining !== null ? formatCountdown(remaining) : 'NO TIMER';

  const isPreparation = state === 'preparation';
  const isWar = state === 'inwar';

  if (!isPreparation && !isWar) {
    return (
      <section
        className={`rounded-2xl border border-white/10 bg-[#07121d]/90 ${
          compact ? 'p-4' : 'p-5 md:p-6'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-white/5 text-white/50">
            <Clock3 className="size-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-white/40">
              War Timer
            </p>
            <p className="mt-1 text-sm font-bold text-white/70">
              No active war
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1b2a] via-[#06111b] to-[#030912] ${
        compact ? 'p-4' : 'p-5 md:p-7'
      }`}
      data-testid="war-countdown"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            {isPreparation ? (
              <Clock3 className="size-6" />
            ) : (
              <Swords className="size-6" />
            )}
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-primary/70">
              ClashIQ War Timer
            </p>

            <p className="mt-1 text-lg font-black uppercase tracking-tight text-white">
              {isPreparation ? 'Preparation Day' : 'War Day'}
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-white/40">
              {isPreparation ? 'War starts in' : 'War ends in'}
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="font-mono text-3xl font-black tracking-tight text-white md:text-4xl">
            {countdown}
          </p>

          <p className="mt-1 text-[9px] font-black uppercase tracking-[.18em] text-white/35">
            Live countdown
          </p>
        </div>
      </div>
    </section>
  );
}
