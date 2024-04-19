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
import { DiscountService } from '../../services/product/discount.service';
import { Discount } from '../../entities/product/discount.entity';
import { CreateDiscountDto } from '../../dto/product/create-discount.dto';
import { UpdateDiscountDto } from '../../dto/product/update-discount.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('discount')
@Controller('discount')
export class DiscountController {
  constructor(private service: DiscountService) {}

  /**
   * Get paginated discount list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Discount)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Discount>> {
    // Permission check
   /* await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Discount,
    );*/

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
   * Get discount by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':discountId')
  async findOne(
    @Param('discountId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Discount> {
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
   * Create discount
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateDiscountDto,
    @Query() query?: any,
  ): Promise<Discount> {
    const discount = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: discount.id },
    });
  }

  /**
   * Update discount
   */
  @ApiSearchOneQueryFilter()
  @Patch(':discountId')
  async update(
    @Param('discountId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiscountDto,
    @Query() query?: any,
  ): Promise<Discount> {
    const discount = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: discount.id ?? '' },
    });
  }

  /**
   * Remove discount
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':discountId')
  async remove(@Param('discountId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
