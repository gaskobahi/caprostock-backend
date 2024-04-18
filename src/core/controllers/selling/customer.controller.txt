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
import { CustomerService } from '../../services/selling/customer.service';
import { Customer } from '../../entities/selling/customer.entity';
import { CreateCustomerDto } from '../../dto/selling/create-customer.dto';
import { UpdateCustomerDto } from '../../dto/selling/update-customer.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('customer')
@Controller('customer')
export class CustomerController {
  constructor(private service: CustomerService) {}

  /**
   * Get paginated customer list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Customer)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Customer>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Customer,
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
   * Get customer by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':customerId')
  async findOne(
    @Param('customerId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Customer> {
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
   * Create customer
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateCustomerDto,
    @Query() query?: any,
  ): Promise<Customer> {
    const customer = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: customer.id },
    });
  }

  /**
   * Update customer
   */
  @ApiSearchOneQueryFilter()
  @Patch(':customerId')
  async update(
    @Param('customerId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @Query() query?: any,
  ): Promise<Customer> {
    const customer = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: customer.id ?? '' },
    });
  }

  /**
   * Remove customer
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':customerId')
  async remove(@Param('customerId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
