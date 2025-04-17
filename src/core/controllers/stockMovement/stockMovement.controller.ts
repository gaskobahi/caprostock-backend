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
import { UpdateStockMovementDto } from 'src/core/dto/stockMovement/update-stockMovement.dto';
import { StockMovement } from 'src/core/entities/stockmovement/stockmovement.entity';
import { CreateStockMovementDto } from 'src/core/dto/stockMovement/create-stockMovement.dto';
import { StockMovementService } from 'src/core/services/stockMovement/stockMovement.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('stockmovement')
@Controller('stockmovement')
export class StockMovementController {
  constructor(private service: StockMovementService) {}

  /**
   * Get paginated stockmovement list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(StockMovement)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<StockMovement>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.StockMovement,
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
   * Get stockmovement by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':stockmovementId')
  async findOne(
    @Param('stockmovementId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<StockMovement> {
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
   * Create stockmovement
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateStockMovementDto,
    @Query() query?: any,
  ): Promise<StockMovement> {
    const stockmovement = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: stockmovement.id },
    });
  }

  /**
   * Update stockmovement
   */
  @ApiSearchOneQueryFilter()
  @Patch(':stockmovementId')
  async update(
    @Param('stockmovementId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockMovementDto,
    @Query() query?: any,
  ): Promise<StockMovement> {
    const stockmovement = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: stockmovement.id ?? '' },
    });
  }

  /**
   * Remove stockmovement
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':stockmovementId')
  async remove(@Param('stockmovementId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
