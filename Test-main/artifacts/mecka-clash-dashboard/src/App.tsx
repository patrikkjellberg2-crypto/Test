import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ClashIQPageBanner } from '@/components/clashiq-page-banner';

import NotFound from '@/pages/not-found';
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const WarCenterPage = lazy(() => import('@/pages/war-center'));
const WarPlannerPage = lazy(() => import('@/pages/war-planner'));
const MembersPage = lazy(() => import('@/pages/members'));
const PlayerPage = lazy(() => import('@/pages/player'));
const CapitalRaidsPage = lazy(() => import('@/pages/capital-raids'));
const AICoachPage = lazy(() => import('@/pages/ai-coach'));
const StatisticsPage = lazy(() => import('@/pages/statistics'));
const SettingsPage = lazy(() => import('@/pages/settings'));

import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="grid min-h-[60dvh] place-items-center text-sm text-white/60">
      Loading…
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <ClashIQPageBanner>
        <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/war-center" component={WarCenterPage} />
          <Route path="/war-planner" component={WarPlannerPage} />
          <Route path="/members" component={MembersPage} />
          <Route path="/capital-raids" component={CapitalRaidsPage} />
          <Route path="/ai-coach" component={AICoachPage} />
          <Route path="/statistics" component={StatisticsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/player/:tag" component={PlayerPage} />
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </ClashIQPageBanner>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [location] = useLocation();

  return (
    <ErrorBoundary resetKey={location}>
      {children}
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter
          base={import.meta.env.BASE_URL.replace(/\/$/, '')}
        >
          <Router />
        </WouterRouter>

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
