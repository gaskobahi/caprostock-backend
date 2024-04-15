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
import { DoctorService } from '../../services/consultation/doctor.service';
import { Doctor } from '../../entities/consultation/doctor.entity';
import { CreateDoctorDto } from '../../dto/consultation/create-doctor.dto';
import { UpdateDoctorDto } from '../../dto/consultation/update-doctor.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('doctor')
@Controller('doctor')
export class DoctorController {
  constructor(private service: DoctorService) {}

  /**
   * Get paginated doctor list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Doctor)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Doctor>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Doctor,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: [
          'matricule',
          'firstName',
          'lastName',
          'phoneNumber',
          'email',
        ],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get doctor by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':doctorId')
  async findOne(
    @Param('doctorId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Doctor> {
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
   * Create doctor
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateDoctorDto,
    @Query() query?: any,
  ): Promise<Doctor> {
    const doctor = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: doctor.id },
    });
  }

  /**
   * Update doctor
   */
  @ApiSearchOneQueryFilter()
  @Patch(':doctorId')
  async update(
    @Param('doctorId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorDto,
    @Query() query?: any,
  ): Promise<Doctor> {
    const doctor = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: doctor.id ?? '' },
    });
  }

  /**
   * Remove doctor
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':doctorId')
  async remove(@Param('doctorId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
