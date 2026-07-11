import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobStatus } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  private jobs: Job[] = [];

  createJob(createJobDto: CreateJobDto): Job {
    const now = new Date();
    const job: Job = {
      id: uuidv4(),
      type: createJobDto.type,
      payload: createJobDto.payload,
      status: JobStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.push(job);
    return job;
  }

  getJobById(id: string): Job {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }
}
