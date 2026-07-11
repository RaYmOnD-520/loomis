import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('jobs')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.data.type}`);

    const delay = this.getDelayForJobType(job.data.type);

    await new Promise((resolve) => setTimeout(resolve, delay));

    const shouldFail = Math.random() < 0.1;

    if (shouldFail) {
      this.logger.error(`Job ${job.id} failed randomly`);
      throw new Error('Job failed randomly for testing');
    }

    this.logger.log(`Job ${job.id} completed successfully`);
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
