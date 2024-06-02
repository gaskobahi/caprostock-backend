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
import { BranchService } from '../../services/subsidiary/branch.service';
import { Branch } from '../../entities/subsidiary/branch.entity';
import { UserService } from '../../services/user/user.service';
import { CreateBranchDto } from '../../dto/subsidiary/create-branch.dto';
import { UpdateBranchDto } from '../../dto/subsidiary/update-branch.dto';
import { BranchToProductService } from '../../services/subsidiary/branch-to-product.service';
import { BranchToProduct } from '../../entities/subsidiary/branch-to-product.entity';
import { Order } from '../../entities/stockmanagement/order.entity';
//import { OrderService } from '../../services/supply/order.service';
//import { SaleService } from '../../services/selling/sale.service';
//import { Sale } from '../../entities/selling/sale.entity';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('branch')
@Controller('branch')
export class BranchController {
  constructor(
    private service: BranchService,
    private userService: UserService,
    private branchToProductService: BranchToProductService,
    //private orderService: OrderService,
    //private saleService: SaleService,
  ) {}

  /**
   * Get paginated branch list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Branch)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Branch>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Branch,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName', 'email', 'phoneNumber', 'city'],
      },
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get paginated branch list for select
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Branch)
  @Get('/list/select')
  async findPaginatedForSelect(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Branch>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Branch,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName', 'email', 'phoneNumber', 'city'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get one branch by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':branchId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('branchId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Branch> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    const branch = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, branch);

    return branch;
  }

  /**
   * Create branch
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateBranchDto,
    @Query() query?: any,
  ): Promise<Branch> {
    const branch = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: branch.id },
    });
  }

  /**
   * Update branch
   */
  @ApiSearchOneQueryFilter()
  @Patch(':branchId')
  async update(
    @Param('branchId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @Query() query?: any,
  ): Promise<Branch> {
    const branch = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: branch.id },
    });
  }

  /**
   * Remove branch
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':branchId')
  async remove(@Param('branchId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }

  /**
   * Get paginated branch users
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(User)
  @Get(':branchId/user')
  async findUsers(
    @CurrentUser() authUser: AuthUser,
    @Param('branchId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Paginated<User>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.User,
    );

    /*const branch = await this.service.readOneRecord({
      where: { id: id ?? '' },
    });*/

    const options = buildFilterFromApiSearchParams(
      this.userService.repository,
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

    return this.userService.readPaginatedListRecord({
      ...options,
      where: {
        ...options?.where,
        //branchId: branch.id || '',
      },
    });
  }

  /**
   * Get paginated branch products
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(BranchToProduct)
  @Get(':branchId/product')
  async findProducts(
    @CurrentUser() authUser: AuthUser,
    @Param('branchId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Paginated<BranchToProduct>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.User,
    );

    const branch = await this.service.readOneRecord({
      where: { id: id ?? '' },
    });

    const options = buildFilterFromApiSearchParams(
      this.branchToProductService.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['product.reference', 'product.displayName'],
      },
    );

    return this.branchToProductService.readPaginatedListRecord({
      ...options,
      where: {
        ...options?.where,
        branchId: branch.id || '',
      },
    });
  }

  /**
   * Get paginated branch orders
   */
 /* @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Order)
  @Get(':branchId/order')
  async findOrders(
    @CurrentUser() authUser: AuthUser,
    @Param('branchId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Paginated<Order>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Order,
    );

    const branch = await this.service.readOneRecord({
      where: { id: id ?? '' },
    });

   const options = buildFilterFromApiSearchParams(
      this.orderService.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference', 'title'],
      },
    );

    return this.orderService.readPaginatedListRecord({
      ...options,
      where: {
        ...options?.where,
        branchId: branch.id || '',
      },
    });
  }*/

  /**
   * Get paginated branch sales
   */
 /* @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Sale)
  @Get(':branchId/sale')
  async findSales(
    @CurrentUser() authUser: AuthUser,
    @Param('branchId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Paginated<Sale>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Sale,
    );

    const branch = await this.service.readOneRecord({
      where: { id: id ?? '' },
    });

   /* const options = buildFilterFromApiSearchParams(
      this.saleService.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference'],
      },
    );*/

    /*return this.saleService.readPaginatedListRecord({
      ...options,
      where: {
        ...options?.where,
        branchId: branch.id || '',
      },
    });
  }*/
}
