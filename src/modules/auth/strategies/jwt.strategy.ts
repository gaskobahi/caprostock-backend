import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { AuthService } from '../services/auth.service';
import _ from 'lodash';
import {
  AUTH_USER_JWT_HEADER,
  REQUEST_APP_KEY,
  REQUEST_AUTH_LOG_KEY,
  REQUEST_AUTH_USER_KEY,
} from '../definitions/constants';
import { JwtPayload } from '../classes/jwt-payload';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { AuthLog } from 'src/core/entities/session/auth-log.entity';
import { Application } from 'src/core/entities/session/application.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private moduleRef: ModuleRef) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader(AUTH_USER_JWT_HEADER),
      ignoreExpiration: false,
      secretOrKey:
        process.env.APP_JWT_SECRET || 'b3CRK6de2je4x455d4m94d4ce8d4ldvX6m9sd',
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: JwtPayload) {
    const contextId = ContextIdFactory.getByRequest(request);
    const authService: AuthService = await this.moduleRef.resolve(
      AuthService,
      contextId,
    );

    const application = request[REQUEST_APP_KEY] as Application;
    // Application check from JWT
    if (application?.id !== payload.iss) {
      throw new UnauthorizedException(
        `Impossible d'identifier l'application de la requête`,
      );
    }

    // Process authLog from JWT
    const authLog = await AuthLog.findOne({
      where: { id: payload.aud },
    });
    if (!authLog) {
      throw new UnauthorizedException(
        `Impossible d'identifier la requête d'authentification`,
      );
    }
    await authService.checkAuthLog(authLog);

    // Check session token
    let authUser: AuthUser;
    // Process session from JWT
    authUser = await authService.getCurrentUser(payload.sub);
    if (!authUser) {
      throw new UnauthorizedException(`Session non valide ou introuvable`);
    }

    // Update request auth data
    request = this.updateRequestAuthData(request, authLog, authUser);

    // Check token expiration
    if (Date.now() > payload.exp) {
      if (authUser.hasId()) {
        // Logout current auth user
        authUser = await authService.logout();
      } else {
        // Update isActive property
        authUser.isActive = false;
      }

      // Update request auth data
      request = this.updateRequestAuthData(request, authLog, authUser);
      throw new UnauthorizedException(`Votre session a expiré`);
    }

    // Check auth status
    await authService.checkAuthUser(authUser);

    // Check inactive token session expiration
    if (authUser?.hasId()) {
      await authService.checkInactiveSessionTTL(authUser);
    }

    // Check request user agent
    await this.checkUserAgent(request, authUser, authService);

    // Update auth token lastAccess property
    if (authUser.hasId()) {
      authUser = await authService.updateSessionLastAccess(authUser);
    } else {
      authUser.lastAccessDate = new Date();
    }

    // Update request auth data
    request = this.updateRequestAuthData(request, authLog, authUser);

    return authUser;
  }

  private async checkUserAgent(
    request: any,
    authUser: AuthUser,
    authService: AuthService,
  ) {
    const omittedFields = ['version', 'source'];
    if (
      !_.isMatch(request.useragent, _.omit(authUser.userAgent, omittedFields))
    ) {
      await authService.logout();
      throw new UnauthorizedException(
        `Impossible de vérifier la source de l'action. Vous serez déconnecté.`,
      );
    }
  }

  private updateRequestAuthData(
    request: Request,
    authLog: AuthLog,
    authUser: AuthUser,
  ): Request {
    // Add authLog to request object
    request[REQUEST_AUTH_LOG_KEY] = authLog;

    // Add authToken to request object
    request[REQUEST_AUTH_USER_KEY] = authUser;

    return request;
  }
}
