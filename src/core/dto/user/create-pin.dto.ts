import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Pin } from '../../entities/user/pin.entity';
import { IsOptional, IsUUID } from 'class-validator';

export class CreatePinDto extends PickType(Pin, ['code'] as const) {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  id: string;
}
