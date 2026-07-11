import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('jobs')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  async process(job: Job): Promise<any> {
    const startTime = Date.now();
    this.logger.log(
      `[${new Date().toISOString()}] START processing job ${job.id} of type ${job.data.type}`,
    );

    const delay = this.getDelayForJobType(job.data.type);
    this.logger.log(
      `Job ${job.id} will delay for ${delay}ms before completing`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    const shouldFail = Math.random() < 0.1;

    if (shouldFail) {
      const elapsed = Date.now() - startTime;
      this.logger.error(
        `[${new Date().toISOString()}] Job ${job.id} failed randomly after ${elapsed}ms`,
      );
      throw new Error('Job failed randomly for testing');
    }

    const elapsed = Date.now() - startTime;
    this.logger.log(
      `[${new Date().toISOString()}] END processing job ${job.id} - took ${elapsed}ms (expected ${delay}ms)`,
    );
    return { success: true, processedAt: new Date() };
  }

  private getDelayForJobType(type: string): number {
    const delays: Record<string, number> = {
      'send-email': 2000,
      'process-image': 4000,
      'generate-report': 5000,
    };
    return delays[type] || 3000;
  }
}
