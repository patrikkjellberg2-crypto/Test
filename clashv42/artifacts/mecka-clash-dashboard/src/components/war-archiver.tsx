import { useEffect } from 'react';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { archiveCurrentWar, archiveWarLog } from '@/lib/war-archive';

/**
 * Invisible helper. Whenever dashboard data loads it saves the current war
 * and the official war log to this device. It shares the dashboard query
 * cache, so it does not make extra network requests.
 */
export function WarArchiver() {
  const { data } = useGetClashDashboard();

  useEffect(() => {
    const dash = data as unknown as { currentWar?: unknown; warlog?: unknown } | undefined;
    if (!dash) return;
    try {
      archiveCurrentWar(dash.currentWar);
      archiveWarLog(dash.warlog);
    } catch {
      /* never break the app because of archiving */
    }
  }, [data]);

  return null;
}
