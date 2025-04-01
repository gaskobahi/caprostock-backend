import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonCoreEntity } from '../base/person.core.entity';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Selling } from './selling.entity';
import { Department } from '../setting/department.entity';
import { Section } from '../setting/section.entity';
import { Delivery } from './delivery.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Customer extends PersonCoreEntity {
  @IsOptional()
  @ApiPropertyOptional()
  @IsUUID()
  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string;

  @ApiProperty({
    type: () => Department,
    description: `departement du demandeur`,
  })
  @ManyToOne(() => Department, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @IsOptional()
  @ApiPropertyOptional()
  @IsUUID()
  @Column({ name: 'section_id', type: 'uuid', nullable: true })
  sectionId: string;

  @ApiProperty({
    type: () => Section,
    description: `section du demandeur`,
  })
  @ManyToOne(() => Section, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  @Column({ nullable: true })
  code: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: `Point du client ` })
  @Column({ type: 'double precision', default: 0 })
  pointBalance: number;

  @ApiProperty({ required: false, type: () => [Selling] })
  @OneToMany(() => Selling, (selling) => selling.customer, { cascade: true })
  sellings: Selling[];

  @ApiProperty({ required: false, type: () => [Delivery] })
  @OneToMany(() => Delivery, (delivery) => delivery.transporter, {
    cascade: true,
  })
  deliverys: Delivery[];
  /**
   * Getters & Setters *******************************************
   */

  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  // END Methods **************************************
}
