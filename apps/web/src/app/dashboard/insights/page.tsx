'use client';

import { AnalyticsExplorer } from '@/components/dashboard/analytics-explorer';
import { AnalyticsAssistant } from '@/components/dashboard/analytics-assistant';

export default function InsightsPage() {
  return (
    <div className="page-container space-y-5">
      <AnalyticsExplorer />
      <AnalyticsAssistant />
    </div>
  );
}
