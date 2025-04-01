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
import { EquipmentTypeService } from 'src/core/services/setting/equipment-type.service';
import { EquipmentType } from 'src/core/entities/setting/equipment-type.entity';
import { UserService } from 'src/core/services/user/user.service';
import { UpdateEquipmentTypeDto } from 'src/core/dto/setting/update-equipment-type.dto';
import { CreateEquipmentTypeDto } from 'src/core/dto/setting/create-equipment-type.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('equipmenttype')
@Controller('equipmenttype')
export class EquipmentTypeController {
  constructor(
    private service: EquipmentTypeService,
    private userService: UserService,
  ) {}

  /**
   * Get paginated equipmenttype list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(EquipmentType)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<EquipmentType>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.EquipmentType,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    // Apply auth user equipmenttype filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserEquipmentType(),
    );*/

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get paginated equipmenttype list for select

  /**
   * Get one equipmenttype by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':equipmenttypeId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('equipmenttypeId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<EquipmentType> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    const equipmenttype = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, equipmenttype);

    return equipmenttype;
  }

  /**
   * Create equipmenttype
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateEquipmentTypeDto,
    @Query() query?: any,
  ): Promise<EquipmentType> {
    const equipmenttype = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: equipmenttype.id },
    });
  }

  /**
   * Update equipmenttype
   */
  @ApiSearchOneQueryFilter()
  @Patch(':equipmenttypeId')
  async update(
    @Param('equipmenttypeId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentTypeDto,
    @Query() query?: any,
  ): Promise<EquipmentType> {
    const equipmenttype = await this.service.updateRecord(
      { id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: equipmenttype.id },
    });
  }

  /**
   * Remove equipmenttype
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':equipmenttypeId')
  async remove(@Param('equipmenttypeId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
