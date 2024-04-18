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
import { TreatmentService } from '../../services/selling/treatment.service';
import { Treatment } from '../../entities/selling/treatment.entity';
import { CreateTreatmentDto } from '../../dto/selling/create-treatment.dto';
import { UpdateTreatmentDto } from '../../dto/selling/update-treatment.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('treatment')
@Controller('treatment')
export class TreatmentController {
  constructor(private service: TreatmentService) {}

  /**
   * Get paginated treatment list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Treatment)
  @Get()
  async findPaginated(@Query() query?: any): Promise<Paginated<Treatment>> {
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
   * Get treatment by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':treatmentId')
  async findOne(
    @Param('treatmentId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Treatment> {
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
   * Create treatment
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateTreatmentDto,
    @Query() query?: any,
  ): Promise<Treatment> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.create,
      AbilitySubjectEnum.Treatment,
    );
    const treatment = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: treatment.id },
    });
  }

  /**
   * Update treatment
   */
  @ApiSearchOneQueryFilter()
  @Patch(':treatmentId')
  async update(
    @CurrentUser() authUser: AuthUser,
    @Param('treatmentId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTreatmentDto,
    @Query() query?: any,
  ): Promise<Treatment> {
    let treatment = await this.service.readOneRecord({
      where: { id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.edit, treatment);

    treatment = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: treatment.id ?? '' },
    });
  }

  /**
   * Remove treatment
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':treatmentId')
  async remove(
    @CurrentUser() authUser: AuthUser,
    @Param('treatmentId', ParseUUIDPipe) id: string,
  ) {
    const treatment = await this.service.readOneRecord({
      where: { id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.delete, treatment);

    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
