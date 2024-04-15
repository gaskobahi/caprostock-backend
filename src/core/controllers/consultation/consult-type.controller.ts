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
import { ApiAuthJwtHeader } from 'src/modules/auth/decorators/api-auth-jwt-header.decorator';
import { ApiRequestIssuerHeader } from 'src/modules/auth/decorators/api-request-issuer-header.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { ConsultTypeService } from '../../services/consultation/consult-type.service';
import { ConsultType } from '../../entities/consultation/consult-type.entity';
import { CreateConsultTypeDto } from '../../dto/consultation/create-consult-type.dto';
import { UpdateConsultTypeDto } from '../../dto/consultation/update-consult-type.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('consult-type')
@Controller('consult-type')
export class ConsultTypeController {
  constructor(private service: ConsultTypeService) {}

  /**
   * Get paginated consultType list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(ConsultType)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<ConsultType>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.ConsultType,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get consultType by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':consultTypeId')
  async findOne(
    @Param('consultTypeId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<ConsultType> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });
  }

  /**
   * Create consultType
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateConsultTypeDto,
    @Query() query?: any,
  ): Promise<ConsultType> {
    const consultType = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: consultType.id },
    });
  }

  /**
   * Update consultType
   */
  @ApiSearchOneQueryFilter()
  @Patch(':consultTypeId')
  async update(
    @Param('consultTypeId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultTypeDto,
    @Query() query?: any,
  ): Promise<ConsultType> {
    const consultType = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: consultType.id ?? '' },
    });
  }

  /**
   * Remove consultType
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':consultTypeId')
  async remove(@Param('consultTypeId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
