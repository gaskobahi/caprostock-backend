import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  ObjectLiteral,
  UpdateEvent,
} from 'typeorm';
import { generate } from 'generate-password';
import dayjs from 'dayjs';
import { Sale } from './sale.entity';

@EventSubscriber()
export class SaleSubscriber implements EntitySubscriberInterface<Sale> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Sale;
  }

  async beforeInsert(event: InsertEvent<Sale>) {
    if (
      typeof event.entity.reference !== 'string' ||
      event.entity.reference.trim() === ''
    ) {
      event.entity.reference = await this.generateReference(event.connection);
    }

    event.entity = this.syncEffectiveAmount(event.entity) as Sale;
    event.entity = this.syncPaidAmount(event.entity) as Sale;
  }

  async beforeUpdate(event: UpdateEvent<Sale>) {
    if (event.entity) {
      event.entity = this.syncEffectiveAmount(event.entity);
      event.entity = this.syncPaidAmount(event.entity);
    }
  }

  private syncPaidAmount(sale: Sale | ObjectLiteral): Sale | ObjectLiteral {
    if (Array.isArray(sale?.payments)) {
      sale.paidAmount = sale.payments.reduce(
        (prev, curr) => prev + curr.amount,
        0,
      );
    }
    return sale;
  }

  private syncEffectiveAmount(
    sale: Sale | ObjectLiteral,
  ): Sale | ObjectLiteral {
    if (Array.isArray(sale?.saleToProducts)) {
      sale.effectiveAmount = sale.saleToProducts.reduce(
        (prev, curr) => prev + curr.price * curr.quantity,
        0,
      );
    }
    return sale;
  }

  private async generateReference(connection: DataSource): Promise<string> {
    let reference: string;
    let existsCount: number;
    do {
      reference =
        'SA' +
        dayjs.utc().toArray().join('').slice(0, 6) +
        generate({
          numbers: true,
          length: 3,
          strict: true,
          lowercase: false,
          uppercase: false,
          excludeSimilarCharacters: true,
        });
      existsCount = await connection.getRepository(Sale).countBy({
        reference: reference,
      });
    } while (existsCount > 0);

    return reference;
  }
}
