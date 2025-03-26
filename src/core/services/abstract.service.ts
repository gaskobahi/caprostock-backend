import { PaginatedService } from '@app/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { AuthUser } from '../entities/session/auth-user.entity';
import { BaseCoreEntity } from '../entities/base/base.core.entity';
import * as dns from 'dns';

export abstract class AbstractService<T extends BaseCoreEntity> {
  abstract NOT_FOUND_MESSAGE: string;
  abstract repository: Repository<T>;
  protected abstract paginatedService: PaginatedService<T>;
  protected abstract request: any;

  async readListRecord(options?: FindManyOptions<T>) {
    return this.repository.find(options);
  }

  async readPaginatedListRecord(
    options?: FindManyOptions<T>,
    page?: number,
    perPage?: number,
  ) {
    return await this.paginatedService.paginate(
      this.repository,
      page,
      perPage,
      options,
    );
  }

  async readOneRecord(options?: FindOneOptions<T>) {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }

    return entity;
  }

  async createRecord(dto: DeepPartial<T>): Promise<T> {
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    const entity: T = this.repository.create(dto);

    entity.createdById = authUser?.id;
    entity.updatedById = authUser?.id;

    return await this.repository.save(entity);
  }

  async updateRecord(optionsWhere: FindOptionsWhere<T>, dto: DeepPartial<T>) {
    let entity = await this.repository.findOneBy(optionsWhere);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    entity = this.repository.merge(entity, dto);

    entity.updatedById = authUser?.id;
    // Adding this to trigger update events
    entity.updatedAt = new Date();
    return await this.repository.save(entity);
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<T>) {
    const entity = await this.repository.findOneBy(optionsWhere);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    entity.updatedById = authUser?.id;
    entity.deletedById = authUser?.id;

    return await this.repository.remove(entity);
  }

  protected async checkSessionBranch(): Promise<AuthUser> {
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    if (!authUser) {
      throw new UnauthorizedException(
        new Error(`Action non autorisée`),
        `Impossible de recupérer la session`,
      );
    }

    if (!authUser.targetBranchId) {
      throw new UnauthorizedException(
        new Error(`Action non autorisée`),
        `Impossible de recupérer la succursale`,
      );
    }
    console.log('P2023', authUser);

    return authUser;
  }
  protected async isValidDomain(email) {
    const [, domain] = email.split('@'); // Obtenir le domaine depuis l'adresse e-mail

    return new Promise((resolve, reject) => {
      dns.resolve(domain, 'MX', (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          reject(false); // Le domaine n'existe pas ou ne possède pas de serveurs MX
        } else {
          resolve(true); // Le domaine est valide
        }
      });
    });
  }

  protected generateRandomPassword(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}[]|;:,.<>?';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters.charAt(randomIndex);
    }

    return password;
  }

  protected getMargin(price = 0, cost = 0) {
    const mb: number = price - cost;
    const mTaux = (mb / price) * 100;
    if (isNaN(mTaux)) {
      return 0;
    }
    return parseFloat(mTaux.toFixed(2));
  }

  protected calculateAveragePrice(array) {
    if (array.length === 0) {
      return 0;
    }
    const total = array.reduce((sum, price) => sum + price, 0);
    const average = total / array.length;
    return parseFloat(average.toFixed(0));
  }

  public convertSingleQuotesToDouble(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "'") {
        result += '"';
      } else {
        result += str[i];
      }
    }
    return result;
  }
}
