export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: string;
  payload: Record<string, any>;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  attemptsMade?: number;
  maxAttempts?: number;
}
