import { Entity, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PersonCoreEntity } from '../base/person.core.entity';
import { Sale } from './sale.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Customer extends PersonCoreEntity {
  @ApiProperty({ type: () => [Sale] })
  @OneToMany(() => Sale, (sale) => sale.customer)
  sales: Sale[];

  /**
   * Getters & Setters *******************************************
   */

  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  // END Methods **************************************
}
