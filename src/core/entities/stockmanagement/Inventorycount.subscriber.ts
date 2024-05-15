import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { generate } from 'generate-password';
import dayjs from 'dayjs';
import { InventoryCount } from './inventorycount.entity';

@EventSubscriber()
export class InventoryCountSubscriber
  implements EntitySubscriberInterface<InventoryCount>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return InventoryCount;
  }

  async beforeInsert(event: InsertEvent<InventoryCount>) {
    if (
      typeof event.entity.reference !== 'string' ||
      event.entity.reference.trim() === ''
    ) {
      event.entity.reference = await this.generateReference(event.connection);
    }
  }

  private async generateReference(connection: DataSource): Promise<string> {
    let reference: string;
    let existsCount: number;
    do {
      reference =
        'IC' +
        dayjs.utc().toArray().join('').slice(0, 6) +
        generate({
          numbers: true,
          length: 3,
          strict: true,
          lowercase: false,
          uppercase: false,
          excludeSimilarCharacters: true,
        });
      existsCount = await connection.getRepository(InventoryCount).countBy({
        reference: reference,
      });
    } while (existsCount > 0);

    return reference;
  }
}
