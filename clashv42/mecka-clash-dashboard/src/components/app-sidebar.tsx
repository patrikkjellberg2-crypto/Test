import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BrainCircuit,
  Castle,
  ChevronRight,
  Hammer,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Swords,
  Users,
  X,
  BarChart3,
  Gauge,
  Sparkles,
  Trophy,
} from "lucide-react";

type AppSidebarProps = {
  clanName?: string;
  clanTag?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
};

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard, section: "COMMAND" },
  { label: "War Center", href: "/war-center", icon: Swords, section: "COMMAND" },
  { label: "War Planner", href: "/war-planner", icon: Shield, section: "COMMAND" },
  { label: "Capital Raids", href: "/capital-raids", icon: Castle, section: "COMMAND" },
  { label: "Members", href: "/members", icon: Users, section: "COMMAND" },
  { label: "AI Coach", href: "/ai-coach", icon: BrainCircuit, section: "INTELLIGENCE" },
  { label: "Statistics", href: "/statistics", icon: BarChart3, section: "INTELLIGENCE" },
  { label: "War Archive", href: "/war-archive", icon: Trophy, section: "INTELLIGENCE" },
  { label: "Clan Intelligence", href: "/clan-intelligence", icon: Gauge, section: "INTELLIGENCE" },
  { label: "Village", href: "/village", icon: Hammer, section: "INTELLIGENCE" },
  { label: "Settings", href: "/settings", icon: Settings, section: "INTELLIGENCE" },
];

function ClanMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={[
        "relative grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-amber-400/25 bg-[#05080d] shadow-[0_0_28px_rgba(244,197,66,.10)]",
        small ? "h-14 w-20" : "h-16 w-24",
      ].join(" ")}
    >
      <img
        src="/clash-iq-logo.webp"
        alt="CLASHIQ"
        className={[
          "relative z-10 object-contain",
          small ? "h-12 w-[4.5rem]" : "h-14 w-22",
        ].join(" ")}
      />
    </div>
  );
}

function NavItem({
  label,
  href,
  icon: Icon,
  active,
  onNavigate,
}: {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200",
        active
          ? "border border-amber-400/20 bg-gradient-to-r from-amber-400/15 to-blue-500/10 text-white shadow-lg shadow-black/10"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
      ].join(" ")}
    >
      <div
        className={[
          "grid size-8 shrink-0 place-items-center rounded-lg transition-all",
          active
            ? "bg-amber-400/15 text-amber-300"
            : "bg-white/[0.03] text-slate-500 group-hover:text-slate-300",
        ].join(" ")}
      >
        <Icon className="size-4" />
      </div>
      <span className="flex-1 font-semibold">{label}</span>
      {active ? (
        <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      ) : (
        <ChevronRight className="size-3.5 text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
      )}
    </Link>
  );
}

function SidebarContent({
  clanName,
  clanTag,
  activePath,
  onNavigate,
}: {
  clanName: string;
  clanTag: string;
  activePath: string;
  onNavigate?: () => void;
}) {
  const command = navigation.filter((i) => i.section === "COMMAND");
  const intelligence = navigation.filter((i) => i.section === "INTELLIGENCE");
  const active = (href: string) =>
    href === "/" ? activePath === "/" : activePath.startsWith(href);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <ClanMark />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-black tracking-[-0.04em] text-white">
              CLASHIQ
            </p>
            <span className="mt-1 inline-block rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-amber-300">
              Elite Mode
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
          <p className="truncate text-sm font-bold text-white">{clanName}</p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-500">{clanTag}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.8)]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-400">
              Command Center Online
            </span>
          </div>
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-4 py-6"
        aria-label="CLASHIQ navigation"
      >
        <p className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.22em] text-slate-600">
          Command
        </p>
        <div className="space-y-1">
          {command.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={active(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-600">
              Intelligence
            </p>
            <Sparkles className="size-3 text-amber-400/60" />
          </div>
          <div className="space-y-1">
            {intelligence.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={active(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="px-4 pb-4">
        <Link
          href="/ai-coach"
          onClick={onNavigate}
          aria-label="Open AI Coach"
          data-testid="sidebar-ai-coach"
          className="group block w-full cursor-pointer rounded-2xl border border-blue-400/10 bg-gradient-to-br from-blue-500/[0.08] to-amber-500/[0.04] p-3.5 text-left transition-all hover:border-blue-400/25 hover:bg-blue-500/[0.12] active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-blue-400/10 text-blue-400 group-hover:bg-blue-400/20">
              <BrainCircuit className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white">
                AI Coach
              </p>
              <p className="truncate text-[9px] text-slate-500">
                Tactical intelligence active
              </p>
            </div>
            <span className="ml-auto size-1.5 shrink-0 rounded-full bg-blue-400 shadow-[0_0_7px_rgba(96,165,250,0.8)]" />
          </div>
        </Link>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-4">
        <p className="truncate text-[8px] font-black uppercase tracking-[0.2em] text-slate-700">
          CLASHIQ ELITE WAR COMMAND
        </p>
        <p className="mt-1 text-[9px] text-slate-600">Built for war leadership.</p>
      </div>
    </div>
  );
}

export function AppSidebar({
  clanName = "BHABE DHEMONS",
  clanTag = "#2Q0Q82C9R",
  mobileOpen,
  onClose,
}: AppSidebarProps) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const [location] = useLocation();
  const controlled = typeof mobileOpen === "boolean";
  const isMobileOpen = controlled ? mobileOpen : internalMobileOpen;

  const closeMobile = () => {
    onClose?.();
    setInternalMobileOpen(false);
  };

  return (
    <>
      <aside className="hidden h-[100dvh] w-[260px] shrink-0 border-r border-white/[0.06] bg-[#07090d] lg:flex">
        <SidebarContent
          clanName={clanName}
          clanTag={clanTag}
          activePath={location}
        />
      </aside>

      {!controlled && (
        <button
          type="button"
          onClick={() => setInternalMobileOpen(true)}
          aria-label="Open navigation"
          className="fixed left-4 top-4 z-40 grid size-11 place-items-center rounded-xl border border-white/10 bg-[#07090d]/95 text-slate-300 shadow-xl backdrop-blur lg:hidden"
        >
          <Menu className="size-5" />
        </button>
      )}

      {isMobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobile}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside className="relative z-[101] h-[100dvh] w-[285px] border-r border-white/[0.08] bg-[#07090d] shadow-2xl">
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-xl bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
            >
              <X className="size-4" />
            </button>
            <SidebarContent
              clanName={clanName}
              clanTag={clanTag}
              activePath={location}
              onNavigate={closeMobile}
            />
          </aside>
        </div>
      )}
    </>
  );
}

export default AppSidebar;
