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
import { InventoryCount } from 'src/core/entities/stockmanagement/inventorycount.entity';
import { CreateInventoryCountDto } from 'src/core/dto/stockmanagement/create-inventory-count.dto';
import { UpdateInventoryCountDto } from 'src/core/dto/stockmanagement/update-inventory-count.dto';
import { InventoryCountService } from 'src/core/services/stockmanagement/inventory-count.service';
import { UpdateInventoryCountSaveDto } from 'src/core/dto/stockmanagement/update-inventory-count-save.dto';
import {
  AbilityActionEnum,
  AbilitySubjectEnum,
} from 'src/core/definitions/enums';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('inventoryCount')
@Controller('inventorycount')
export class InventoryCountController {
  constructor(private service: InventoryCountService) {}

  /**
   * Get paginated inventoryCount list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(InventoryCount)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<InventoryCount>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Inventory,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference'],
      },
    );
    console.log('ytyytytyt', options);
    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get inventoryCount by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':inventorycountId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('inventorycountId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<InventoryCount> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    const inventory = this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Inventory,
    );

    return inventory;
  }

  /**
   * Create inventoryCount
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateInventoryCountDto,
    @Query() query?: any,
  ): Promise<InventoryCount> {
    const inventoryCount = await this.service.createRecord(dto);
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: inventoryCount.id },
    });
  }

  /**
   * Update inventoryCount
   */
  @ApiSearchOneQueryFilter()
  @Patch('/save/:inventorycountId')
  async updateSave(
    @Param('inventorycountId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryCountSaveDto,
    @Query() query?: any,
  ): Promise<InventoryCount> {
    const inventoryCount = await this.service.updateRecordCountSave(
      { id: id ?? '' },
      dto,
    );
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: inventoryCount.id ?? '' },
    });
  }

  @ApiSearchOneQueryFilter()
  @Patch(':inventorycountId')
  async update(
    @Param('inventorycountId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryCountDto,
    @Query() query?: any,
  ): Promise<InventoryCount> {
    const inventoryCount = await this.service.updateRecord(
      { id: id ?? '' },
      dto,
    );
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: inventoryCount.id ?? '' },
    });
  }

  /**
   * Remove inventoryCount
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':inventorycountId')
  async remove(@Param('inventoryCountId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
