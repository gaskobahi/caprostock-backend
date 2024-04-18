import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { AuthUserData } from '../../classes/auth-user.data';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { User } from '../../entities/user/user.entity';
import { CreateUserDto } from '../../dto/user/create-user.dto';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { REQUEST } from '@nestjs/core';
import { UpdateUserDto } from '../../dto/user/update-user.dto';
import { isEmpty } from 'lodash';
import {
  existsConstraint,
  isUniqueConstraint,
  PaginatedService,
} from '@app/typeorm';
import { Role } from '../../entities/user/role.entity';
import { AbstractService } from '../abstract.service';
import { Pin } from 'src/core/entities/user/pin.entity';
import { PinService } from './pin.service';
import { MailerSenderService } from 'src/mailer/services/mailer.service';
import { Branch } from 'src/core/entities/subsidiary/branch.entity';

@Injectable()
export class UserService extends AbstractService<User> {
  public NOT_FOUND_MESSAGE = `Utilisateur non trouvé`;

  constructor(
    @InjectRepository(User) private _repository: Repository<User>,
    protected paginatedService: PaginatedService<User>,
    protected pinService: PinService,
    protected mailerService: MailerSenderService,

    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<User> {
    return this._repository;
  }

  async authenticate(username: string, password: string): Promise<AuthUser> {
    const user = await this._repository.findOne({
      relations: { role: true, branchToUsers: true },
      where: { username: username },
    });

    const errMessage = `Nom d'utilisateur ou mot de passe incorrect`;

    if (!user) {
      throw new UnauthorizedException([{ username: [errMessage] }], errMessage);
    }

    if (!(await user.checkPassword(password))) {
      throw new UnauthorizedException([{ username: [errMessage] }], errMessage);
    }

    return this.toAuthUser(user);
  }

  async createRecord(dto: CreateUserDto): Promise<User> {
    // Check exists roleId
    if (dto.roleId) {
      await existsConstraint(
        'roleId',
        Role,
        { id: dto.roleId },
        { message: `Le rôle sélectionné n'existe pas` },
      );
    }
    // Check exists branchId
    if (dto?.branchToUsers.length > 0) {
      console.log('tek', dto.branchToUsers);
      for (const el of dto.branchToUsers) {
        await existsConstraint(
          'branchId',
          Branch,
          { id: el.branchId },
          { message: `La succursale sélectionnée n'existe pas` },
        );
      }
    }
    // Check unique username
    if (dto.username) {
      await isUniqueConstraint(
        'username',
        User,
        { username: dto.username },
        {
          message: `Le nom d'utilisateur "${dto.username}" de l'utilisateur est déjà utilisé`,
        },
      );
    }
    // Check exists email
    if (dto.email) {
      await isUniqueConstraint(
        'email',
        User,
        { email: dto.email },
        { message: `L'email est déjà utilisé` },
      );
    }
    // Invite user to acces backoffice
    if (dto.isInviteToBo) {
      /* const { email } = dto;
      let subject='Creation de mot de passe';
      let template= 'welcome';
      const newpassword=this.generateRandomPassword(8)
      console.log('newpassword')
      console.log(newpassword)
      let ctx= {
        username: 'BAHI BORIS', 
        password:newpassword// Replace this with the actual username dynamically fetched from your application
        // Other data you want to pass to the template
      };*/

      if (!dto.email) {
        throw new BadRequestException(
          `Email est obligatoire pour l'envoi de mail`,
        );
      }
      if (this.validateEmail(dto.email)) {
        //await this.mailerService.sendEmail(email, subject,template,ctx);
        const newpassword = await this.sendNewPasswordToEmail(dto);
        dto.newPassword = newpassword;
      } else {
        dto.isInviteToBo = false;
      }
    }

    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    let pin: Pin;
    if (dto?.pin) {
      pin = await this.pinService.createRecord(dto.pin);
    }

    const user = this._repository.create(dto);

    user.pin = pin;

    user.isActive = true;
    user.roleId = dto.roleId;
    user.createdById = authUser?.id;
    user.updatedById = authUser?.id;

    if (!isEmpty(dto.newPassword)) {
      await user.setNewPassword(dto.newPassword);
    }

    return await super.createRecord({
      ...user,
      isActive: true,
      roleId: dto.roleId,
    });
  }

  async updateRecord(optionsWhere: FindOptionsWhere<User>, dto: UpdateUserDto) {
    // Check exists roleId
    if (dto.roleId) {
      await existsConstraint(
        'roleId',
        Role,
        { id: dto.roleId },
        { message: `Le rôle sélectionné n'existe pas` },
      );
    }
    console.log('P101131', dto?.branchToUsers);

    // Check exists branchId
   if (dto?.branchToUsers.length > 0) {
      for (const el of dto.branchToUsers) {
        await existsConstraint(
          'branchId',
          Branch,
          { id: el.branchId },
          { message: `La succursale sélectionnée n'existe pas` },
        );
      }
    }

    if (dto.username) {
      // Check unique username
      await isUniqueConstraint(
        'username',
        User,
        {
          username: dto.username,
          id: Not(optionsWhere.id),
        },
        {
          message: `Le nom d'utilisateur "${dto.username}" de l'utilisateur est déjà utilisé`,
        },
      );
    }

    let user = await this._repository.findOneBy(optionsWhere);

    if (!user) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }

    // Update the user's pin
    if (dto.pin) {
      // If the user already has a pin, update it
      if (user.pinId) {
        await this.pinService.updateRecord({ id: user.pinId }, dto.pin);
      } else {
        // If the user doesn't have a pin, create a new one and associate it
        const newpin = await this.pinService.createRecord(dto.pin);
        dto.pin = newpin;
      }
    }

    //invite user to backoffice

    if (dto.isInviteToBo) {
      if (!user.isInviteToBo) {
        if (!dto.email) {
          throw new BadRequestException(
            `Email est obligatoire pour l'envoi de mail`,
          );
        }
        if (!this.validateEmail(dto.email)) {
          /*const isValid=await this.isValidDomain(dto.email);
            if(!isValid){
              dto.isInviteToBo=false;
            }*/
          dto.isInviteToBo = false;
        } else {
          const newpassword = await this.sendNewPasswordToEmail(dto);
          dto.newPassword = newpassword;
        }
      }
    }

    user = await super.updateRecord(optionsWhere, {
      ...dto,
      roleId: dto.roleId ?? user.roleId,
    });

    if (!isEmpty(dto.newPassword)) {
      await user.setNewPassword(dto.newPassword);
      user = await this.repository.save(user);
    }
    return user;
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<User>) {
    const user = await this.repository.findOneBy({ id: optionsWhere?.id });
    if (!user) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const resp = await super.deleteRecord(optionsWhere);
    if (resp) {
      await this.pinService.deleteRecord({
        id: user.pinId ?? '',
      });
    }
    return resp;
  }

