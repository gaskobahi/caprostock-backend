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
import { TransfertOrder } from 'src/core/entities/stockmanagement/transfertorder.entity';
import { CreateTransfertOrderDto } from 'src/core/dto/stockmanagement/create-transfert-order.dto';
import { TransfertOrderService } from 'src/core/services/stockmanagement/transfert-order.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('transfertOrder')
@Controller('transfertorder')
export class TransfertOrderController {
  constructor(private service: TransfertOrderService) {}

  /**
   * Get paginated transfertOrder list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(TransfertOrder)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<TransfertOrder>> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get transfertOrder by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':transfertorderId')
  async findOne(
    @Param('transfertorderId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<TransfertOrder> {
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
   * Create transfertOrder
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateTransfertOrderDto,
    @Query() query?: any,
  ): Promise<TransfertOrder> {
    const transfertOrder = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: transfertOrder.id },
    });
  }

  /**
   * Update transfertOrder
   */
  @ApiSearchOneQueryFilter()
  @Patch(':transfertorderId')
  async update(
    @Param('transfertorderId', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @Query() query?: any,
  ): Promise<TransfertOrder> {
    const transfertOrder = await this.service.updateRecord(
      { id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: transfertOrder.id ?? '' },
    });
  }

  /**
   * Remove transfertOrder
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':transfertorderId')
  async remove(@Param('transfertorderId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
