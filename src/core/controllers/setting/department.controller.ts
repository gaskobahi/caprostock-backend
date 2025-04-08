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
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { Department } from 'src/core/entities/setting/department.entity';
import { CreateDepartmentDto } from 'src/core/dto/setting/create-department.dto';
import { UpdateDepartmentDto } from 'src/core/dto/setting/update-department.dto';
import { UserService } from 'src/core/services/user/user.service';
import { DepartmentService } from 'src/core/services/setting/department.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('department')
@Controller('department')
export class DepartmentController {
  constructor(
    private service: DepartmentService,
    private userService: UserService,
  ) {}

  /**
   * Get paginated department list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Department)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Department>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Department,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    // Apply auth user department filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserDepartment(),
    );*/

    return this.service.readPaginatedListRecord(
      options,
      query.page,
      query.perPage,
    );
  }

  /**
   * Get paginated department list for select

  /**
   * Get one department by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':departmentId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('departmentId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Department> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    const department = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, department);

    return department;
  }

  /**
   * Create department
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateDepartmentDto,
    @Query() query?: any,
  ): Promise<Department> {
    const department = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: department.id },
    });
  }

  /**
   * Update department
   */
  @ApiSearchOneQueryFilter()
  @Patch(':departmentId')
  async update(
    @Param('departmentId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
    @Query() query?: any,
  ): Promise<Department> {
    const department = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: department.id },
    });
  }

  /**
   * Remove department
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':departmentId')
  async remove(@Param('departmentId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
