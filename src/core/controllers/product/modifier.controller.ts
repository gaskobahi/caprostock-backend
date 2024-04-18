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
import { merge } from 'lodash';
import { ApiAuthJwtHeader } from 'src/modules/auth/decorators/api-auth-jwt-header.decorator';
import { ApiRequestIssuerHeader } from 'src/modules/auth/decorators/api-request-issuer-header.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { ModifierService } from '../../services/product/modifier.service';
import { Modifier } from '../../entities/product/modifier.entity';
import { CreateModifierDto } from 'src/core/dto/product/create-modifier.dto';
import { UpdateModifierDto } from 'src/core/dto/product/update-modifier.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('modifier')
@Controller('modifier')
export class ModifierController {
  constructor(private service: ModifierService) {}

  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Modifier)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Modifier>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Modifier,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    return this.service.readPaginatedListRecord(options);
  }

  @ApiSearchOneQueryFilter()
  @Get(':modifierId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('modifierId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Modifier> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    const modifier = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, modifier);

    return modifier;
  }


  /**
   * Create modifier
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateModifierDto,
    @Query() queryParams?: any,
  ): Promise<Modifier> {
    const modifier = await this.service.createRecord(dto);
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      queryParams as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: modifier.id },
    });
  }

  /**
   * Update modifier
   */
  @ApiSearchOneQueryFilter()
  @Patch(':modifierId')
  async update(
    @Param('modifierId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModifierDto,
    @Query() query?: any,
  ): Promise<Modifier> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();
    const modifier = await this.service.updateRecord(
      { ...filter, id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: modifier.id ?? '' },
    });
  }

  /**
   * Remove modifier
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':modifierId')
  async remove(@Param('modifierId', ParseUUIDPipe) id: string) {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ ...filter, id: id ?? '' });
    return;
  }
}
