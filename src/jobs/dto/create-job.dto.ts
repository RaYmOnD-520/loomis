import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  payload: Record<string, any>;
}
