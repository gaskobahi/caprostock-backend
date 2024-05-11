import { Injectable } from '@nestjs/common';
import { Role } from '../../entities/user/role.entity';
import {
  getDefaultBranches,
  getDefaultAccesss,
  getDefaultRoles,
  getDefaultUsers,
  getDefaultFeatures,
} from 'src/common';
import { Branch } from '../../entities/subsidiary/branch.entity';
import { User } from '../../entities/user/user.entity';
import { isEmpty } from 'lodash';
import { Access } from 'src/core/entities/user/access.entity';
import { AccessTypeEnum } from 'src/core/definitions/enums';
import { Feature } from 'src/core/entities/setting/feature.entity';
import { Dining } from 'src/core/entities/setting/dining.entity';
import { getDefaultDinings } from 'src/common/data/dining.json';
import { BranchToDining } from 'src/core/entities/subsidiary/branch-to-dining.entity';
import { Loyalty } from 'src/core/entities/setting/loyalty.entity';
import { getDefaultLoyalty } from 'src/common/data/loyalty.json';
import { Setting } from 'src/core/entities/setting/setting.entity';
import { getDefaultSettings } from 'src/common/data/setting.json';
import { Reason } from 'src/core/entities/stockmanagement/reason.entity';
import { getDefaultReasons } from 'src/common/data/reason.json';

@Injectable()
export class DefaultDataService {
  async createDefaultData() {
    const settings = await this.createSettingsDefaultData();
    const features = await this.createFeaturesDefaultData();
    const branches = await this.createBranchesDefaultData();
    const acccess = await this.createAccessDefaultData();
    const roles = await this.createRolesDefaultData();
    const users = await this.createUsersDefaultData();
    const dinings = await this.createDiningsDefaultData();
    const loyalties = await this.createLoyaltyDefaultData();
    const reasons = await this.createReasonsDefaultData();
    return {
      features: features.length,
      branches: branches.length,
      dinings: dinings.length,
      loyalties: loyalties.length,
      acccess: acccess.length,
      roles: roles.length,
      users: users.length,
      settings: settings.length,
      reasons: reasons.length,
    };
  }

  async createBranchesDefaultData(): Promise<Branch[]> {
    const defaultBranches = getDefaultBranches();
    const branches: Branch[] = [];
    let exists: number;
    for (const dto of defaultBranches) {
      exists = await Branch.countBy({ displayName: dto.displayName });
      if (exists <= 0) {
        branches.push(await Branch.save(dto as Branch));
      }
    }
    return branches;
  }

  async createDiningsDefaultData(): Promise<Dining[]> {
    const defaultDinings = getDefaultDinings();
    const dinings: Dining[] = [];
    let exists: number;
    const listBranches = await Branch.find();
    for (const dto of defaultDinings) {
      exists = await Dining.countBy({ displayName: dto.displayName });
      if (exists <= 0) {
        const _dining = await Dining.save(dto as Dining);
        if (_dining) {
          for (const br of listBranches) {
            const _eexists = await BranchToDining.countBy({
              diningId: _dining.id,
              branchId: br.id,
            });
            if (_eexists <= 0) {
              let isDefault = false;
              if (_dining.displayName == process.env.DEFAULTDINING) {
                isDefault = true;
              }
              await BranchToDining.save({
                diningId: _dining.id,
                branchId: br.id,
                isAvailable: true,
                isDefault: isDefault,
              });
            }
          }
        }
        dinings.push(_dining);
      }
    }
    return dinings;
  }

  async createLoyaltyDefaultData(): Promise<Loyalty[]> {
    const defaultLoyalty = getDefaultLoyalty();
    const loyalty: Loyalty[] = [];
    let exists: number;
    for (const dto of defaultLoyalty) {
      exists = await Loyalty.countBy({ uniqueName: dto.uniqueName });
      if (exists <= 0) {
        const _loyalty = await Loyalty.save(dto as Loyalty);
        loyalty.push(_loyalty);
      }
    }
    return loyalty;
  }

  async createFeaturesDefaultData(): Promise<Feature[]> {
    const defaultFeatures = getDefaultFeatures();
    const features: Feature[] = [];
    let exists: number;
    for (const dto of defaultFeatures) {
      exists = await Feature.countBy({
        displayName: dto.displayName,
        pseudoName: dto.pseudoName,
        description: dto.description,
      });
      if (exists <= 0) {
        features.push(await Feature.save(dto as Feature));
      }
    }
    return features;
  }

