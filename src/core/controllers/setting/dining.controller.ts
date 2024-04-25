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
import { Dining } from 'src/core/entities/setting/dining.entity';
import { CreateDiningDto } from 'src/core/dto/setting/create-dining.dto';
import { UpdateDiningDto } from 'src/core/dto/setting/update-dining.dto';
import { DiningService } from 'src/core/services/setting/dining.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('dining')
@Controller('dining')
export class DiningController {
  constructor(private service: DiningService) {}

  /**
   * Get paginated dining list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Dining)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Dining>> {
    // Permission check
   /* await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Dining,
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
   * Get dining by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':diningId')
  async findOne(
    @Param('diningId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Dining> {
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
   * Create dining
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateDiningDto,
    @Query() query?: any,
  ): Promise<Dining> {
    const dining = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: dining.id },
    });
  }

  /**
   * Update dining
   */
  @ApiSearchOneQueryFilter()
  @Patch(':diningId')
  async update(
    @Param('diningId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiningDto,
    @Query() query?: any,
  ): Promise<Dining> {
    const dining = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: dining.id ?? '' },
    });
  }

  /**
   * Remove dining
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':diningId')
  async remove(@Param('diningId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
