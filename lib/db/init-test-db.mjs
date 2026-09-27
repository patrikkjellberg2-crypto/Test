import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before initializing the test database.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  query_timeout: 15000,
  idle_in_transaction_session_timeout: 15000,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS capital_raid_archive (
    id text PRIMARY KEY,
    clan_tag text NOT NULL,
    clan_name text,
    league_name text,
    start_time text,
    end_time text NOT NULL,
    state text,
    capital_total_loot integer NOT NULL DEFAULT 0,
    raids_completed integer NOT NULL DEFAULT 0,
    offensive_reward integer NOT NULL DEFAULT 0,
    defensive_reward integer NOT NULL DEFAULT 0,
    members jsonb NOT NULL DEFAULT '[]'::jsonb,
    raw jsonb NOT NULL DEFAULT '{}'::jsonb,
    first_captured_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT capital_raid_archive_clan_season_unique UNIQUE (clan_tag, end_time)
  )`,
  `CREATE INDEX IF NOT EXISTS capital_raid_archive_clan_time_idx ON capital_raid_archive (clan_tag, end_time)`,
  `CREATE TABLE IF NOT EXISTS clan_selection (
    id integer PRIMARY KEY DEFAULT 1,
    clan_tag text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS war_archive (
    id text PRIMARY KEY,
    clan_tag text NOT NULL,
    clan_name text,
    opponent_tag text NOT NULL,
    opponent_name text,
    state text NOT NULL,
    result text,
    team_size integer NOT NULL DEFAULT 0,
    attacks_per_member integer NOT NULL DEFAULT 2,
    start_time text,
    end_time text NOT NULL,
    clan_stars integer NOT NULL DEFAULT 0,
    clan_destruction real NOT NULL DEFAULT 0,
    clan_attacks_used integer NOT NULL DEFAULT 0,
    opponent_stars integer NOT NULL DEFAULT 0,
    opponent_destruction real NOT NULL DEFAULT 0,
    opponent_members jsonb NOT NULL DEFAULT '[]'::jsonb,
    members jsonb NOT NULL DEFAULT '[]'::jsonb,
    source text NOT NULL DEFAULT 'live',
    first_captured_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS war_archive_clan_idx ON war_archive (clan_tag, end_time)`,
  `CREATE TABLE IF NOT EXISTS player_war_stats (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clan_tag text NOT NULL,
    player_tag text NOT NULL,
    player_name text NOT NULL,
    wars_counted integer NOT NULL DEFAULT 0,
    attacks_possible integer NOT NULL DEFAULT 0,
    attacks_used integer NOT NULL DEFAULT 0,
    stars_total integer NOT NULL DEFAULT 0,
    three_stars integer NOT NULL DEFAULT 0,
    destruction_total real NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT player_war_stats_clan_player_unique UNIQUE (clan_tag, player_tag)
  )`,
  `CREATE TABLE IF NOT EXISTS ai_usage (
    day text NOT NULL,
    scope text NOT NULL,
    count integer NOT NULL DEFAULT 0,
    CONSTRAINT ai_usage_day_scope_unique UNIQUE (day, scope)
  )`,
  `CREATE TABLE IF NOT EXISTS player_war_history (
    id serial PRIMARY KEY,
    war_key text NOT NULL,
    attacker_tag text NOT NULL,
    attacker_name text NOT NULL,
    opponent_name text,
    result text,
    war_end_time text,
    townhall_level integer,
    attacks jsonb NOT NULL DEFAULT '[]'::jsonb,
    captured_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT player_war_history_war_player_unique UNIQUE (war_key, attacker_tag)
  )`,
];

try {
  console.log("[Clash IQ] Initializing TEST database schema...");
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log("[Clash IQ] TEST database schema is ready.");
} catch (error) {
  console.error("[Clash IQ] TEST database initialization failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
