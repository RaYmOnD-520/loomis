import { Controller, Post, Get, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import type { Job } from './entities/job.entity';
import type { QueueStatsDto } from './dto/queue-stats.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  createJob(@Body() createJobDto: CreateJobDto): Promise<Job> {
    return this.jobsService.createJob(createJobDto);
  }

  @Get('stats/summary')
  getQueueStats(): Promise<QueueStatsDto> {
    return this.jobsService.getQueueStats();
  }

  @Get()
  getRecentJobs(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<Job[]> {
    const clampedLimit = Math.min(Math.max(limit, 1), 100);
    return this.jobsService.getRecentJobs(clampedLimit);
  }

  @Get(':id')
  getJob(@Param('id') id: string): Promise<Job> {
    return this.jobsService.getJobById(id);
  }
}
