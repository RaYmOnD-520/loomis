import type { QueueStats, Job } from './types';

const API_BASE = 'http://localhost:3000';

export async function getQueueStats(): Promise<QueueStats> {
  const response = await fetch(`${API_BASE}/jobs/stats/summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch queue stats: ${response.statusText}`);
  }
  return response.json();
}

export async function getRecentJobs(limit: number = 10): Promise<Job[]> {
  const response = await fetch(`${API_BASE}/jobs?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recent jobs: ${response.statusText}`);
  }
  return response.json();
}
