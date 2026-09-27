import { type ReactNode } from "react";
import { Link } from "wouter";
import { Activity, ArrowLeft, RefreshCw } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { ClashIQInlineBanner } from "@/components/clashiq-inline-banner";

type ClashIQPageShellProps = {
  clanName?: string;
  clanTag?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onRefresh?: () => void;
};

export function ClashIQPageShell({
  clanName = "BHABE DHEMONS",
  clanTag = "#2Q0Q82C9R",
  title,
  subtitle,
  children,
  onRefresh,
}: ClashIQPageShellProps) {
  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-screen bg-[#07090d]">
        <AppSidebar clanName={clanName} clanTag={clanTag} />

        <main className="min-w-0 flex-1">
          <ClashIQInlineBanner />

          <header className="border-b border-white/5 bg-[#07090d]/85 px-5 py-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 transition hover:text-amber-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Command Center
                </Link>

                <div className="mt-2 flex items-center gap-2">
                  <h1 className="truncate text-2xl font-black tracking-tight">
                    {title}
                  </h1>

                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                    Elite
                  </span>
                </div>

                {subtitle ? (
                  <p className="mt-1 max-w-3xl text-sm text-slate-500">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-2 sm:flex">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">
                    Command online
                  </span>
                </div>

                {onRefresh ? (
                  <button
                    type="button"
                    onClick={onRefresh}
                    aria-label="Refresh"
                    className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:border-amber-400/25 hover:bg-white/[0.06] hover:text-white"
                  >
                    <RefreshCw className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
