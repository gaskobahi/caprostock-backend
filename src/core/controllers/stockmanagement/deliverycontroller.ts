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
import { DeliveryService } from 'src/core/services/selling/delivery.service';
import { Delivery } from 'src/core/entities/selling/delivery.entity';
import { CreateDeliveryDto } from 'src/core/dto/selling/create-delivery.dto';
import { UpdateDeliveryDto } from 'src/core/dto/selling/update-delivery.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private service: DeliveryService) {}

  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Delivery)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Delivery>> {
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

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Update delivery
   */
  @ApiSearchOneQueryFilter()
  @Post(':deliveryId/cancel')
  async cancelRecord(
    @Param('deliveryId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Delivery> {
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

  @ApiSearchOneQueryFilter()
  @Get(':deliveryId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('deliveryId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Delivery> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    const delivery = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Selling,
    );

    return delivery;
  }

  /**
   * Update delivery
   */
  @ApiSearchOneQueryFilter()
  @Post(':deliveryId/closed')
  async validateDelivery(
    @Param('deliveryId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Delivery> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    await this.service.validateDelivery({ ...filter, id: id ?? '' });
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
   * Create delivery
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateDeliveryDto,
    @Query() query?: any,
  ): Promise<Delivery> {
    const delivery = await this.service.createRecord(dto);

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
      where: { ...options?.where, id: delivery.id },
    });
  }

  /**
   * Update delivery
   */
  @ApiSearchOneQueryFilter()
  @Patch(':deliveryId')
  async update(
    @Param('deliveryId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryDto,
    @Query() query?: any,
  ): Promise<Delivery> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    const delivery = await this.service.updateRecord(
      { ...filter, id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: delivery.id ?? '' },
    });
  }

  /**
   * Remove delivery
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':deliveryId')
  async remove(@Param('deliveryId', ParseUUIDPipe) id: string) {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ ...filter, id: id ?? '' });
    return;
  }
}
