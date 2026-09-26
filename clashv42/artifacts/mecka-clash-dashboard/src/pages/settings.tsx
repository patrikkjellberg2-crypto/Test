import { useState } from 'react';
import { Link } from 'wouter';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Activity,
  ArrowLeft,
  Bell,
  Bot,
  Check,
  ChevronRight,
  Crosshair,
  Database,
  Globe,
  Lock,
  Palette,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Swords,
  Wifi,
  Zap,
} from 'lucide-react';

function Toggle({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        enabled ? 'bg-amber-400' : 'bg-white/10'
      }`}
      aria-label={enabled ? 'Disable setting' : 'Enable setting'}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
          enabled ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Bot;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-white/5 py-5 last:border-b-0">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: typeof Bot;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5">
        <Icon className="h-5 w-5 text-amber-300" />
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
          {eyebrow}
        </p>
        <h2 className="text-lg font-black text-white">{title}</h2>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [warAlerts, setWarAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(false);

  const [saved, setSaved] = useState(false);

  function saveSettings() {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <div className="flex min-h-screen bg-[#07090d] text-white">
      <AppSidebar />
      <main className="min-w-0 flex-1 !ml-0 !pl-0" style={{ width: "calc(100% - 260px)", maxWidth: "calc(100% - 260px)" }}>
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
          {/* Top bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-[0.16em]">
                    CLASHIQ
                  </span>

                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                    Elite
                  </span>
                </div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                  System configuration
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={saveSettings}
              className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-amber-200 transition hover:bg-amber-400/20"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </button>
          </div>

          {/* Hero */}
          <section className="relative mb-6 overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-br from-[#17130b] via-[#0e1117] to-[#090b10] p-6 shadow-2xl sm:p-8">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-2">
                    <SettingsIcon className="h-5 w-5 text-amber-300" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
                    Command settings
                  </span>
                </div>

                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                  SYSTEM
                  <span className="block text-amber-300">CONFIGURATION</span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                  Configure the CLASHIQ command center, AI intelligence,
                  notifications and war-analysis preferences.
                </p>
              </div>

              <div className="flex items-center justify-center lg:justify-end">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-amber-400/20 bg-black/20">
                  <div className="absolute inset-3 rounded-full border border-amber-400/10" />
                  <div className="absolute inset-7 rounded-full border border-white/5" />

                  <SettingsIcon className="h-12 w-12 text-amber-300/80" />
                </div>
              </div>
            </div>
          </section>

          {/* Status strip */}
          <section className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
              <Wifi className="h-5 w-5 text-emerald-400" />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  API connection
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-400">
                  Operational
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-blue-400/15 bg-blue-400/[0.04] p-4">
              <Database className="h-5 w-5 text-blue-400" />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  War database
                </p>
                <p className="mt-1 text-sm font-bold text-blue-300">
                  Connected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
              <Activity className="h-5 w-5 text-amber-300" />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Intelligence
                </p>
                <p className="mt-1 text-sm font-bold text-amber-300">
                  Online
                </p>
              </div>
            </div>
          </section>

          {/* Settings grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* General */}
            <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
              <SectionHeader
                icon={Globe}
                eyebrow="01 • General"
                title="Command center"
              />

              <SettingRow
                icon={RefreshCw}
                title="Automatic refresh"
                description="Keep war and clan information synchronized automatically."
              >
                <Toggle
                  enabled={autoRefresh}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                />
              </SettingRow>

              <SettingRow
                icon={Palette}
                title="Compact interface"
                description="Reduce spacing and show more tactical information on screen."
              >
                <Toggle
                  enabled={compactMode}
                  onClick={() => setCompactMode(!compactMode)}
                />
              </SettingRow>

              <SettingRow
                icon={Zap}
                title="Sound effects"
                description="Enable interface feedback and tactical notification sounds."
              >
                <Toggle
                  enabled={soundEffects}
                  onClick={() => setSoundEffects(!soundEffects)}
                />
              </SettingRow>
            </section>

            {/* AI */}
            <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
              <SectionHeader
                icon={Bot}
                eyebrow="02 • Intelligence"
                title="AI Coach"
              />

              <SettingRow
                icon={Sparkles}
                title="AI intelligence"
                description="Allow CLASHIQ to generate tactical war analysis and recommendations."
              >
                <Toggle
                  enabled={aiEnabled}
                  onClick={() => setAiEnabled(!aiEnabled)}
                />
              </SettingRow>

              <div className="mt-4 rounded-xl border border-blue-400/15 bg-blue-400/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <Bot className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                      AI analysis mode
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      CLASHIQ AI can evaluate both your clan and the opponent,
                      identify threats and suggest attack priorities.
                    </p>

                    <Link href="/ai-coach">
                      <button
                        type="button"
                        className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-300 hover:text-blue-200"
                      >
                        Open AI Coach
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* War intelligence */}
            <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
              <SectionHeader
                icon={Swords}
                eyebrow="03 • War operations"
                title="War intelligence"
              />

              <SettingRow
                icon={Bell}
                title="War alerts"
                description="Receive important updates about active wars and attack activity."
              >
                <Toggle
                  enabled={warAlerts}
                  onClick={() => setWarAlerts(!warAlerts)}
                />
              </SettingRow>

              <SettingRow
                icon={Crosshair}
                title="Tactical recommendations"
                description="Display attack priorities and strategic recommendations in war tools."
              >
                <Toggle enabled={true} onClick={() => {}} />
              </SettingRow>

              <SettingRow
                icon={Shield}
                title="Defensive intelligence"
                description="Include defensive weaknesses and hold-rate analysis in reports."
              >
                <Toggle enabled={true} onClick={() => {}} />
              </SettingRow>

              <Link href="/war-planner">
                <button
                  type="button"
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-3 text-left transition hover:bg-white/[0.05]"
                >
                  <span className="text-xs font-bold text-slate-300">
                    Open War Planner
                  </span>

                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </Link>
            </section>

            {/* Notifications */}
            <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
              <SectionHeader
                icon={Bell}
                eyebrow="04 • Communications"
                title="Notifications"
              />

              <SettingRow
                icon={Bell}
                title="Notifications"
                description="Enable CLASHIQ system and command-center notifications."
              >
                <Toggle
                  enabled={notifications}
                  onClick={() => setNotifications(!notifications)}
                />
              </SettingRow>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-3">
                  <span className="text-xs text-slate-400">
                    War starts
                  </span>
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-3">
                  <span className="text-xs text-slate-400">
                    Attack activity
                  </span>
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-3">
                  <span className="text-xs text-slate-400">
                    AI analysis complete
                  </span>
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            </section>
          </div>

          {/* Security / system */}
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
            <SectionHeader
              icon={Lock}
              eyebrow="05 • System"
              title="Security & connection"
            />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">
                    Secure connection
                  </span>
                </div>

                <p className="mt-2 text-[10px] uppercase tracking-wider text-emerald-400">
                  Protected
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-300">
                    Data storage
                  </span>
                </div>

                <p className="mt-2 text-[10px] uppercase tracking-wider text-blue-400">
                  Connected
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-300" />
                  <span className="text-xs font-bold text-slate-300">
                    System status
                  </span>
                </div>

                <p className="mt-2 text-[10px] uppercase tracking-wider text-amber-300">
                  Elite mode
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pb-8 pt-6 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-700">
              CLASHIQ • Elite War Command Center
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
