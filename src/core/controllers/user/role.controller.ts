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
import { Role } from '../../entities/user/role.entity';
import { RoleService } from '../../services/user/role.service';
import { CreateRoleDto } from '../../dto/user/create-role.dto';
import { UpdateRoleDto } from '../../dto/user/update-role.dto';
import { FindManyOptions } from 'typeorm';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(private service: RoleService) {}

  /**
   * Get paginated role list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Role)
  @Get()
  async findAll(@Query() query?: any): Promise<Paginated<Role>> {
    const options: FindManyOptions = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['name', 'displayName'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get one role by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':roleId')
  async findOne(
    @Param('roleId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Role> {
    const params: ApiSearchOneParamOptions = query as ApiSearchOneParamOptions;
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      params,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });
  }

  /**
   * Create role
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateRoleDto,
    @Query() query?: any,
  ): Promise<Role> {
    const role = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: role.id },
    });
  }

  /**
   * Update role
   */
  @ApiSearchOneQueryFilter()
  @Patch(':roleId')
  async update(
    @Param('roleId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @Query() query?: any,
  ): Promise<Role> {
    const role = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: role.id },
    });
  }

  /**
   * Remove role
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':roleId')
  async remove(@Param('roleId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
