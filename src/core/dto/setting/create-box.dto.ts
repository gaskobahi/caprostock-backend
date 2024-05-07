import { ApiProperty, PickType } from '@nestjs/swagger';
import { Box } from '../../entities/setting/box.entity';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBoxDto extends PickType(Box, [
  'displayName',
  'branchId',
] as const) {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    type: () => Boolean,
    description: `est active `,
  })
  isEnable: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: () => String,
    description: ` description `,
  })
  description: string;
}
