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
import { Loyalty } from 'src/core/entities/setting/loyalty.entity';
import { CreateLoyaltyDto } from 'src/core/dto/setting/create-loyalty.dto';
import { UpdateLoyaltyDto } from 'src/core/dto/setting/update-loyalty.dto';
import { LoyaltyService } from 'src/core/services/setting/loyalty.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private service: LoyaltyService) {}

  /**
   * Get paginated loyalty list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Loyalty)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Loyalty>> {
    // Permission check
   /* await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Loyalty,
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
   * Get loyalty by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':loyaltyId')
  async findOne(
    @Param('loyaltyId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Loyalty> {
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
   * Create loyalty
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateLoyaltyDto,
    @Query() query?: any,
  ): Promise<Loyalty> {
    const loyalty = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: loyalty.id },
    });
  }

  /**
   * Update loyalty
   */
  @ApiSearchOneQueryFilter()
  @Patch(':loyaltyId')
  async update(
    @Param('loyaltyId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoyaltyDto,
    @Query() query?: any,
  ): Promise<Loyalty> {
    const loyalty = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: loyalty.id ?? '' },
    });
  }

  /**
   * Remove loyalty
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':loyaltyId')
  async remove(@Param('loyaltyId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
