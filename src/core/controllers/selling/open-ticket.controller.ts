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
import { OpenTicket } from 'src/core/entities/selling/open-ticket.entity';
import { CreateOpenTicketDto } from 'src/core/dto/selling/create-open-ticket.dto';
import { UpdateOpenTicketDto } from 'src/core/dto/selling/update-open-ticket.dto';
import { OpenTicketService } from 'src/core/services/selling/open-ticket.service';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('openticket')
@Controller('openticket')
export class OpenTicketController {
  constructor(private service: OpenTicketService) {}

  /**
   * Get paginated openticket list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(OpenTicket)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<OpenTicket>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.OpenTicket,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['branchId'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get openticket by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':openticketId')
  async findOne(
    @Param('openticketId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<OpenTicket> {
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
   * Create openticket
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateOpenTicketDto,
    @Query() query?: any,
  ): Promise<OpenTicket> {
    const openticket = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: openticket.id },
    });
  }

  /**
   * Update openticket
   */
  @ApiSearchOneQueryFilter()
  @Patch(':openticketId')
  async update(
    @Param('openticketId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpenTicketDto,
    @Query() query?: any,
  ): Promise<OpenTicket> {
    const openticket = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: openticket.id ?? '' },
    });
  }

  /**
   * Remove openticket
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':openticketId')
  async remove(@Param('openticketId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
