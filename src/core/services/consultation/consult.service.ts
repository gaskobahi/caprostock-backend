import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Consult } from '../../entities/consultation/consult.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { CreateConsultDto } from '../../dto/consultation/create-consult.dto';
import { ConsultStatusEnum } from '../../definitions/enums';
import { ConsultPrintingHistory } from '../../entities/consultation/consult-printing-history.entity';

@Injectable()
export class ConsultService extends AbstractService<Consult> {
  public NOT_FOUND_MESSAGE = `Consultation non trouvée`;

  constructor(
    @InjectRepository(Consult)
    private _repository: Repository<Consult>,
    protected paginatedService: PaginatedService<Consult>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Consult> {
    return this._repository;
  }

  async createRecord(dto: CreateConsultDto): Promise<Consult> {
    const authUser = await super.checkSessionBranch();

    return await super.createRecord({
      ...dto,
      branchId: authUser.targetBranchId,
      status: ConsultStatusEnum.init,
    });
  }

  async printRecord(optionsWhere: FindOptionsWhere<Consult>): Promise<Consult> {
    const consult = await this.readOneRecord({
      where: optionsWhere,
      relations: { printingHistories: true },
    });
    const authUser = await super.checkSessionBranch();
    consult.printingActorId = authUser?.id;
    consult.printingHistories.push(
      ConsultPrintingHistory.create({ createdById: authUser?.id }),
    );
    return this.repository.save(consult);
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Consult>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }
}
