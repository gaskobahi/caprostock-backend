import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { generate } from 'generate-password';
import dayjs from 'dayjs';
import { Corder } from './corder.entity';

@EventSubscriber()
export class CorderSubscriber implements EntitySubscriberInterface<Corder> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Corder;
  }

  async beforeInsert(event: InsertEvent<Corder>) {
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
        'CO' +
        dayjs.utc().toArray().join('').slice(0, 6) +
        generate({
          numbers: true,
          length: 3,
          strict: true,
          lowercase: false,
          uppercase: false,
          excludeSimilarCharacters: true,
        });
      existsCount = await connection.getRepository(Corder).countBy({
        reference: reference,
      });
    } while (existsCount > 0);

    return reference;
  }
}
