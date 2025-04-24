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
import { SupplierService } from '../../services/stockmanagement/supplier.service';
import { Supplier } from '../../entities/stockmanagement/supplier.entity';
import { CreateSupplierDto } from 'src/core/dto/stockmanagement/create-supplier.dto';
import { UpdateSupplierDto } from 'src/core/dto/stockmanagement/update-supplier.dto';
@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('supplier')
@Controller('supplier')
export class SupplierController {
  constructor(private service: SupplierService) {}

  /**
   * Get paginated supplier list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Supplier)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Supplier>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Order,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['firstName', 'lastName', 'phoneNumber', 'email'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get supplier by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':supplierId')
  async findOne(
    @Param('supplierId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Supplier> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });
  }

  @ApiSearchOneQueryFilter()
  @Get('getunique')
  async getUnique(@Query() query: Record<string, any>): Promise<any> {
    // Liste des champs autorisés pour la recherche
    const allowedFields = ['firstName', 'phoneNumber', 'email'];
    const filters: Record<string, string> = {};
    for (const field of allowedFields) {
      const value = query[field];
      if (
        typeof value === 'string' &&
        value.trim() !== '' &&
        value.trim() !== 'null' &&
        value.trim() !== null
      ) {
        filters[field] = value.trim();
      }
    }

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    return await this.service.readOneRecord({
      ...options,
      where: {
        ...options?.where,
        ...filters,
      },
    });
  }

  /**
   * Create supplier
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateSupplierDto,
    @Query() query?: any,
  ): Promise<Supplier> {
    const supplier = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: supplier.id },
    });
  }

  /**
   * Update supplier
   */
  @ApiSearchOneQueryFilter()
  @Patch(':supplierId')
  async update(
    @Param('supplierId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
    @Query() query?: any,
  ): Promise<Supplier> {
    const supplier = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: supplier.id ?? '' },
    });
  }

  /**
   * Remove supplier
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':supplierId')
  async remove(@Param('supplierId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
