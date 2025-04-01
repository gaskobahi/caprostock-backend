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
import { Equipment } from 'src/core/entities/setting/equipment.entity';
import { CreateEquipmentDto } from 'src/core/dto/setting/create-equipment.dto';
import { UpdateEquipmentDto } from 'src/core/dto/setting/update-equipment.dto';
import { UserService } from 'src/core/services/user/user.service';
import { EquipmentService } from 'src/core/services/setting/equipment.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(
    private service: EquipmentService,
    private userService: UserService,
  ) {}

  /**
   * Get paginated equipment list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Equipment)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Equipment>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Equipment,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    // Apply auth user equipment filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserEquipment(),
    );*/

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get paginated equipment list for select

  /**
   * Get one equipment by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':equipmentId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('equipmentId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Equipment> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    const equipment = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, equipment);

    return equipment;
  }

  /**
   * Create equipment
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateEquipmentDto,
    @Query() query?: any,
  ): Promise<Equipment> {

    const equipment = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: equipment.id },
    });
  }

  /**
   * Update equipment
   */
  @ApiSearchOneQueryFilter()
  @Patch(':equipmentId')
  async update(
    @Param('equipmentId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentDto,
    @Query() query?: any,
  ): Promise<Equipment> {
    const equipment = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: equipment.id },
    });
  }

  /**
   * Remove equipment
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':equipmentId')
  async remove(@Param('equipmentId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
