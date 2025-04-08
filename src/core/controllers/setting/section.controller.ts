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
import { Section } from 'src/core/entities/setting/section.entity';
import { CreateSectionDto } from 'src/core/dto/setting/create-section.dto';
import { UpdateSectionDto } from 'src/core/dto/setting/update-section.dto';
import { UserService } from 'src/core/services/user/user.service';
import { SectionService } from 'src/core/services/setting/section.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('section')
@Controller('section')
export class SectionController {
  constructor(
    private service: SectionService,
    private userService: UserService,
  ) {}

  /**
   * Get paginated section list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Section)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Section>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Section,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    // Apply auth user section filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserSection(),
    );*/

    return this.service.readPaginatedListRecord(
      options,
      query.page,
      query.perPage,
    );
  }

  /**
   * Get paginated section list for select

  /**
   * Get one section by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':sectionId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('sectionId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Section> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    const section = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, section);

    return section;
  }

  /**
   * Create section
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateSectionDto,
    @Query() query?: any,
  ): Promise<Section> {
    const section = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: section.id },
    });
  }

  /**
   * Update section
   */
  @ApiSearchOneQueryFilter()
  @Patch(':sectionId')
  async update(
    @Param('sectionId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSectionDto,
    @Query() query?: any,
  ): Promise<Section> {
    const section = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: section.id },
    });
  }

  /**
   * Remove section
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':sectionId')
  async remove(@Param('sectionId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
