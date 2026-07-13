export interface QueueStatsDto {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}