  async setNewPassword(user: User, oldPassword: string, newPassword: string) {
    // Check user current password
    if (!(await user.checkPassword(oldPassword))) {
      throw new BadRequestException(
        [
          {
            password: [`Mot de passe actuel incorrect`],
          },
        ],
        `Mot de passe actuel invalide`,
      );
    }

    // Set user password
    await user.setNewPassword(newPassword);
    return await this._repository.save(user);
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<User>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        // branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  validateEmail(email: string) {
    const re = /\S+@\S+\.\S+/;
    return re.test(String(email).toLowerCase());
  }

  toAuthUser(user: User): AuthUser {
    const authUser = new AuthUser();
    authUser.username = user.username;
    authUser.userId = user.id;
    authUser.user = user;
    authUser.branchId = user.branchToUsers[0].branchId;
    authUser.branch = user.branchToUsers[0].branch;
    authUser.targetBranchId = user.branchToUsers[0].branchId;
    authUser.targetBranch = user.branchToUsers[0].branch;
    authUser.roleId = user.roleId;
    authUser.role = user.role;
    authUser.applicationId = 'posgpt-app';
    authUser.userData = {
      id: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      branchId: user.branchToUsers[0].branchId,
      roleId: user.role?.id,
    } as AuthUserData;

    return authUser;
  }

  protected async sendNewPasswordToEmail(dto: any): Promise<string> {
    const { email, username } = dto;
    const subject = 'Paramètres de connexion';
    const template = 'welcome';
    const newpassword = this.generateRandomPassword(8);
    const ctx = {
      username: username,
      password: newpassword,
    };
    await this.mailerService.sendEmail(email, subject, template, ctx);
    return newpassword;
  }
}
