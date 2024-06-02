import { Entity, OneToMany } from 'typeorm';
import { PersonCoreEntity } from '../base/person.core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Supplier extends PersonCoreEntity {
  /**
   * Getters & Setters
   */
  // End Getters & Setters

  @ApiProperty({ required: false, type: () => [Order] })
  @OneToMany(() => Order, (order) => order.supplier, {
    cascade: true,
  })
  orders: Order[];
  /**
   * Methods *******************************************
   */
  // END Methods **************************************
}
