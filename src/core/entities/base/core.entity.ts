import { ApiPropertyOptional } from '@nestjs/swagger';
import { JoinColumn, ManyToOne } from 'typeorm';
import { AuthUser } from '../session/auth-user.entity';
import { BaseCoreEntity } from './base.core.entity';

export class CoreEntity extends BaseCoreEntity {
  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: AuthUser;

  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: AuthUser;

  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'deleted_by_id' })
  deletedBy: AuthUser;
}
