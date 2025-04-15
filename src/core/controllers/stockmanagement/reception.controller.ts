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
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { Reception } from 'src/core/entities/stockmanagement/reception.entity';
import { CreateReceptionDto } from 'src/core/dto/stockmanagement/create-reception.dto';
import { UpdateReceptionDto } from 'src/core/dto/stockmanagement/update-reception.dto';
import { ReceptionService } from 'src/core/services/stockmanagement/reception.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('reception')
@Controller('reception')
export class ReceptionController {
  constructor(private service: ReceptionService) {}

  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Reception)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Reception>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Order,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference', 'title'],
      },
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    return this.service.readPaginatedListRecord(options);
  }

  @ApiSearchOneQueryFilter()
  @Get(':receptionId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('receptionId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Reception> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    const reception = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Order,
    );

    return reception;
  }

  /**
   * Create reception
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateReceptionDto,
    @Query() query?: any,
  ): Promise<Reception> {
    const reception = await this.service.createRecord(dto);

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
      where: { ...options?.where, id: reception.id },
    });
  }

  /**
   * Update reception
   */
  @ApiSearchOneQueryFilter()
  @Patch(':receptionId')
  async update(
    @Param('receptionId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReceptionDto,
    @Query() query?: any,
  ): Promise<Reception> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    const reception = await this.service.updateRecord(
      { ...filter, id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: reception.id ?? '' },
    });
  }

  /**
   * Update reception
   */
  @ApiSearchOneQueryFilter()
  @Post(':receptionId/cancel')
  async cancel(
    @Param('receptionId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Reception> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    await this.service.cancelRecord({ ...filter, id: id ?? '' });
    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: id ?? '' },
    });
  }

  /**
   * Update reception
   */
  @ApiSearchOneQueryFilter()
  @Post(':receptionId/closed')
  async validateReception(
    @Param('receptionId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Reception> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    await this.service.validateReception({ ...filter, id: id ?? '' });
    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: id ?? '' },
    });
  }

  /**
   * Remove reception
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':receptionId')
  async remove(@Param('receptionId', ParseUUIDPipe) id: string) {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ ...filter, id: id ?? '' });
    return;
  }
}
