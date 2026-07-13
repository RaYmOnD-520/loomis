import type { QueueStats } from './types';

const API_BASE = 'http://localhost:3000';

export async function getQueueStats(): Promise<QueueStats> {
  const response = await fetch(`${API_BASE}/jobs/stats/summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch queue stats: ${response.statusText}`);
  }
  return response.json();
}

// Note: Backend does not have a "list jobs" endpoint yet
// This would be GET /jobs with optional query params like ?limit=10&status=completed
// For now, we'll use placeholder data in the component
