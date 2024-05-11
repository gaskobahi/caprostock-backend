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
import { Reason } from 'src/core/entities/stockmanagement/reason.entity';
import { UpdateReasonDto } from 'src/core/dto/stockmanagement/update-reason.dto';
import { CreateReasonDto } from 'src/core/dto/stockmanagement/create-reason.dto';
import { ReasonService } from 'src/core/services/stockmanagement/reason.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('reason')
@Controller('reason')
export class ReasonController {
  constructor(private service: ReasonService) {}

  /**
   * Get paginated reason list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Reason)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Reason>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Reason,
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
   * Get reason by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':reasonId')
  async findOne(
    @Param('reasonId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Reason> {
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
   * Create reason
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateReasonDto,
    @Query() query?: any,
  ): Promise<Reason> {
    const reason = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: reason.id },
    });
  }

  /**
   * Update reason
   */
  @ApiSearchOneQueryFilter()
  @Patch(':reasonId')
  async update(
    @Param('reasonId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReasonDto,
    @Query() query?: any,
  ): Promise<Reason> {
    const reason = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: reason.id ?? '' },
    });
  }

  /**
   * Remove reason
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':reasonId')
  async remove(@Param('reasonId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
