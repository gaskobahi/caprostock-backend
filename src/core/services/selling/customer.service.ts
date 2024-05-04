import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  PaginatedService,
  isUniqueConstraint,
  isUniqueConstraintUpdate,
} from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { Customer } from '../../entities/selling/customer.entity';
import { CreateCustomerDto } from 'src/core/dto/selling/create-customer.dto';
import { UpdateCustomerDto } from 'src/core/dto/selling/update-customer.dto';

@Injectable()
export class CustomerService extends AbstractService<Customer> {
  public NOT_FOUND_MESSAGE = `Client non trouvé`;

  constructor(
    @InjectRepository(Customer)
    private _repository: Repository<Customer>,
    protected paginatedService: PaginatedService<Customer>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: CreateCustomerDto): Promise<Customer> {
    if (dto.firstName) {
      await isUniqueConstraint(
        'firstName',
        Customer,
        { firstName: dto.firstName },
        {
          message: `La nom "${dto.firstName}" du client est déjà utilisé`,
        },
      );
    }
    // Check unique displayName
    if (dto.email) {
      await isUniqueConstraint(
        'email',
        Customer,
        { email: dto.email },
        {
          message: `L'email "${dto.email}"  est déjà utilisé`,
        },
      );
    }
    if (dto.phoneNumber) {
      await isUniqueConstraint(
        'phoneNumber',
        Customer,
        { phoneNumber: dto.phoneNumber },
        {
          message: `Le numéro de téléphone "${dto.phoneNumber}"  est déjà utilisé`,
        },
      );
    }
    if (dto.code) {
      await isUniqueConstraint(
        'code',
        Customer,
        { code: dto.code },
        {
          message: `Le code du client "${dto.code}"  est déjà utilisé`,
        },
      );
    }
    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Customer>,
    dto: UpdateCustomerDto,
  ) {
    // Check unique firstName
    if (dto.firstName) {
      await isUniqueConstraintUpdate(
        'firstName',
        Customer,
        { firstName: dto.firstName, id: optionsWhere.id },
        { message: `Le nom "${dto.firstName}" du client est déjà utilisé` },
      );
    }

    // Check unique email
    if (dto.email) {
      await isUniqueConstraintUpdate(
        'email',
        Customer,
        { email: dto.email, id: optionsWhere.id },
        { message: `L'email "${dto.email}" du client est déjà utilisé` },
      );
    }

    // Check unique email
    if (dto.phoneNumber) {
      await isUniqueConstraintUpdate(
        'phoneNumber',
        Customer,
        { phoneNumber: dto.phoneNumber, id: optionsWhere.id },
        {
          message: `Le numéro téléphone "${dto.phoneNumber}" du client est déjà utilisé`,
        },
      );
    }

    // Check unique email
    if (dto.code) {
      await isUniqueConstraintUpdate(
        'code',
        Customer,
        { code: dto.code, id: optionsWhere.id },
        {
          message: `Le code "${dto.code}" du client est déjà utilisé`,
        },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<Customer> {
    return this._repository;
  }
}
