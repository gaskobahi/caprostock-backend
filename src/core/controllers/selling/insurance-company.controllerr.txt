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
import { InsuranceCompanyService } from '../../services/selling/insurance-company.service';
import { InsuranceCompany } from '../../entities/selling/insurance-company.entity';
import { CreateInsuranceCompanyDto } from '../../dto/selling/create-insurance-company.dto';
import { UpdateInsuranceCompanyDto } from '../../dto/selling/update-insurance-company.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('insurance-company')
@Controller('insurance-company')
export class InsuranceCompanyController {
  constructor(private service: InsuranceCompanyService) {}

  /**
   * Get paginated insuranceCompany list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(InsuranceCompany)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<InsuranceCompany>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.InsuranceCompany,
    );

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
   * Get insuranceCompany by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':insuranceCompanyId')
  async findOne(
    @Param('insuranceCompanyId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<InsuranceCompany> {
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
   * Create insuranceCompany
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateInsuranceCompanyDto,
    @Query() query?: any,
  ): Promise<InsuranceCompany> {
    const insuranceCompany = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: insuranceCompany.id },
    });
  }

  /**
   * Update insuranceCompany
   */
  @ApiSearchOneQueryFilter()
  @Patch(':insuranceCompanyId')
  async update(
    @Param('insuranceCompanyId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInsuranceCompanyDto,
    @Query() query?: any,
  ): Promise<InsuranceCompany> {
    const insuranceCompany = await this.service.updateRecord(
      { id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: insuranceCompany.id ?? '' },
    });
  }

  /**
   * Remove insuranceCompany
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':insuranceCompanyId')
  async remove(@Param('insuranceCompanyId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
