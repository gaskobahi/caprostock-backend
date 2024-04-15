import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import bcrypt from 'bcrypt';
import { PersonCoreEntity } from '../base/person.core.entity';
import { Branch } from '../subsidiary/branch.entity';
import { Role } from './role.entity';
import { Exclude, instanceToPlain } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AuthUser } from '../session/auth-user.entity';
import { Pin } from './pin.entity';
import { BranchToUser } from '../subsidiary/branch-to-user.entity';

/**
 * Front office user
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class User extends PersonCoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom d'utilisateur`, uniqueItems: true })
  @Index()
  @Column({ type: 'varchar' })
  username: string;

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  password: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Compte actif` })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `CODE PIN actif` })
  @Column({ name: 'is_pin_active', default: false })
  isPinActive: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: `Invitation à se connecter au backoffice`,
  })
  @Column({ name: 'is_invited_back', default: false })
  isInviteToBo: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: `User dispose t-il d'un code PIN`,
  })
  @Column({ name: 'has_pin_code', default: false })
  hasPinCode: boolean;

  @IsUUID()
  @IsOptional()
  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string;

  @IsUUID()
  @IsOptional()
  @Column({ name: 'pin_id', type: 'uuid', nullable: true })
  pinId: string;

  @ApiProperty({ type: 'object', description: `Rôle` })
  @ManyToOne(() => Role, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @ApiProperty({ type: 'object', description: `Succursale` })
  @ManyToOne(() => Branch, (branch) => branch.users, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ type: 'object', description: `Code Pin` })
  @OneToOne(() => Pin, {
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'pin_id' })
  pin: Pin;

  @ApiPropertyOptional()
  @Column({
    name: 'last_access_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  lastAccessId: string;

  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'last_access_id' })
  lastAccess: AuthUser;

  @ApiProperty({ required: false, type: () => [BranchToUser] })
  @OneToMany(() => BranchToUser, (branchToUser) => branchToUser.user, {
    cascade: true,
  })
  branchToUsers: BranchToUser[];

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  /**
   * Set user password
   */
  async setNewPassword(password: string): Promise<string> {
    const salt = bcrypt.genSaltSync(13);
    this.password = bcrypt.hashSync(password, salt);
    return this.password;
  }

  /**
   * Verify user password
   */
  async checkPassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, String(this.password ?? ''));
  }

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
