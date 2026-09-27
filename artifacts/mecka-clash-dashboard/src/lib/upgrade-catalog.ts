import { home } from 'clash-of-clans-data';

export type UpgradeResource = 'Gold' | 'Elixir' | 'Dark Elixir';

export type UpgradeCost = {
  cost: number;
  resource: UpgradeResource;
  seconds: number;
};

/*
 * Clash IQ uses the structured Clash of Clans data package as a local,
 * version-pinned catalog. No third-party page is scraped at runtime.
 *
 * Each level record is the cost/time required to reach that target level.
 * The package snapshot is pinned in package.json so the numbers are reproducible.
 */

type AnyEntity = {
  name?: string;
  levels?: Array<{
    level?: number;
    buildCost?: number;
    buildCostResource?: string;
    buildTime?: { days?: number; hours?: number; minutes?: number; seconds?: number };
    upgradeCost?: number;
    upgradeCostResource?: string;
    upgradeTime?: { days?: number; hours?: number; minutes?: number; seconds?: number };
  }>;
};

const collections = [
  home().defenses().get(),
  home().craftedDefenses().get(),
  home().traps().get(),
  home().troops().get(),
  home().spells().get(),
  home().siegeMachines().get(),
  home().heroes().get(),
  home().pets().get(),
  home().walls().get(),
  home().resourceBuildings().get(),
  home().armyBuildings().get(),
] as unknown as AnyEntity[][];

export const UPGRADE_COSTS: Record<string, Record<number, UpgradeCost>> = {};

for (const entity of collections.flat()) {
  if (!entity?.name || !Array.isArray(entity.levels)) continue;

  const byLevel: Record<number, UpgradeCost> = UPGRADE_COSTS[entity.name] ?? {};

  for (const level of entity.levels) {
    const targetLevel = Number(level.level);
    const cost = Number(level.buildCost ?? level.upgradeCost);
    const resource = level.buildCostResource ?? level.upgradeCostResource;
    const time = level.buildTime ?? level.upgradeTime;

    if (!Number.isFinite(targetLevel) || !Number.isFinite(cost) || !time) continue;
    if (resource !== 'Gold' && resource !== 'Elixir' && resource !== 'Dark Elixir') continue;

    const seconds =
      Number(time.days ?? 0) * 86400 +
      Number(time.hours ?? 0) * 3600 +
      Number(time.minutes ?? 0) * 60 +
      Number(time.seconds ?? 0);

    if (!Number.isFinite(seconds)) continue;

    byLevel[targetLevel] = {
      cost,
      resource,
      seconds,
    };
  }

  UPGRADE_COSTS[entity.name] = byLevel;
}

export function getUpgradeCost(name: string, targetLevel: number): UpgradeCost | undefined {
  return UPGRADE_COSTS[name]?.[targetLevel];
}
