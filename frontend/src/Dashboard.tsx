import { useEffect, useState } from 'react';
import { getQueueStats, getRecentJobs } from './api';
import type { QueueStats, Job } from './types';
import { formatRelativeTime } from './utils';

interface StatCardProps {
  label: string;
  subtitle: string;
  count: number;
  color: 'blue' | 'yellow' | 'green' | 'red';
  isLoading?: boolean;
}

function StatCard({ label, subtitle, count, color, isLoading = false }: StatCardProps) {
  const colorClasses = {
    blue: 'text-[#5e9eff]',
    yellow: 'text-[#e6b93d]',
    green: 'text-[#3ecf6e]',
    red: 'text-[#f0555a]',
  };

  if (isLoading) {
    return (
      <div className="bg-[#2d2d2b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-[rgba(255,255,255,0.05)] rounded w-20 mb-3"></div>
        <div className="h-10 bg-[rgba(255,255,255,0.05)] rounded w-16 mb-3"></div>
        <div className="h-3 bg-[rgba(255,255,255,0.05)] rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#2d2d2b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
      <div className="text-sm text-[#9a9892] mb-1">{label}</div>
      <div className={`text-4xl font-semibold mb-2 transition-all duration-300 ${colorClasses[color]}`}>
        {count.toLocaleString()}
      </div>
      <div className="text-xs text-[#9a9892]">{subtitle}</div>
    </div>
  );
}

interface JobRowProps {
  job: Job;
}

function JobRow({ job }: JobRowProps) {
  const statusColors = {
    pending: 'text-[#5e9eff] bg-[#5e9eff]/10',
    processing: 'text-[#e6b93d] bg-[#e6b93d]/10',
    completed: 'text-[#3ecf6e] bg-[#3ecf6e]/10',
    failed: 'text-[#f0555a] bg-[#f0555a]/10',
  };

  const truncatedId = job.id.substring(0, 8) + '...';

  return (
    <tr className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
      <td className="px-4 py-3 text-left">
        <code
          className="text-xs font-['JetBrains_Mono'] text-[#9a9892]"
          title={job.id}
        >
          {truncatedId}
        </code>
      </td>
      <td className="px-4 py-3 text-left text-sm align-middle">{job.type}</td>
      <td className="px-4 py-3 text-left align-middle">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium uppercase ${
            statusColors[job.status]
          }`}
        >
          {job.status}
        </span>
      </td>
      <td className="px-4 py-3 text-left text-sm text-[#9a9892] align-middle">
        {formatRelativeTime(job.createdAt)}
      </td>
      <td className="px-4 py-3 text-left text-sm text-[#9a9892] align-middle">
        {job.attemptsMade}/{job.maxAttempts}
      </td>
    </tr>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, jobsData] = await Promise.all([
          getQueueStats(),
          getRecentJobs(10),
        ]);
        setStats(statsData);
        setJobs(jobsData);
        setLastUpdated(new Date());
        setSecondsSinceUpdate(0);
        setError(null);
        setIsInitialLoad(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMessage);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    }

    // Initial fetch
    fetchData();

    // Poll every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [isInitialLoad]);

  useEffect(() => {
    if (!lastUpdated) return;

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setSecondsSinceUpdate(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[rgba(255,255,255,0.1)] border-t-[#5e9eff] rounded-full animate-spin mb-4"></div>
          <p className="text-[#9a9892]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#f0555a] mb-2">
            Connection Error
          </h2>
          <p className="text-[#9a9892]">{error}</p>
          <p className="text-sm text-[#9a9892] mt-2">
            Make sure the backend server is running at http://localhost:3000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <h1 className="text-3xl font-semibold text-[#e8e6e3]">
              Loomis Dashboard
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#9a9892]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#3ecf6e] rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              <span>·</span>
              <span>updated {secondsSinceUpdate}s ago</span>
            </div>
          </div>
          <p className="text-[#9a9892]">
            Real-time job queue monitoring for Loomis
          </p>
        </div>

        {/* Connection Error Banner */}
        {error && stats && (
          <div className="mb-6 bg-[#f0555a]/10 border border-[#f0555a]/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-[#f0555a]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Connection lost, retrying...</span>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        {stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="PENDING"
              subtitle="awaiting execution"
              count={stats.pending}
              color="blue"
            />
            <StatCard
              label="PROCESSING"
              subtitle="in progress"
              count={stats.processing}
              color="yellow"
            />
            <StatCard
              label="COMPLETED"
              subtitle="successful"
              count={stats.completed}
              color="green"
            />
            <StatCard
              label="FAILED"
              subtitle="exhausted retries"
              count={stats.failed}
              color="red"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="" subtitle="" count={0} color="blue" isLoading />
            <StatCard label="" subtitle="" count={0} color="yellow" isLoading />
            <StatCard label="" subtitle="" count={0} color="green" isLoading />
            <StatCard label="" subtitle="" count={0} color="red" isLoading />
          </div>
        )}

        {/* Jobs Table */}
        <div className="bg-[#2d2d2b] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="text-lg font-semibold text-[#e8e6e3]">Recent Jobs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[rgba(255,255,255,0.02)]">
                <tr className="border-b border-[rgba(255,255,255,0.08)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9a9892] uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9a9892] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9a9892] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9a9892] uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9a9892] uppercase tracking-wider">
                    Attempts
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#9a9892]">
                      No jobs yet
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <JobRow key={job.id} job={job} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[#9a9892]">
          <a
            href="https://github.com/yourusername/loomis"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e8e6e3] transition-colors"
          >
            Loomis on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
