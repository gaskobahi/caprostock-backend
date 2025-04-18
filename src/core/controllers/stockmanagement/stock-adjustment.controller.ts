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
import { StockAdjustment } from 'src/core/entities/stockmanagement/stockadjustment.entity';
import { CreateStockAdjustmentDto } from 'src/core/dto/stockmanagement/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from 'src/core/dto/stockmanagement/update-stock-adjustment.dto';
import { StockAdjustmentService } from 'src/core/services/stockmanagement/stock-adjustment.service';
import {
  AbilityActionEnum,
  AbilitySubjectEnum,
} from 'src/core/definitions/enums';
import { merge } from 'lodash';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('stockAdjustment')
@Controller('stockadjustment')
export class StockAdjustmentController {
  constructor(private service: StockAdjustmentService) {}

  /**
   * Get paginated stockAdjustment list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(StockAdjustment)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<StockAdjustment>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Inventory,
    );
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference'],
      },
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );
    return this.service.myreadPaginatedListRecord(options);
  }

  /**
   * Get stockAdjustment by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':stockadjustmentId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('stockadjustmentId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<StockAdjustment> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    const stockAdjustment = this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Inventory,
    );
    return stockAdjustment;
  }

  /**
   * Create stockAdjustment
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateStockAdjustmentDto,
    @Query() query?: any,
  ): Promise<StockAdjustment> {
    const stockAdjustment = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: stockAdjustment?.id },
    });
  }

  /**
   * Update stockAdjustment
   */
  @ApiSearchOneQueryFilter()
  @Patch(':stockadjustmentId')
  async update(
    @Param('stockAdjustmentId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockAdjustmentDto,
    @Query() query?: any,
  ): Promise<StockAdjustment> {
    const stockAdjustment = await this.service.updateRecord(
      { id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: stockAdjustment.id ?? '' },
    });
  }

  /**
   * Remove stockAdjustment
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':stockadjustmentId')
  async remove(@Param('stockAdjustmentId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
