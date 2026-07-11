import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import type { Job } from './entities/job.entity';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  createJob(@Body() createJobDto: CreateJobDto): Promise<Job> {
    return this.jobsService.createJob(createJobDto);
  }

  @Get(':id')
  getJob(@Param('id') id: string): Promise<Job> {
    return this.jobsService.getJobById(id);
  }
}
