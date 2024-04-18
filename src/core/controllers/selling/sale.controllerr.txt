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
import { AuthUser } from '../../entities/session/auth-user.entity';
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { SaleService } from '../../services/selling/sale.service';
import { Sale } from '../../entities/selling/sale.entity';
import {
  AddSalePaymentDto,
  CreateSaleDto,
} from '../../dto/selling/create-sale.dto';
import { UpdateSaleDto } from '../../dto/selling/update-sale.dto';
import { SalePaymentService } from '../../services/selling/sale-payment.service';
import { SalePayment } from '../../entities/selling/sale-payment.entity';
import { subject } from '@casl/ability';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('sale')
@Controller('sale')
export class SaleController {
  constructor(
    private service: SaleService,
    private salePaymentservice: SalePaymentService,
  ) {}

  /**
   * Get paginated sale list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Sale)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Sale>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Sale,
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

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get sale by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':saleId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('saleId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Sale> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    const sale = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, sale);

    return sale;
  }

  /**
   * Create sale
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateSaleDto,
    @Query() query?: any,
  ): Promise<Sale> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.create,
      subject(AbilitySubjectEnum.Sale, {
        branchId: authUser?.targetBranchId,
        ...dto,
      } as Sale),
    );

    const sale = await this.service.createRecord(dto);

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
      where: { ...options?.where, id: sale.id },
    });
  }

  /**
   * Update sale
   */
  @ApiSearchOneQueryFilter()
  @Patch(':saleId')
  async update(
    @CurrentUser() authUser: AuthUser,
    @Param('saleId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSaleDto,
    @Query() query?: any,
  ): Promise<Sale> {
    let sale = await this.service.readOneRecord({ where: { id: id ?? '' } });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.edit, sale);

    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    sale = await this.service.updateRecord({ ...filter, id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: sale.id ?? '' },
    });
  }

  /**
   * Remove sale
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':saleId')
  async remove(
    @CurrentUser() authUser: AuthUser,
    @Param('saleId', ParseUUIDPipe) id: string,
  ) {
    const sale = await this.service.readOneRecord({ where: { id: id ?? '' } });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.edit, sale);

    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ ...filter, id: id ?? '' });
    return;
  }

  /**
   * Print sale
   */
  @ApiSearchOneQueryFilter()
  @Get(':saleId/print')
  async print(
    @CurrentUser() authUser: AuthUser,
    @Param('saleId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Sale> {
    let sale = await this.service.readOneRecord({ where: { id: id ?? '' } });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, sale);

    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    sale = await this.service.printRecord({ ...filter, id: id ?? '' });

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: sale.id ?? '' },
    });
  }

  /**
   * Get all sale payments
   */
  @Get(':saleId/payment')
  async findPayments(
    @CurrentUser() authUser: AuthUser,
    @Param('saleId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<SalePayment[]> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    const sale = await this.service.readOneRecord({
      where: { ...filter, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      subject(AbilitySubjectEnum.SalePayment, {
        sale,
        saleId: sale.id,
      } as SalePayment),
    );

    const options = buildFilterFromApiSearchParams(
      this.salePaymentservice.repository,
      query as ApiSearchParamOptions,
    );

    return await this.salePaymentservice.readListRecord({
      ...options,
      where: { ...options.where, saleId: sale.id },
    });
  }

  /**
   * Add sale payment
   */
  @Post(':saleId/payment')
  async postPayment(
    @CurrentUser() authUser: AuthUser,
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: AddSalePaymentDto,
    @Query() query?: any,
  ): Promise<SalePayment> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    const sale = await this.service.readOneRecord({
      where: { ...filter, id: saleId ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.create,
      subject(AbilitySubjectEnum.SalePayment, {
        saleId: sale.id,
        sale: sale,
      } as SalePayment),
    );

    const options = buildFilterFromApiSearchParams(
      this.salePaymentservice.repository,
      query as ApiSearchParamOptions,
    );

    const payment = await this.service.addPaymentRecord({ id: sale.id }, dto);

    return this.salePaymentservice.readOneRecord({
      ...options,
      where: { ...options.where, id: payment.id, saleId: sale.id },
    });
  }

  /**
   * get one sale payment by id
   */
  @Get(':saleId/payment/:paymentId')
  async getOnePayment(
    @CurrentUser() authUser: AuthUser,
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Query() query?: any,
  ): Promise<SalePayment> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    const sale = await this.service.readOneRecord({
      where: { ...filter, id: saleId ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      subject(AbilitySubjectEnum.SalePayment, {
        id: paymentId,
        saleId: sale.id,
        sale: sale,
      } as SalePayment),
    );

    const options = buildFilterFromApiSearchParams(
      this.salePaymentservice.repository,
      query as ApiSearchParamOptions,
    );

    const payment = await this.salePaymentservice.printRecord({
      saleId: sale.id,
      id: paymentId ?? '',
    });

    return this.salePaymentservice.readOneRecord({
      ...options,
      where: { ...options.where, id: payment.id, saleId: sale.id },
    });
  }

  /**
   * Print sale payment
   */
  @Get(':saleId/payment/:paymentId/print')
  async printPayment(
    @CurrentUser() authUser: AuthUser,
    @Param('saleId', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Query() query?: any,
  ): Promise<SalePayment> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    const sale = await this.service.readOneRecord({
      where: { ...filter, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      subject(AbilitySubjectEnum.SalePayment, {
        id: paymentId,
        saleId: sale.id,
        sale: sale,
      } as SalePayment),
    );

    // Make printed
    const payment = await this.salePaymentservice.printRecord({
      saleId: sale.id,
      id: paymentId ?? '',
    });

    const options = buildFilterFromApiSearchParams(
      this.salePaymentservice.repository,
      query as ApiSearchParamOptions,
    );

    return this.salePaymentservice.readOneRecord({
      ...options,
      where: { ...options.where, id: payment.id, saleId: sale.id },
    });
  }

  /**
   * Delete sale payment
   */
  @Delete(':saleId/payment/:paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePayment(
    @CurrentUser() authUser: AuthUser,
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    const sale = await this.service.readOneRecord({
      where: { ...filter, id: saleId ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.delete,
      subject(AbilitySubjectEnum.SalePayment, {
        saleId: sale.id,
        sale: sale,
      } as SalePayment),
    );

    await this.service.removePaymentRecord({ id: sale.id }, paymentId ?? '');

    return;
  }
}
