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
import { TaxService } from 'src/core/services/setting/tax.service';
import { Tax } from 'src/core/entities/setting/tax.entity';
import { CreateTaxDto } from 'src/core/dto/setting/create-tax.dto';
import { UpdateTaxDto } from 'src/core/dto/setting/update-tax.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('tax')
@Controller('tax')
export class TaxController {
  constructor(private service: TaxService) {}

  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Tax)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Tax>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Tax,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    return this.service.readPaginatedListRecord(options);
  }

  @ApiSearchOneQueryFilter()
  @Get(':taxId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('taxId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Tax> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    const tax = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, tax);

    return tax;
  }


  /**
   * Create tax
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateTaxDto,
    @Query() queryParams?: any,
  ): Promise<Tax> {
    const tax = await this.service.createRecord(dto);
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      queryParams as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: tax.id },
    });
  }

  /**
   * Update tax
   */
  @ApiSearchOneQueryFilter()
  @Patch(':taxId')
  async update(
    @Param('taxId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxDto,
    @Query() query?: any,
  ): Promise<Tax> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();
    const tax = await this.service.updateRecord(
      { ...filter, id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: tax.id ?? '' },
    });
  }

  /**
   * Remove tax
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':taxId')
  async remove(@Param('taxId', ParseUUIDPipe) id: string) {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ ...filter, id: id ?? '' });
    return;
  }
}
