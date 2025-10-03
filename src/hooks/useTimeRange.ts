import { useState, useEffect } from 'react';
import { TimeRange, getDefaultTimeRange } from '@grafana/data';

export function useTimeRange() {
  const [timeRange, setTimeRange] = useState<TimeRange>(getDefaultTimeRange());

  // In a real implementation, this would sync with Grafana's global time range
  // For now, we'll just manage local state
  useEffect(() => {
    // Could listen to Grafana's time range changes here
  }, []);

  return {
    timeRange,
    setTimeRange,
  };
}
