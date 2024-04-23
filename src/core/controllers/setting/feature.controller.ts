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
import { Feature } from 'src/core/entities/setting/feature.entity';
import { CreateFeatureDto } from 'src/core/dto/setting/create-feature.dto';
import { UpdateFeatureDto } from 'src/core/dto/setting/update-feature.dto';
import { FeatureService } from 'src/core/services/setting/feature.service';
import { UserService } from 'src/core/services/user/user.service';
import { CreateFeatureArrayDto } from 'src/core/dto/setting/create-featurearray.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('feature')
@Controller('feature')
export class FeatureController {
  constructor(
    private service: FeatureService,
    private userService: UserService,
    //private orderService: OrderService,
    //private saleService: SaleService,
  ) {}

  /**
   * Get paginated feature list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Feature)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Feature>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Feature,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    // Apply auth user feature filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserFeature(),
    );*/

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get paginated feature list for select

  /**
   * Get one feature by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':featureId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('featureId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Feature> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    const feature = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, feature);

    return feature;
  }

  /**
   * Create feature
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateFeatureDto,
    @Query() query?: any,
  ): Promise<Feature> {
    const feature = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: feature.id },
    });
  }


  @ApiSearchOneQueryFilter()
  @Post('/byarray')
  async createArray(
    @Body() dto: CreateFeatureArrayDto,
    @Query() query?: any,
  ): Promise<Feature> {
    const feature = await this.service.createArrayRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: feature.id },
    });
  }
  /**
   * Update feature
   */
  @ApiSearchOneQueryFilter()
  @Patch(':featureId')
  async update(
    @Param('featureId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeatureDto,
    @Query() query?: any,
  ): Promise<Feature> {
    const feature = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: feature.id },
    });
  }

  /**
   * Remove feature
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':featureId')
  async remove(@Param('featureId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
