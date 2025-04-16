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
  ParseEnumPipe,
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
import {
  AbilityActionEnum,
  AbilitySubjectEnum,
  SellingStatusEnum,
} from '../../definitions/enums';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { SellingService } from 'src/core/services/selling/selling.service';
import { Selling } from 'src/core/entities/selling/selling.entity';
import { UpdateSellingDto } from 'src/core/dto/selling/update-selling.dto';
import { CreateSellingDto } from 'src/core/dto/selling/create-selling.dto';
import { ValidateSellingDto } from 'src/core/dto/selling/validate-selling.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('selling')
@Controller('selling')
export class SellingController {
  constructor(private service: SellingService) {}

  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Selling)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Selling>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Selling,
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

    return await this.service.myreadPaginatedListRecord(options);
  }

  @ApiSearchOneQueryFilter()
  @Get(':sellingId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('sellingId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Selling> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    const selling = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Selling,
    );

    return selling;
  }

  /**
   * Create selling
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateSellingDto,
    @Query() query?: any,
  ): Promise<Selling> {
    const selling = await this.service.createRecord(dto);

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
      where: { ...options?.where, id: selling.id },
    });
  }

  /**
   * Update selling
   */
  @ApiSearchOneQueryFilter()
  @Patch(':sellingId')
  async update(
    @Param('sellingId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSellingDto,
    @Query() query?: any,
  ): Promise<Selling> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    const selling = await this.service.updateRecord(
      { ...filter, id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: selling.id ?? '' },
    });
  }

  /**
   * Remove selling
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':sellingId')
  async remove(@Param('sellingId', ParseUUIDPipe) id: string) {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ ...filter, id: id ?? '' });
    return;
  }

  @ApiSearchOneQueryFilter()
  @HttpCode(HttpStatus.OK)
  @Post(':sellingId/cancel')
  async cancelRecord(
    @Param('sellingId', ParseUUIDPipe) id: string,
    @Query()
    query?: any,
  ): Promise<Selling> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.cancelRecord({
      ...filter,
      id: id ?? '',
    });

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: id ?? '' },
    });
  }
}
