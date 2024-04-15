import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { generate } from 'generate-password';
import { Doctor } from './doctor.entity';

@EventSubscriber()
export class DoctorSubscriber implements EntitySubscriberInterface<Doctor> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Doctor;
  }

  async beforeInsert(event: InsertEvent<Doctor>) {
    if (
      typeof event.entity.matricule !== 'string' ||
      event.entity.matricule.trim() === ''
    ) {
      event.entity.matricule = await this.generateMatricule(event.connection);
    }
  }

  async beforeUpdate(event: UpdateEvent<Doctor>) {
    if (
      typeof event.entity.reference !== 'string' ||
      event.entity.reference.trim() === ''
    ) {
      event.entity.reference = await this.generateMatricule(event.connection);
    }
  }

  private async generateMatricule(connection: DataSource): Promise<string> {
    let matricule: string;
    let existsCount: number;
    do {
      matricule = generate({
        numbers: true,
        length: 4,
        strict: true,
        lowercase: false,
        uppercase: true,
        excludeSimilarCharacters: false,
      });
      existsCount = await connection.getRepository(Doctor).countBy({
        matricule: matricule,
      });
    } while (existsCount > 0);

    return matricule;
  }
}
