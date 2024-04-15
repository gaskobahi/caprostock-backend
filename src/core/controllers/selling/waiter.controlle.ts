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
import { WaiterService } from '../../services/selling/waiter.service';
import { Waiter } from '../../entities/selling/waiter.entity';
import { CreateWaiterDto } from '../../dto/selling/create-waiter.dto';
import { UpdateWaiterDto } from '../../dto/selling/update-waiter.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('waiter')
@Controller('waiter')
export class WaiterController {
  constructor(private service: WaiterService) {}

  /**
   * Get paginated waiter list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Waiter)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Waiter>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Waiter,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['firstName', 'lastName', 'phoneNumber', 'email'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get waiter by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':waiterId')
  async findOne(
    @Param('waiterId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Waiter> {
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
   * Create waiter
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateWaiterDto,
    @Query() query?: any,
  ): Promise<Waiter> {
    const waiter = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: waiter.id },
    });
  }

  /**
   * Update waiter
   */
  @ApiSearchOneQueryFilter()
  @Patch(':waiterId')
  async update(
    @Param('waiterId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWaiterDto,
    @Query() query?: any,
  ): Promise<Waiter> {
    const waiter = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: waiter.id ?? '' },
    });
  }

  /**
   * Remove waiter
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':waiterId')
  async remove(@Param('waiterId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
