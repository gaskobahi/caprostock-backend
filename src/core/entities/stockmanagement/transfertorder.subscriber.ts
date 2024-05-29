import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { generate } from 'generate-password';
import dayjs from 'dayjs';
import { TransfertOrder } from './transfertorder.entity';

@EventSubscriber()
export class TransfertOrderSubscriber
  implements EntitySubscriberInterface<TransfertOrder>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return TransfertOrder;
  }

  async beforeInsert(event: InsertEvent<TransfertOrder>) {
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
        'TO' +
        dayjs.utc().toArray().join('').slice(0, 6) +
        generate({
          numbers: true,
          length: 3,
          strict: true,
          lowercase: false,
          uppercase: false,
          excludeSimilarCharacters: true,
        });
      existsCount = await connection.getRepository(TransfertOrder).countBy({
        reference: reference,
      });
    } while (existsCount > 0);

    return reference;
  }
}
