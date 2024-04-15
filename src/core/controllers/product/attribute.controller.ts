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
import { AttributeService } from '../../services/product/attribute.service';
import { Attribute } from '../../entities/product/attribute.entity';
import { CreateAttributeDto } from '../../dto/product/create-attribute.dto';
import { UpdateAttributeDto } from '../../dto/product/update-attribute.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('attribute')
@Controller('attribute')
export class AttributeController {
  constructor(private service: AttributeService) {}

  /**
   * Get paginated attribute list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Attribute)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Attribute>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Attribute,
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
   * Get attribute by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':attributeId')
  async findOne(
    @Param('attributeId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Attribute> {
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
   * Create attribute
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateAttributeDto,
    @Query() query?: any,
  ): Promise<Attribute> {
    const attribute = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: attribute.id },
    });
  }

  /**
   * Update attribute
   */
  @ApiSearchOneQueryFilter()
  @Patch(':attributeId')
  async update(
    @Param('attributeId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttributeDto,
    @Query() query?: any,
  ): Promise<Attribute> {
    const attribute = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: attribute.id ?? '' },
    });
  }

  /**
   * Remove attribute
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':attributeId')
  async remove(@Param('attributeId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
