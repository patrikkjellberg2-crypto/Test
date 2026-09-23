import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import NotFound from '@/pages/not-found';
import DashboardPage from '@/pages/dashboard';
import WarCenterPage from '@/pages/war-center';
import WarPlannerPage from '@/pages/war-planner';
import MembersPage from '@/pages/members';
import PlayerPage from '@/pages/player';
import CapitalRaidsPage from '@/pages/capital-raids';
import AICoachPage from '@/pages/ai-coach';
import StatisticsPage from '@/pages/statistics';
import SettingsPage from '@/pages/settings';

import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route
          path="/"
          component={DashboardPage}
        />

        <Route
          path="/war-center"
          component={WarCenterPage}
        />

        <Route
          path="/war-planner"
          component={WarPlannerPage}
        />

        <Route
          path="/members"
          component={MembersPage}
        />

        <Route
          path="/capital-raids"
          component={CapitalRaidsPage}
        />

        <Route
          path="/ai-coach"
          component={AICoachPage}
        />

        <Route
          path="/statistics"
          component={StatisticsPage}
        />

        <Route
          path="/settings"
          component={SettingsPage}
        />

        <Route
          path="/player/:tag"
          component={PlayerPage}
        />

        <Route
          component={NotFound}
        />
      </Switch>
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
          base={import.meta.env.BASE_URL.replace(
            /\/$/,
            '',
          )}
        >
          <Router />
        </WouterRouter>

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
