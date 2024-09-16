import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { CreateOpenTicketDto } from 'src/core/dto/selling/create-open-ticket.dto';
import { UpdateOpenTicketDto } from 'src/core/dto/selling/update-open-ticket.dto';
import { OpenTicket } from 'src/core/entities/selling/open-ticket.entity';

@Injectable()
export class OpenTicketService extends AbstractService<OpenTicket> {
  public NOT_FOUND_MESSAGE = `Client non trouvé`;

  constructor(
    @InjectRepository(OpenTicket)
    private _repository: Repository<OpenTicket>,
    protected paginatedService: PaginatedService<OpenTicket>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: CreateOpenTicketDto): Promise<OpenTicket> {
    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<OpenTicket>,
    dto: UpdateOpenTicketDto,
  ) {
    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<OpenTicket> {
    return this._repository;
  }
}
