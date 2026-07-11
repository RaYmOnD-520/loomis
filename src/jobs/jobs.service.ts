import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobStatus } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  private jobMetadata: Map<string, Job> = new Map();

  constructor(@InjectQueue('jobs') private jobsQueue: Queue) {}

  async createJob(createJobDto: CreateJobDto): Promise<Job> {
    const now = new Date();
    const jobId = uuidv4();

    const job: Job = {
      id: jobId,
      type: createJobDto.type,
      payload: createJobDto.payload,
      status: JobStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    this.jobMetadata.set(jobId, job);

    await this.jobsQueue.add(
      createJobDto.type,
      {
        id: jobId,
        type: createJobDto.type,
        payload: createJobDto.payload,
      },
      {
        jobId: jobId,
      },
    );

    return job;
  }

  async getJobById(id: string): Promise<Job> {
    const metadata = this.jobMetadata.get(id);
    if (!metadata) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    const bullJob = await this.jobsQueue.getJob(id);
    if (!bullJob) {
      throw new NotFoundException(`Job with ID ${id} not found in queue`);
    }

    const state = await bullJob.getState();
    const status = this.mapBullStateToJobStatus(state);

    const updatedAt = new Date(
      bullJob.finishedOn || bullJob.processedOn || bullJob.timestamp,
    );

    return {
      ...metadata,
      status,
      updatedAt,
    };
  }

  private mapBullStateToJobStatus(state: string): JobStatus {
    const stateMap: Record<string, JobStatus> = {
      waiting: JobStatus.PENDING,
      delayed: JobStatus.PENDING,
      active: JobStatus.PROCESSING,
      completed: JobStatus.COMPLETED,
      failed: JobStatus.FAILED,
    };
    return stateMap[state] || JobStatus.PENDING;
  }
}
