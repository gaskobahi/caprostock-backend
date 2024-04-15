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
import { PatientService } from '../../services/consultation/patient.service';
import { Patient } from '../../entities/consultation/patient.entity';
import { CreatePatientDto } from '../../dto/consultation/create-patient.dto';
import { UpdatePatientDto } from '../../dto/consultation/update-patient.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('patient')
@Controller('patient')
export class PatientController {
  constructor(private service: PatientService) {}

  /**
   * Get paginated patient list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Patient)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Patient>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Patient,
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
   * Get patient by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':patientId')
  async findOne(
    @Param('patientId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Patient> {
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
   * Create patient
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreatePatientDto,
    @Query() query?: any,
  ): Promise<Patient> {
    const patient = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: patient.id },
    });
  }

  /**
   * Update patient
   */
  @ApiSearchOneQueryFilter()
  @Patch(':patientId')
  async update(
    @Param('patientId', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @Query() query?: any,
  ): Promise<Patient> {
    const patient = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: patient.id ?? '' },
    });
  }

  /**
   * Remove patient
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':patientId')
  async remove(@Param('patientId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
