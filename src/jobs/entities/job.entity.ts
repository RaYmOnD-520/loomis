export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Job {
  id: string;
  type: string;
  payload: Record<string, any>;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}
