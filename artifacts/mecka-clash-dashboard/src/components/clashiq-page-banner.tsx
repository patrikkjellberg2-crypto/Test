import { type ReactNode } from 'react';
import { useLocation } from 'wouter';

const BANNER_SRC = '/clash-iq-war-banner.webp';

export function ClashIQPageBanner({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  // Overview owns its hero. Every other page gets the same banner.
  // Members and Capital Raids render the banner directly inside their main area.
  // Keep the wrapper neutral there so it cannot create a spacer or repaint the banner.
  if (location === '/' || location === '/members' || location === '/capital-raids' || location === '/village' || location === '/war-archive') {
    return <>{children}</>;
  }

  return (
    <div className="clashiq-global-banner-page min-h-[100dvh] overflow-x-hidden bg-[#07090d] text-white">
      <style>{`
        .clashiq-global-banner-page main {
          margin-top: 0 !important;
          background-color: #07090d !important;
          background-image:
            linear-gradient(to bottom, rgba(7,9,13,0) 0, rgba(7,9,13,0) 360px, #07090d 360px),
            url(${BANNER_SRC});
          background-repeat: no-repeat;
          background-position: center 28px;
          background-size: min(1400px, calc(100% - 56px)) 360px;
          color: #fff !important;
        }

        /* The banner is painted directly into main, so it cannot become a flex item or create a gap. */
        .clashiq-global-banner-page main {
          padding-top: 384px !important;
        }

        .clashiq-global-banner-page main.lg\\:pl-\\[260px\\] {
          background-size: min(1400px, calc(100% - 56px)) 360px;
        }

        .clashiq-global-banner-page > div {
          background: #07090d !important;
          background-image: none !important;
          color: #fff !important;
        }

        @media (max-width: 1023px) {
          .clashiq-global-banner-page main {
            padding-top: 252px !important;
            background-position: center 16px;
            background-size: calc(100% - 32px) 220px;
          }
        }

        .clashiq-global-banner-page {
          --background: 222 35% 5%;
          --foreground: 0 0% 100%;
          --card: 216 30% 8%;
          --card-foreground: 0 0% 100%;
          --popover: 216 30% 8%;
          --popover-foreground: 0 0% 100%;
          --primary: 43 96% 56%;
          --primary-foreground: 222 35% 5%;
          --secondary: 215 25% 13%;
          --secondary-foreground: 0 0% 92%;
          --muted: 215 22% 14%;
          --muted-foreground: 215 14% 58%;
          --accent: 43 96% 56%;
          --accent-foreground: 222 35% 5%;
          --border: 215 20% 18%;
          --input: 215 20% 18%;
          --ring: 43 96% 56%;
          --sidebar-background: 216 31% 7%;
          --sidebar-foreground: 0 0% 95%;
          --sidebar-primary: 43 96% 56%;
          --sidebar-primary-foreground: 222 35% 5%;
          --sidebar-accent: 43 55% 15%;
          --sidebar-accent-foreground: 43 96% 72%;
          --sidebar-border: 215 20% 17%;
          --sidebar-ring: 43 96% 56%;
        }


        .clashiq-global-banner-page main [class~="bg-white"],
        .clashiq-global-banner-page main [class~="bg-slate-50"],
        .clashiq-global-banner-page main [class~="bg-gray-50"],
        .clashiq-global-banner-page main [class~="bg-zinc-50"] {
          background-color: #0b1119 !important;
        }

        .clashiq-global-banner-page main [class~="text-slate-900"],
        .clashiq-global-banner-page main [class~="text-gray-900"],
        .clashiq-global-banner-page main [class~="text-zinc-900"] {
          color: #fff !important;
        }

        .clashiq-global-banner-page main [class~="text-blue-400"],
        .clashiq-global-banner-page main [class~="text-blue-500"],
        .clashiq-global-banner-page main [class~="text-blue-600"],
        .clashiq-global-banner-page main [class~="text-indigo-400"],
        .clashiq-global-banner-page main [class~="text-indigo-500"] {
          color: #fbbf24 !important;
        }

        .clashiq-global-banner-page main [class~="border-blue-400"],
        .clashiq-global-banner-page main [class~="border-blue-500"],
        .clashiq-global-banner-page main [class~="border-indigo-400"],
        .clashiq-global-banner-page main [class~="border-indigo-500"] {
          border-color: rgba(251, 191, 36, .2) !important;
        }

        .clashiq-global-banner-page main [class~="text-red-300"],
        .clashiq-global-banner-page main [class~="text-red-400"],
        .clashiq-global-banner-page main [class~="text-red-500"],
        .clashiq-global-banner-page main [class~="text-emerald-300"],
        .clashiq-global-banner-page main [class~="text-emerald-400"],
        .clashiq-global-banner-page main [class~="text-purple-300"],
        .clashiq-global-banner-page main [class~="text-purple-400"],
        .clashiq-global-banner-page main [class~="text-blue-200"],
        .clashiq-global-banner-page main [class~="text-blue-300"] {
          color: #fbbf24 !important;
        }

        .clashiq-global-banner-page main [class~="border-red-400"],
        .clashiq-global-banner-page main [class~="border-red-300"],
        .clashiq-global-banner-page main [class~="border-emerald-400"],
        .clashiq-global-banner-page main [class~="border-purple-400"],
        .clashiq-global-banner-page main [class~="border-blue-400"] {
          border-color: rgba(251, 191, 36, .2) !important;
        }

        .clashiq-global-banner-page main [class~="bg-red-400"],
        .clashiq-global-banner-page main [class~="bg-emerald-400"],
        .clashiq-global-banner-page main [class~="bg-purple-400"],
        .clashiq-global-banner-page main [class~="bg-blue-400"] {
          background-color: rgba(245, 158, 11, .10) !important;
        }
      `}</style>

      {children}
    </div>
  );
}
