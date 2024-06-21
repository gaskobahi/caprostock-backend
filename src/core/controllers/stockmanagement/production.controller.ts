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
import { Production } from 'src/core/entities/stockmanagement/production.entity';
import { CreateProductionDto } from 'src/core/dto/stockmanagement/create-production.dto';
import { UpdateProductionDto } from 'src/core/dto/stockmanagement/update-production.dto';
import { ProductionService } from 'src/core/services/stockmanagement/production.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('production')
@Controller('production')
export class ProductionController {
  constructor(private service: ProductionService) {}

  /**
   * Get paginated production list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Production)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Production>> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get production by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':productionId')
  async findOne(
    @Param('productionId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Production> {
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
   * Create production
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateProductionDto,
    @Query() query?: any,
  ): Promise<Production> {
    const production = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: production.id },
    });
  }

  /**
   * Update production
   */
  @ApiSearchOneQueryFilter()
  @Patch(':productionId')
  async update(
    @Param('productionId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductionDto,
    @Query() query?: any,
  ): Promise<Production> {
    const production = await this.service.updateRecord(
      { id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: production.id ?? '' },
    });
  }

  /**
   * Remove production
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':productionId')
  async remove(@Param('productionId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
