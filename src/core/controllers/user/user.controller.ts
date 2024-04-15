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
import { User } from '../../entities/user/user.entity';
import { UserService } from '../../services/user/user.service';
import { CreateUserDto } from '../../dto/user/create-user.dto';
import { UpdateUserDto } from '../../dto/user/update-user.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private service: UserService) {}

  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(User)
  @Get()
  async findAll(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<User>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.User,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: [
          'username',
          'firstName',
          'lastName',
          'phoneNumber',
          'email',
        ],
      },
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    return await this.service.readPaginatedListRecord(options);
  }

  @ApiSearchOneQueryFilter()
  @Get(':userId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('userId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<User> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    const user = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, user);

    return user;
  }

  /**
   * Create user
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @Query() query?: any,
  ): Promise<User> {
    console.log('Z100',dto)

    const user = await this.service.createRecord(dto);
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: user.id },
    });
  }

  /**
   * Update user
   */
  @ApiSearchOneQueryFilter()
  @Patch(':userId')
  async update(
    @Param('userId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Query() query?: any,
  ): Promise<User> {
    // Apply auth user branch filter
    // const filter = await this.service.getFilterByAuthUserBranch();
    /*
    const user = await this.service.updateRecord(
      { ...filter, id: id ?? '' },
      dto,
    );
    */
    const user = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: user.id },
    });

    /*return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: user.id },
    });*/
  }

  /**
   * Remove user
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':userId')
  async remove(@Param('userId', ParseUUIDPipe) id: string) {
    // Apply auth user branch filter
    //const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
