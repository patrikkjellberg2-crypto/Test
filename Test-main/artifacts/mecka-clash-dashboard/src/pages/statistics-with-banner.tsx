import StatisticsPage from '@/pages/statistics';

export default function StatisticsWithBanner() {
  return (
    <div className="relative min-h-[100dvh] bg-[#07090d]">
      <style>{`
        .clashiq-statistics-banner-space main > div {
          padding-top: 250px !important;
        }
        @media (max-width: 1023px) {
          .clashiq-statistics-banner-space main > div {
            padding-top: 220px !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 h-[220px] overflow-hidden lg:left-[260px] lg:h-[250px]">
        <img
          src="/clash-iq-war-banner.webp"
          alt="Clash IQ"
          className="block h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#07090d]" />
      </div>

      <div className="clashiq-statistics-banner-space">
        <StatisticsPage />
      </div>
    </div>
  );
}