  async createSettingsDefaultData(): Promise<Setting[]> {
    const defaultSettings = getDefaultSettings();
    const settings: Setting[] = [];
    let exists: number;
    for (const dto of defaultSettings) {
      exists = await Setting.countBy({
        name: dto.name,
        displayName: dto.displayName,
        type: dto.type,
        position: dto.position,
      });
      if (exists <= 0) {
        settings.push(await Setting.save(dto as Setting));
      }
    }
    return settings;
  }

  async createReasonsDefaultData(): Promise<Reason[]> {
    const defaultReasons = getDefaultReasons();
    const reasons: Reason[] = [];
    let exists: number;
    for (const dto of defaultReasons) {
      exists = await Reason.countBy({
        name: dto.name,
        displayName: dto.displayName,
        position: dto.position,
      });
      if (exists <= 0) {
        reasons.push(await Reason.save(dto as Reason));
      }
    }
    return reasons;
  }

  private async createAccessDefaultData(): Promise<Access[]> {
    const defaultAccess = getDefaultAccesss();
    const access: Access[] = [];
    let exists: number;
    for (const dto of defaultAccess) {
      exists = await Access.countBy({ name: dto.name });
      if (exists <= 0) {
        access.push(await Access.save(dto as Access));
      }
    }
    return access;
  }

  private async createRolesDefaultData(): Promise<Role[]> {
    const defaultRoles = getDefaultRoles();
    const roles: Role[] = [];
    let exists: number;

    const ownerAccess = await Access.findBy({ name: AccessTypeEnum.owner });
    const managerAccess = await Access.findBy({ name: AccessTypeEnum.manager });
    const sellerAccess = await Access.findBy({ name: AccessTypeEnum.seller });

    if (ownerAccess.length <= 0) {
      return [];
    }
    if (managerAccess.length <= 0) {
      return [];
    }
    if (sellerAccess.length <= 0) {
      return [];
    }
    for (const dto of defaultRoles) {
      let modifiedDto: any;
      if (dto.name == AccessTypeEnum.owner) {
        modifiedDto = {
          ...dto,
          accessToRoles: [
            {
              accessId: ownerAccess[0].id,
              accessType: AccessTypeEnum.owner,
              permissions: ownerAccess[0]?.permissions ?? {},
            },
          ],
        };
      }
      if (dto.name == AccessTypeEnum.manager) {
        if (managerAccess) {
          modifiedDto = {
            ...dto,
            accessToRoles: [
              {
                accessId: managerAccess[0].id,
                accessType: AccessTypeEnum.manager,
                permissions: managerAccess[0]?.permissions ?? {},
              },
            ],
          };
        }
      }

      if (dto.name == AccessTypeEnum.seller) {
        if (sellerAccess) {
          modifiedDto = {
            ...dto,
            accessToRoles: [
              {
                accessId: sellerAccess[0].id,
                accessType: AccessTypeEnum.seller,
                permissions: sellerAccess[0].permissions ?? {},
              },
            ],
          };
        }
      }
      if (dto.name == 'admin') {
        modifiedDto = dto;
      }

      exists = await Role.countBy({ name: dto.name });
      if (exists <= 0) {
        roles.push(await Role.save(modifiedDto as Role));
      }
    }

    return roles;
  }

  private async createUsersDefaultData(): Promise<User[]> {
    const defaultUsers = getDefaultUsers();
    let exists: number;
    const branches = await Branch.findBy({});
    const roles = await Role.findBy({ name: AccessTypeEnum.owner });
    const users: User[] = await User.findBy({});
    if (users.length > 0 || branches.length <= 0 || roles.length <= 0) {
      return [];
    }
    let user: User;
    for (const dto of defaultUsers) {
      exists = await User.countBy({ username: dto.username });
      if (exists <= 0) {
        user = User.create(dto);
        if (!isEmpty(dto.newPassword)) {
          await user.setNewPassword(dto.newPassword);
        }
        users.push(
          await User.save({
            ...user,
            branchToUsers: [{ branchId: branches[0].id }],
            roleId: roles[0].id,
          }),
        );
      }
    }
    return users;
  }
}
