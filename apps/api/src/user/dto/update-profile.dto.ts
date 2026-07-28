import { IsOptional, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '홍길동' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ enum: Language, example: 'ko' })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}
