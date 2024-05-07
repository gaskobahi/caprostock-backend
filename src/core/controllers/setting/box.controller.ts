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
import { Box } from 'src/core/entities/setting/box.entity';
import { CreateBoxDto } from 'src/core/dto/setting/create-box.dto';
import { UpdateBoxDto } from 'src/core/dto/setting/update-box.dto';
import { BoxService } from 'src/core/services/setting/box.service';
import { UserService } from 'src/core/services/user/user.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('box')
@Controller('box')
export class BoxController {
  constructor(
    private service: BoxService,
    private userService: UserService,
    //private orderService: OrderService,
    //private saleService: SaleService,
  ) {}

  /**
   * Get paginated box list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Box)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Box>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Box,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    // Apply auth user box filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBox(),
    );*/

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get paginated box list for select

  /**
   * Get one box by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':boxId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('boxId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Box> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    const box = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, box);

    return box;
  }

  /**
   * Create box
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(@Body() dto: CreateBoxDto, @Query() query?: any): Promise<Box> {
    const box = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: box.id },
    });
  }

  /**
   * Update box
   */
  @ApiSearchOneQueryFilter()
  @Patch(':boxId')
  async update(
    @Param('boxId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBoxDto,
    @Query() query?: any,
  ): Promise<Box> {
    const box = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: box.id },
    });
  }

  /**
   * Remove box
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':boxId')
  async remove(@Param('boxId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
