import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthLog } from 'src/core/entities/session/auth-log.entity';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { AuthUserService } from 'src/core/services/session/auth-user.service';
import { UserService } from 'src/core/services/user/user.service';
import { JwtPayload } from '../classes/jwt-payload';
import { LoginConfirmResponseData } from '../classes/login-confirm-response.data';
import {
  REQUEST_AUTH_LOG_KEY,
  REQUEST_AUTH_USER_KEY,
  REQUEST_APP_KEY,
} from '../definitions/constants';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { Application } from 'src/core/entities/session/application.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(REQUEST)
    private request: Request,
    private configService: ConfigService,
    private jwtService: JwtService,
    private authUserService: AuthUserService,
    private userService: UserService,
  ) {}

  async getCurrentUser(id?: string) {
    return this.authUserService.getSession(id);
  }

  /**
   * Validate user for Passport local strategy login
   *
   * @param username
   * @param password
   * @return AuthUser
   */
  async validateUser(username: string, password: string): Promise<AuthUser> {
    const authLog = this.request[REQUEST_AUTH_LOG_KEY] as AuthLog;
    const application = this.request[REQUEST_APP_KEY] as Application;
    // Check authLog status
    await this.checkAuthLog(authLog);

    const authUser: AuthUser = await this.userService.authenticate(
      username,
      password,
    );
    if (authUser) {
      authUser.isActive = true;
      authUser.applicationId = application?.id;
      authUser.authLogId = authLog?.id;
      authUser.authLog = authLog;
      authUser.lastAccessDate = new Date();
      authUser.userAgent = this.request.useragent;
      authUser.ipAddress = this.request.ip;

      // Check user status
      await this.checkAuthUser(authUser);
    }
    return authUser;
  }

  /**
   * Confirm user authentication session
   */
  async confirmLogin(loggedUser: AuthUser): Promise<LoginConfirmResponseData> {
    const authLog = this.request[REQUEST_AUTH_LOG_KEY] as AuthLog;
    let authUser =
      loggedUser || (this.request[REQUEST_AUTH_USER_KEY] as AuthUser);
    const application = this.request[REQUEST_APP_KEY] as Application;

    // Create authUser
    authUser = await authUser.save();

    // Update authUser
    authUser.updatedById = authUser.id;
    authUser = await authUser.save();

    // Reload auth user data
    authUser = await this.getCurrentUser(authUser.id);

    // Update request auth data
    this.request[REQUEST_AUTH_LOG_KEY] = authLog;
    this.request[REQUEST_AUTH_USER_KEY] = authUser;

    // Create auth JWT
    const jwtPayload: JwtPayload = {
      jti: authUser.id,
      sub: authUser.id,
      username: authUser.username,
      aud: authLog.id,
      iat: Date.now(),
      exp:
        Date.now() + this.configService.get<number>('jwt.session_expires_in'),
      ip: this.request.ip,
      iss: application?.id,
      useragent: this.request.useragent,
      userData: authUser.userData,
    };

    const token = this.jwtService.sign(jwtPayload);

    // Update last authentication
    authUser.user.lastAccessId = authUser.id;
    await authUser.user.save();

    return {
      session: authUser,
      abilities: await authUser.getAbililyRules(),
      token: token,
    };
  }

  /**
   * Log out authencated user
   */
  async logout(authUser?: AuthUser): Promise<AuthUser> {
    const loggedAuthUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    authUser = authUser || loggedAuthUser;

    if (authUser?.hasId()) {
      authUser.isActive = false;
      authUser.logoutAt = new Date();
      authUser.logoutById = loggedAuthUser.id;

      return await authUser.save();
    }
    return null;
  }

  /**
   * Change session user password
   */
  async changePassword(dto: ChangePasswordDto): Promise<AuthUser> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException(
        [
          {
            password: [`Mot de passe de confirmation incorrect`],
          },
        ],
        `Mot de passe de confirmation invalide`,
      );
    }

    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    if (!authUser) {
      throw new UnauthorizedException(`Session introuvable`);
    }
    if (!authUser.user) {
      throw new UnauthorizedException(`Compte utilisateur introuvable`);
    }

    authUser.user = await this.userService.setNewPassword(
      authUser.user,
      dto.currentPassword,
      dto.password,
    );

    return await this.logout();
  }

  async switchToBranch(branchId: string) {
    const authUser = await this.authUserService.switchTargetBranch(branchId);
    this.request[REQUEST_AUTH_USER_KEY] = authUser;
    return authUser;
  }

  async updateSessionLastAccess(session?: AuthUser): Promise<AuthUser> {
    const authUser =
      session ?? (this.request[REQUEST_AUTH_USER_KEY] as AuthUser);
    if (authUser) {
      authUser.lastAccessDate = new Date();
      return await authUser.save();
    }
    return null;
  }

  async checkInactiveSessionTTL(authUser: AuthUser) {
    if (authUser) {
      const inactiveExpiresIn =
        authUser.lastAccessDate.getTime() +
        this.configService.get<number>('jwt.inactive_session_ttl');
      if (inactiveExpiresIn < Date.now()) {
        await this.logout();
        throw new UnauthorizedException(`Votre session a expiré`);
      }
    }
  }

  async checkAuthUser(authUser: AuthUser) {
    if (!authUser.isActive) {
      throw new UnauthorizedException(`Session inactive`);
    }
    if (!authUser.user?.isActive) {
      throw new UnauthorizedException(`Compte inactif`);
    }
    // Company status check
    /*if (!authUser.branch?.isActive) {
      throw new UnauthorizedException(
        `La succursale de ce compte utilisateur n'est plus actif`,
      );
    }*/
  }

  async checkAuthLog(authLog: AuthLog) {
    if (authLog.isDenied) {
      throw new UnauthorizedException(
        `Requête d'authentification non autorisée.`,
      );
    }
  }
}
