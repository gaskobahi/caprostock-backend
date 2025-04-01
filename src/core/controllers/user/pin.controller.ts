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
import { Pin } from '../../entities/user/pin.entity';
import { PinService } from '../../services/user/pin.service';
import { CreatePinDto } from '../../dto/user/create-pin.dto';
import { UpdatePinDto } from '../../dto/user/update-pin.dto';
import { FindManyOptions } from 'typeorm';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('pin')
@Controller('pin')
export class PinController {
  constructor(private service: PinService) {}

  /**
   * Get paginated pin list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Pin)
  @Get()
  async findAll(@Query() query?: any): Promise<Paginated<Pin>> {
    const options: FindManyOptions = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['name', 'displayName'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  @ApiSearchOneQueryFilter()
  @Get('generatecode')
  async generateCode() {
    return await this.service.generateCodePin();
  }
  /**
   * Get one pin by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':pinId')
  async findOne(
    @Param('pinId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Pin> {
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
   * Create pin
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(@Body() dto: CreatePinDto, @Query() query?: any): Promise<Pin> {
    const pin = await this.service.createRecord(dto);
    console.log('AZAZAZAZ', dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: pin.id },
    });
  }

  /**
   * Update pin
   */
  @ApiSearchOneQueryFilter()
  @Patch(':pinId')
  async update(
    @Param('pinId', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePinDto,
    @Query() query?: any,
  ): Promise<Pin> {
    console.log('AZAZAZAZ', dto);

    const pin = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    console.log('AZAZAZAZ', dto);

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: pin.id },
    });
  }

  /**
   * Remove pin
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':pinId')
  async remove(@Param('pinId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
