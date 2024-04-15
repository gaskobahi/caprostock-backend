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
import { TableService } from 'src/core/services/selling/table.service';
import { Table } from 'src/core/entities/selling/table.entity';
import { CreateTableDto } from 'src/core/dto/selling/create-table.dto';
import { UpdateTableDto } from 'src/core/dto/selling/update-table.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('table')
@Controller('table')
export class TableController {
  constructor(private service: TableService) {}

  /**
   * Get paginated table list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Table)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Table>> {
    /* Permission check
      await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Table,
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
   * Get table by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':tableId')
  async findOne(
    @Param('tableId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Table> {
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
   * Create table
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateTableDto,
    @Query() query?: any,
  ): Promise<Table> {
    const table = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: table.id },
    });
  }

  /**
   * Update table
   */
  @ApiSearchOneQueryFilter()
  @Patch(':tableId')
  async update(
    @Param('tableId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTableDto,
    @Query() query?: any,
  ): Promise<Table> {
    const table = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: table.id ?? '' },
    });
  }

  /**
   * Remove table
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':tableId')
  async remove(@Param('tableId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
