import { useState } from 'react';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { AppSidebar } from '@/components/app-sidebar';
import {
  ArrowRight,
  BrainCircuit,
  Crown,
  Menu,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
} from 'lucide-react';

type Dict = Record<string, unknown>;

const d = (value: unknown): Dict =>
  value && typeof value === 'object' ? (value as Dict) : {};

const s = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

type Mode = 'clan' | 'opponent' | 'player' | 'question';

export default function AICoachPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetClashDashboard();

  const dashboard = data as any;
  const clan = d(dashboard?.clan);
  const war = d(dashboard?.currentWar);
  const opponent = d(war.opponent);
  const clanTag = s(dashboard?.clanTag, '');

  const roster = Array.isArray(dashboard?.members) ? dashboard.members : [];

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [mode, setMode] =
    useState<Mode>('clan');

  const [playerTag, setPlayerTag] =
    useState('');

  const [question, setQuestion] =
    useState(
      'Give me the three most important things we should do next.',
    );

  const [answer, setAnswer] =
    useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const analyze = async (
    selectedMode: Mode = mode,
  ) => {
    if (!clanTag || loading) return;
    if (selectedMode === 'player' && !playerTag) {
      setError('Choose a clan member to analyze first.');
      return;
    }

    setMode(selectedMode);
    setLoading(true);
    setAnswer('');
    setError('');

    const prompt =
      question.trim() ||
      (selectedMode === 'clan'
        ? 'Analyze our clan strengths, weaknesses and priorities.'
        : selectedMode === 'opponent'
          ? 'Analyze our current war opponent and give target priorities.'
          : selectedMode === 'player'
            ? 'Analyze this player\'s recent war performance and give concrete next steps.'
            : 'Give me a useful answer based on the available ClashIQ data.');

    try {
      const response = await fetch(
        '/api/ai/coach',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            clanTag,
            mode: selectedMode,
            question: prompt,
            ...(selectedMode === 'player' ? { playerTag } : {}),
          }),
        },
      );

      const raw =
        await response.text();

      let result: {
        answer?: string;
        error?: string;
      } = {};

      try {
        result = JSON.parse(raw);
      } catch {
        throw new Error(
          `AI service returned an invalid response (${response.status}).`,
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            `AI Coach request failed (${response.status}).`,
        );
      }

      setAnswer(
        result.answer ||
          'No analysis was returned.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI Coach could not complete the analysis.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#02070d] p-6 text-white">
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="h-14 animate-pulse rounded-2xl bg-white/[.05]" />

          <div className="h-72 animate-pulse rounded-3xl bg-white/[.05]" />
        </div>
      </div>
    );
  }

  if (
    isError ||
    !dashboard?.apiConfigured
  ) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#02070d] p-6 text-white">
        <div className="max-w-md rounded-3xl border border-white/[.08] bg-[#06111b] p-8 text-center">
          <Shield className="mx-auto size-8 text-[#f4c542]" />

          <h1 className="mt-4 font-display text-2xl font-black">
            AI Command Center Offline
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Clash data is not available right now.
          </p>

          <button
            type="button"
            onClick={() =>
              void refetch()
            }
            className="mt-5 rounded-xl bg-[#f4c542] px-5 py-2.5 text-sm font-black text-[#07111a]"
          >
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  const clanName = s(
    clan.name,
    'ClashIQ Clan',
  );

  const opponentName = s(
    opponent.name,
    'Current Opponent',
  );

  return (
    <div className="min-h-[100dvh] bg-[#02070d] text-white">
      <div className="flex min-h-[100dvh]">
        <AppSidebar
          clanName={clanName}
          clanTag={clanTag}
          mobileOpen={mobileOpen}
          onClose={() =>
            setMobileOpen(false)
          }
        />

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/[.06] bg-[#030a12]/90 px-4 py-4 backdrop-blur-xl md:px-8">
            <div className="mx-auto flex max-w-[1400px] items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileOpen(true)
                }
                className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[.04] lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-4" />
              </button>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[.22em] text-[#f4c542]">
                  Elite Mode / Intelligence
                </p>

                <h1 className="mt-1 font-display text-xl font-black tracking-[-.04em] md:text-2xl">
                  AI Coach
                </h1>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <span className="hidden items-center gap-2 text-[8px] font-black uppercase tracking-[.18em] text-[#36d399] sm:flex">
                  <span className="size-1.5 rounded-full bg-[#36d399] shadow-[0_0_8px_rgba(54,211,153,.8)]" />

                  Live Intelligence
                </span>

                <button
                  type="button"
                  onClick={() =>
                    void refetch()
                  }
                  className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[.04]"
                  aria-label="Refresh clan data"
                >
                  <RefreshCw
                    className={
                      isFetching
                        ? 'size-4 animate-spin'
                        : 'size-4'
                    }
                  />
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] space-y-5 p-4 md:p-8">
            <section className="relative overflow-hidden rounded-3xl border border-[#f4c542]/20 bg-[#030a12] p-6 shadow-[0_20px_80px_rgba(0,0,0,.35)] md:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(244,197,66,.14),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(45,140,255,.10),transparent_35%)]" />

              <div className="pointer-events-none absolute inset-0 opacity-[.035] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:32px_32px]" />

              <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="grid size-14 place-items-center rounded-2xl border border-[#f4c542]/30 bg-[#f4c542]/10">
                      <BrainCircuit className="size-7 text-[#f4c542]" />
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#5da9ff]">
                        CLASHIQ INTELLIGENCE
                      </p>

                      <h2 className="mt-1 font-display text-3xl font-black tracking-[-.06em] md:text-5xl">
                        Command Your War.
                      </h2>
                    </div>
                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">
                    Turn live Clash data into tactical
                    decisions. Analyze your clan, study
                    the enemy and get clear priorities
                    for the next move.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[.07] bg-white/[.03] p-3">
                    <Users className="size-4 text-[#5da9ff]" />

                    <p className="mt-2 text-[8px] font-black uppercase tracking-[.14em] text-white/40">
                      Clan
                    </p>

                    <p className="mt-1 max-w-[110px] truncate text-xs font-bold">
                      {clanName}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[.07] bg-white/[.03] p-3">
                    <Swords className="size-4 text-red-300" />

                    <p className="mt-2 text-[8px] font-black uppercase tracking-[.14em] text-white/40">
                      Enemy
                    </p>

                    <p className="mt-1 max-w-[110px] truncate text-xs font-bold">
                      {opponentName}
                    </p>
                  </div>

                  <div className="hidden rounded-xl border border-white/[.07] bg-white/[.03] p-3 sm:block">
                    <Trophy className="size-4 text-[#f4c542]" />

                    <p className="mt-2 text-[8px] font-black uppercase tracking-[.14em] text-white/40">
                      War
                    </p>

                    <p className="mt-1 text-xs font-bold">
                      {s(
                        war.state,
                        'No active war',
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
              <article className="rounded-2xl border border-white/[.07] bg-[#06111b]/90 p-5 shadow-[0_12px_45px_rgba(0,0,0,.2)]">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-[#f4c542]" />

                  <h3 className="text-sm font-black uppercase tracking-[.1em]">
                    Analysis Mode
                  </h3>
                </div>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('clan')}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      mode === 'clan'
                        ? 'border-[#2d8cff]/30 bg-[#2d8cff]/10'
                        : 'border-white/[.07] bg-white/[.02] hover:bg-white/[.04]'
                    }`}
                  >
                    <BrainCircuit className="size-5 text-[#5da9ff]" />
                    <span className="flex-1">
                      <span className="block text-sm font-bold">My clan</span>
                      <span className="mt-1 block text-[10px] text-white/40">Strengths, weaknesses and priorities</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('opponent')}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      mode === 'opponent'
                        ? 'border-red-400/30 bg-red-400/10'
                        : 'border-white/[.07] bg-white/[.02] hover:bg-white/[.04]'
                    }`}
                  >
                    <Swords className="size-5 text-red-300" />
                    <span className="flex-1">
                      <span className="block text-sm font-bold">The opponent</span>
                      <span className="mt-1 block text-[10px] text-white/40">Threats, attacks and targets</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('player')}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      mode === 'player'
                        ? 'border-emerald-400/30 bg-emerald-400/10'
                        : 'border-white/[.07] bg-white/[.02] hover:bg-white/[.04]'
                    }`}
                  >
                    <Crown className="size-5 text-emerald-300" />
                    <span className="flex-1">
                      <span className="block text-sm font-bold">Player Coach</span>
                      <span className="mt-1 block text-[10px] text-white/40">Analyze one member's war performance</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('question')}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      mode === 'question'
                        ? 'border-[#f4c542]/30 bg-[#f4c542]/10'
                        : 'border-white/[.07] bg-white/[.02] hover:bg-white/[.04]'
                    }`}
                  >
                    <Sparkles className="size-5 text-[#f4c542]" />
                    <span className="flex-1">
                      <span className="block text-sm font-bold">Ask a question</span>
                      <span className="mt-1 block text-[10px] text-white/40">Ask AI Coach anything</span>
                    </span>
                  </button>
                </div>
                {mode === 'player' && (
                  <div className="mt-4">
                    <label className="block text-[9px] font-black uppercase tracking-[.16em] text-white/40">
                      Choose a member
                    </label>
                    <select
                      value={playerTag}
                      onChange={event => setPlayerTag(event.target.value)}
                      className="mt-2 h-12 w-full rounded-xl border border-white/[.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-emerald-300/40"
                    >
                      <option value="">Select a clan member...</option>
                      {roster.map((member: Dict) => (
                        <option key={s(member.tag)} value={s(member.tag)}>
                          {s(member.name, 'Unknown')} (TH{String(member.townHallLevel ?? member.townhallLevel ?? '?')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="mt-5 block text-[9px] font-black uppercase tracking-[.16em] text-white/40">
                  Mission Brief
                </label>

                <textarea
                  value={question}
                  onChange={event =>
                    setQuestion(
                      event.target.value,
                    )
                  }
                  rows={5}
                  className="mt-2 w-full resize-none rounded-xl border border-white/[.08] bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#f4c542]/30"
                  placeholder={mode === 'question' ? 'Type your question here...' : mode === 'opponent' ? 'What do you want to know about the opponent?' : mode === 'player' ? 'What do you want to know about this player?' : 'What do you want to know about your clan?'}
                />

                <button
                  type="button"
                  onClick={() =>
                    void analyze()
                  }
                  disabled={loading || (mode === 'player' && !playerTag)}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f4c542] text-sm font-black text-[#07111a] transition hover:brightness-110 disabled:opacity-50"
                >
                  <Sparkles
                    className={
                      loading
                        ? 'size-4 animate-pulse'
                        : 'size-4'
                    }
                  />

                  {loading
                    ? 'Analyzing...'
                    : mode === 'question'
                      ? 'Ask AI Coach'
                      : mode === 'opponent'
                        ? 'Analyze Opponent'
                        : mode === 'player'
                          ? 'Analyze Player'
                          : 'Analyze Clan'}

                  {!loading && (
                    <ArrowRight className="size-4" />
                  )}
                </button>

              </article>

              <article className="min-h-[520px] overflow-hidden rounded-2xl border border-white/[.07] bg-[#06111b]/90 shadow-[0_12px_45px_rgba(0,0,0,.2)]">
                <div className="flex items-center gap-3 border-b border-white/[.06] bg-gradient-to-r from-[#f4c542]/[.07] to-[#2d8cff]/[.05] px-5 py-4">
                  <div className="grid size-10 place-items-center rounded-xl border border-[#f4c542]/20 bg-[#f4c542]/10">
                    <BrainCircuit className="size-5 text-[#f4c542]" />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f4c542]">
                      AI WAR INTELLIGENCE
                    </p>

                    <h3 className="mt-1 text-sm font-bold">
                      {mode === 'opponent'
                        ? 'Enemy Assessment'
                        : mode === 'question'
                          ? 'AI Coach Answer'
                          : mode === 'player'
                            ? 'Player Assessment'
                            : 'Command Briefing'}
                    </h3>
                  </div>

                  <span className="ml-auto rounded-full border border-[#36d399]/20 bg-[#36d399]/[.06] px-2 py-1 text-[7px] font-black uppercase tracking-[.14em] text-[#36d399]">
                    Live
                  </span>
                </div>

                <div className="p-5">
                  {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/[.08] p-4 text-sm leading-6 text-red-200">
                      {error}
                    </div>
                  )}

                  {!answer &&
                    !error &&
                    !loading && (
                      <div className="grid min-h-[390px] place-items-center text-center">
                        <div className="max-w-md">
                          <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-[#f4c542]/20 bg-[#f4c542]/[.06]">
                            <BrainCircuit className="size-7 text-[#f4c542]" />
                          </div>

                          <h4 className="mt-5 font-display text-2xl font-black">
                            Awaiting Command
                          </h4>

                          <p className="mt-2 text-sm leading-6 text-white/40">
                            Choose a mode, write your mission brief,
                            and let ClashIQ turn live clan data
                            into a tactical answer.
                          </p>
                        </div>
                      </div>
                    )}

                  {loading && (
                    <div className="space-y-3">
                      {[
                        1,
                        2,
                        3,
                        4,
                        5,
                        6,
                      ].map(item => (
                        <div
                          key={item}
                          className="h-4 animate-pulse rounded bg-white/[.05]"
                          style={{
                            width: `${90 - item * 7}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {answer && (
                    <div className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                      {answer}
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <Link
                href="/war-planner"
                className="group rounded-2xl border border-white/[.07] bg-[#06111b]/80 p-5 transition hover:border-[#f4c542]/20"
              >
                <Swords className="size-5 text-[#f4c542]" />

                <p className="mt-3 text-sm font-bold">
                  Open War Planner
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Turn intelligence into assignments.
                </p>

                <ArrowRight className="mt-4 size-4 text-white/30 transition group-hover:translate-x-1" />
              </Link>

              <Link
                href="/war-center"
                className="group rounded-2xl border border-white/[.07] bg-[#06111b]/80 p-5 transition hover:border-[#2d8cff]/20"
              >
                <Target className="size-5 text-[#5da9ff]" />

                <p className="mt-3 text-sm font-bold">
                  Open War Center
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Review attacks and remaining targets.
                </p>

                <ArrowRight className="mt-4 size-4 text-white/30 transition group-hover:translate-x-1" />
              </Link>

              <Link
                href="/"
                className="group rounded-2xl border border-white/[.07] bg-[#06111b]/80 p-5 transition hover:border-white/15"
              >
                <Shield className="size-5 text-white/60" />

                <p className="mt-3 text-sm font-bold">
                  Back to Overview
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Return to the clan command center.
                </p>

                <ArrowRight className="mt-4 size-4 text-white/30 transition group-hover:translate-x-1" />
              </Link>
            </section>

            <footer className="border-t border-white/[.06] pt-5 text-[10px] text-white/35">
              CLASHIQ · Elite War Intelligence
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
