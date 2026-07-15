import { useEffect, useState } from 'react';
import { getQueueStats, getRecentJobs } from './api';
import type { QueueStats, Job } from './types';
import { formatRelativeTime } from './utils';

interface StatCardProps {
  label: string;
  subtitle: string;
  count: number;
  color: 'blue' | 'yellow' | 'green' | 'red';
}

function StatCard({ label, subtitle, count, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-[#5e9eff]',
    yellow: 'text-[#e6b93d]',
    green: 'text-[#3ecf6e]',
    red: 'text-[#f0555a]',
  };

  return (
    <div className="bg-[#2d2d2b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
      <div className="text-sm text-[#9a9892] mb-1">{label}</div>
      <div className={`text-4xl font-semibold mb-2 ${colorClasses[color]}`}>
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

  return (
    <tr className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.02)]">
      <td className="px-4 py-3 text-left">
        <code className="text-xs font-['JetBrains_Mono'] text-[#9a9892]">
          {job.id}
        </code>
      </td>
      <td className="px-4 py-3 text-left text-sm">{job.type}</td>
      <td className="px-4 py-3 text-left">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium uppercase ${
            statusColors[job.status]
          }`}
        >
          {job.status}
        </span>
      </td>
      <td className="px-4 py-3 text-left text-sm text-[#9a9892]">
        {formatRelativeTime(job.createdAt)}
      </td>
      <td className="px-4 py-3 text-left text-sm text-[#9a9892]">
        {job.attemptsMade}/{job.maxAttempts}
      </td>
    </tr>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch data'
        );
      }
    }

    // Initial fetch
    fetchData();

    // Poll every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!lastUpdated) return;

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setSecondsSinceUpdate(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
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

        {/* Stat Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        )}

        {/* Jobs Table */}
        <div className="bg-[#2d2d2b] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="text-lg font-semibold text-[#e8e6e3]">Recent Jobs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
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
