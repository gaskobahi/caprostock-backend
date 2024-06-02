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
  OrderStatusEnum,
} from '../../definitions/enums';
import { AuthUser } from '../../entities/session/auth-user.entity';
//import { OrderService } from '../../services/supply/order.service';
import { CreateOrderDto } from '../../dto/stockmanagement/create-order.dto';
import { UpdateOrderDto } from '../../dto/stockmanagement/update-order.dto';
import { ValidateOrderDto } from '../../dto/stockmanagement/validate-order.dto';
import { Order } from 'src/core/entities/stockmanagement/order.entity';
import { OrderService } from 'src/core/services/stockmanagement/order.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('order')
@Controller('order')
export class OrderController {
  constructor(private service: OrderService) {}

  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Order)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Order>> {
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
  @Get(':orderId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('orderId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Order> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    const order = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, order);

    return order;
  }

  /**
   * Create order
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @Query() query?: any,
  ): Promise<Order> {
    const order = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
   /* options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: order.id },
    });
  }

  /**
   * Update order
   */
  @ApiSearchOneQueryFilter()
  @Patch(':orderId')
  async update(
    @Param('orderId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
    @Query() query?: any,
  ): Promise<Order> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    const order = await this.service.updateRecord(
      { ...filter, id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: order.id ?? '' },
    });
  }

  /**
   * Remove order
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':orderId')
  async remove(@Param('orderId', ParseUUIDPipe) id: string) {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ ...filter, id: id ?? '' });
    return;
  }

  /**
   * Validate order
   */
  @ApiSearchOneQueryFilter()
  @HttpCode(HttpStatus.OK)
  @Post(':orderId/validate/:status')
  async validate(
    @Param('orderId', ParseUUIDPipe) id: string,
    @Param('status', new ParseEnumPipe(OrderStatusEnum))
    status: OrderStatusEnum,
    @Body() dto: ValidateOrderDto,
    @Query() query?: any,
  ): Promise<Order> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    /*const order = await this.service.validateRecord(
      { ...filter, id: id ?? '' },
      status,
      dto,
    );*/

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    /*return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: order.id ?? '' },
    });*/
    return [] as any;
  }
}
