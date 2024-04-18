import {
  ApiSearchOneParamOptions,
  ApiSearchOneQueryFilter,
  ApiSearchParamOptions,
  ApiSearchQueryFilter,
  CustomApiErrorResponse,
  CustomApiPaginatedResponse,
  Paginated,
} from '@app/nestjs';
import { buildFilterFromApiSearchParams } from '@app/typeorm';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { merge } from 'lodash';
import { ApiAuthJwtHeader } from 'src/modules/auth/decorators/api-auth-jwt-header.decorator';
import { ApiRequestIssuerHeader } from 'src/modules/auth/decorators/api-request-issuer-header.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { ConsultService } from '../../services/consultation/consult.service';
import { Consult } from '../../entities/consultation/consult.entity';
import { CreateConsultDto } from '../../dto/consultation/create-consult.dto';
import { UpdateConsultDto } from '../../dto/consultation/update-consult.dto';
import { subject } from '@casl/ability';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('consult')
@Controller('consult')
export class ConsultController {
  constructor(private service: ConsultService) {}

  /**
   * Get paginated consult list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Consult)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Consult>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Consult,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference', 'externalId'],
      },
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get consult by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':consultId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('consultId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Consult> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    const consult = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, consult);

    return consult;
  }

  /**
   * Create consult
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateConsultDto,
    @Query() query?: any,
  ): Promise<Consult> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.create,
      subject(AbilitySubjectEnum.Consult, {
        branchId: authUser?.targetBranchId,
        ...dto,
      } as Consult),
    );

    const consult = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: consult.id },
    });
  }

  /**
   * Update consult
   */
  @ApiSearchOneQueryFilter()
  @Patch(':consultId')
  async update(
    @CurrentUser() authUser: AuthUser,
    @Param('consultId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultDto,
    @Query() query?: any,
  ): Promise<Consult> {
    let consult = await this.service.readOneRecord({ where: { id: id ?? '' } });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.edit, consult);

    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    consult = await this.service.updateRecord({ ...filter, id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: consult.id ?? '' },
    });
  }

  /**
   * Remove consult
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':consultId')
  async remove(
    @CurrentUser() authUser: AuthUser,
    @Param('consultId', ParseUUIDPipe) id: string,
  ) {
    const consult = await this.service.readOneRecord({
      where: { id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.delete, consult);

    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ ...filter, id: id ?? '' });
    return;
  }

  /**
   * Print consult
   */
  @ApiSearchOneQueryFilter()
  @Get(':consultId/print')
  async print(
    @CurrentUser() authUser: AuthUser,
    @Param('consultId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Consult> {
    let consult = await this.service.readOneRecord({ where: { id: id ?? '' } });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, consult);

    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    consult = await this.service.printRecord({ ...filter, id: id ?? '' });

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: consult.id ?? '' },
    });
  }
}
