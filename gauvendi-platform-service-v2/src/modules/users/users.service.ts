import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { Filter } from '@src/core/dtos/common.dto';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { IdentityAccessControl } from '@src/core/entities/identity-entities/identity-access-control.entity';
import { IdentityAuth0User } from '@src/core/entities/identity-entities/identity-auth0-user.entity';
import {
  IdentityRole,
  IdentityRoleGroupEnum
} from '@src/core/entities/identity-entities/identity-role.entity';
import { IdentityUserAccessControl } from '@src/core/entities/identity-entities/identity-user-access-control.entity';
import {
  IdentityUser,
  IdentityUserStatusEnum
} from '@src/core/entities/identity-entities/identity-user.entity';
import { BadRequestException, InternalServerErrorException } from '@src/core/exceptions';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { GetListUserQueryDto } from './dtos/get-list-user-query.dto';
import { GetRoleDto } from './dtos/get-role.dto';
import {
  AssignHotelMemberDto,
  GetHotelMembersDto,
  UnassignHotelMemberDto,
  UpdateHotelMemberRoleDto
} from './dtos/hotel-member.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserDto, UserStatusEnum } from './dtos/user.dto';
import { AwsUserInput, UsersAwsService } from './services/users-aws.service';

@Injectable()
export class UsersService {
  private readonly isAwsUserEnabled: boolean = true;
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(IdentityUser, DbName.Postgres)
    private readonly identityUserRepository: Repository<IdentityUser>,
    @InjectRepository(IdentityUserAccessControl, DbName.Postgres)
    private readonly userAccessControlRepository: Repository<IdentityUserAccessControl>,
    @InjectRepository(IdentityAccessControl, DbName.Postgres)
    private readonly accessControlRepository: Repository<IdentityAccessControl>,
    @InjectRepository(IdentityRole, DbName.Postgres)
    private readonly roleRepository: Repository<IdentityRole>,
    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(IdentityAuth0User, DbName.Postgres)
    private readonly identityAuth0UserRepository: Repository<IdentityAuth0User>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly usersAwsService: UsersAwsService,
    private readonly configService: ConfigService
  ) {
    this.isAwsUserEnabled = this.configService.get(ENVIRONMENT.IS_AWS_USER_ENABLED) != 'false';
  }

  async getUserPermission(providerUserId: string) {
    const identityAuth0User = await this.identityAuth0UserRepository.findOne({
      where: { auth0UserId: providerUserId, deletedAt: IsNull() }
    });

    if (!identityAuth0User) {
      throw new Error('Identity Auth0 user not found');
    }

    const user = await this.identityUserRepository.findOne({
      where: { id: identityAuth0User.userId || '' }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userWithPermissions = await this.getCurrentUser(providerUserId);

    return {
      id: user.id,
      emailAddress: user.emailAddress,
      username: user.username,
      organisationId: user.organisationId,
      fullName: this.buildFullName(user.firstName, user.lastName),
      hotelId: user.hotelId,
      permissions: userWithPermissions?.propertyPermissionList?.[0]?.permissionCodes,
      firstName: user.firstName,
      lastName: user.lastName,
      status: this.mapUserStatus(user.status)
    };
  }

  async getRoles(filter: GetRoleDto) {
    const { groupList } = filter;
    const roles = await this.roleRepository.find({
      where: {
        group: groupList && groupList.length > 0 ? In(groupList) : undefined,
        deletedAt: IsNull()
      }
    });
    return roles;
  }

  async getCurrentUser(auth0Id: string) {
    const identityAuth0User = await this.identityAuth0UserRepository.findOne({
      where: { auth0UserId: auth0Id, deletedAt: IsNull() }
    });

    if (!identityAuth0User?.userId) {
      throw new Error('Identity Auth0 user not found');
    }
    // Get user with all necessary relations
    const user = await this.identityUserRepository.findOne({
      where: { id: identityAuth0User.userId, deletedAt: IsNull() },
      relations: [
        'userAccessControls',
        'userAccessControls.accessControl',
        'userAccessControls.accessControl.role',
        'userAccessControls.accessControl.hotel'
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }
    // If user has no access controls, return basic user info
    if (!user.userAccessControls || user.userAccessControls.length === 0) {
      return this.buildBasicUser(user);
    }
    // In case of GLOBAL_ADMIN, return all hotels and permissions
    const globalAdminAccessControl = user.userAccessControls?.find(
      (uac) =>
        uac.accessControl?.role?.group === 'ORGANISATION' &&
        uac.accessControl?.role?.code === 'GLOBAL_ADMIN'
    );
    if (globalAdminAccessControl && user.organisationId) {
      const hotels = await this.hotelRepository.find({
        where: { organisationId: user.organisationId || '' }
      });
      const hotelAdminRole = await this.roleRepository.findOne({
        where: { code: 'HM' }
      });

      const permissionCodes = Array.isArray(hotelAdminRole?.permissions)
        ? [...(hotelAdminRole?.permissions || [])]
        : JSON.parse(hotelAdminRole?.permissions || '[]');

      return {
        id: user.id,
        fullName: this.buildFullName(user.firstName, user.lastName),
        emailAddress: user.emailAddress,
        role: {
          id: globalAdminAccessControl.accessControl?.role?.id,
          code: globalAdminAccessControl.accessControl?.role?.code,
          name: globalAdminAccessControl.accessControl?.role?.name,
          group: globalAdminAccessControl.accessControl?.role?.group
        },
        propertyPermissionList: hotels.map((hotel) => ({
          permissionCodes: [
            'organization.manage',
            'business-intelligence',
            'settings.event',
            'gallery', // TODO: define role later
            ...(permissionCodes || [])
          ],
          property: {
            id: hotel.id,
            code: hotel.code,
            name: hotel.name,
            initialSetup: hotel.initialSetup
          },
          role: null
        }))
      };
    }
    // In case of ORGANISATION_USER
    const organisationUserAccessControl = user.userAccessControls?.find(
      (uac) =>
        uac.accessControl?.role?.group === 'ORGANISATION' &&
        uac.accessControl?.role?.code === 'USER'
    );
    if (organisationUserAccessControl && user.organisationId) {
      const hotelAdminRole = await this.roleRepository.findOne({
        where: { code: 'HM' }
      });

      const permissionCodes = [
        'business-intelligence',
        'settings.event',
        ...(hotelAdminRole?.permissions || [])
      ];

      return {
        id: user.id,
        fullName: this.buildFullName(user.firstName, user.lastName),
        emailAddress: user.emailAddress,
        role: {
          id: organisationUserAccessControl.accessControl?.role?.id,
          code: organisationUserAccessControl.accessControl?.role?.code,
          name: organisationUserAccessControl.accessControl?.role?.name,
          group: organisationUserAccessControl.accessControl?.role?.group
        },
        propertyPermissionList: user.userAccessControls
          ?.filter((uac) => uac.accessControl?.hotelId)
          ?.map((uac) => ({
            permissionCodes: permissionCodes,
            property: {
              id: uac.accessControl?.hotelId,
              code: uac.accessControl?.hotel?.code,
              name: uac.accessControl?.hotel?.name,
              initialSetup: uac.accessControl?.hotel?.initialSetup
            },
            role: null
          }))
      };
    }
    // Another case => user is Hotel level
    return {
      id: user.id,
      fullName: this.buildFullName(user.firstName, user.lastName),
      emailAddress: user.emailAddress,
      role: {
        id: user.userAccessControls?.[0]?.accessControl?.role?.id,
        code: user.userAccessControls?.[0]?.accessControl?.role?.code,
        name: user.userAccessControls?.[0]?.accessControl?.role?.name,
        group: user.userAccessControls?.[0]?.accessControl?.role?.group
      },
      propertyPermissionList: user.userAccessControls
        ?.filter((uac) => uac.accessControl?.hotelId)
        ?.map((uac) => ({
          permissionCodes: uac.accessControl?.role?.permissions,
          property: {
            id: uac.accessControl?.hotelId,
            code: uac.accessControl?.hotel?.code,
            name: uac.accessControl?.hotel?.name,
            initialSetup: uac.accessControl?.hotel?.initialSetup
          },
          role: null
        }))
    };
  }

  async getInternalUserById(userId: string) {
    const { user, accessControl, userAccessControl, identityAuth0User } =
      await this.getUserData(userId);

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
      status: user.status,
      auth0UserId: identityAuth0User.auth0UserId,
      organisationId: user.organisationId,
      lastLoginActivity: user.lastLoginActivity,
      createdDate: user.createdAt,
      role: {
        id: accessControl.roleId,
        code: accessControl.role?.code,
        name: accessControl.role?.name,
        group: accessControl.role?.group
      }
    };
  }

  async getUserList(filter: GetListUserQueryDto) {
    const { organisation_id, hotelId, ids, ...rest } = filter;
    const { where, relations, order, options } = Filter.buildCondition(rest);

    const qb = this.identityUserRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userAccessControls', 'uac')
      .leftJoinAndSelect('uac.accessControl', 'ac')
      .leftJoinAndSelect('ac.role', 'role')
      .where('user.deletedAt IS NULL')
      .andWhere('ac.organisationId = :orgId', { orgId: organisation_id });

    if (hotelId) {
      qb.andWhere('(ac.hotelId = :hotelId OR ac.hotelId IS NULL)', { hotelId });
    }

    if (ids?.length) {
      qb.andWhere('user.id IN (:...ids)', { ids });
    }

    const pageSize = rest.pageSize || 10;
    const pageIndex = rest.pageIndex && rest.pageIndex > 0 ? rest.pageIndex : 0;

    const count = await qb.getCount();
    const users = await qb
      .skip(pageIndex * pageSize)
      .take(pageSize)
      .getMany();

    const items = users.map((user) => this.buildBasicUser(user));

    return {
      items,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      pageSize: pageSize,
      pageIndex: pageIndex
    };
  }

  async validateUser(createUserDto: Partial<CreateUserDto>) {
    if (createUserDto.username || createUserDto.emailAddress) {
      const existedUsernames = await this.identityUserRepository.findOne({
        where: [
          {
            username: createUserDto.username,
            deletedAt: IsNull()
          },
          {
            emailAddress: createUserDto.emailAddress,
            deletedAt: IsNull()
          }
        ]
      });

      if (existedUsernames && existedUsernames.username === createUserDto.username) {
        return {
          valid: false,
          code: 'USERNAME_NOT_UNIQUE'
        };
      }

      if (existedUsernames && existedUsernames.emailAddress === createUserDto.emailAddress) {
        return {
          valid: false,
          code: 'EMAIL_NOT_UNIQUE'
        };
      }

      return {
        valid: true
      };
    }

    return {
      valid: true
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    const awsUserInput: AwsUserInput = {
      username: createUserDto.username,
      emailAddress: createUserDto.emailAddress,
      roleId: createUserDto.roleId,
      organisationId: createUserDto.organisationId,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      auth0UserId: createUserDto.auth0User.user_id
    };

    let awsUser;

    const role = await this.roleRepository.findOne({
      where: { id: createUserDto.roleId, deletedAt: IsNull() }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    try {
      let userId: string | undefined = undefined;
      if (this.isAwsUserEnabled) {
        awsUser = await this.usersAwsService.createAwsUser(awsUserInput);
        userId = awsUser.id;
        awsUserInput.id = userId;
      }

      const auth0UserId = createUserDto.auth0User.user_id;

      return await this.dataSource.transaction(async (transactionalEntityManager) => {
        const identityUser = await transactionalEntityManager.create(IdentityUser, {
          id: userId,
          organisationId: createUserDto.organisationId,
          username: createUserDto.username,
          emailAddress: createUserDto.emailAddress,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          status: IdentityUserStatusEnum.ACTIVE
        });

        await transactionalEntityManager.save(identityUser);

        const identityAuth0User = await transactionalEntityManager.create(IdentityAuth0User, {
          auth0UserId: auth0UserId,
          userId: identityUser.id
        });

        await transactionalEntityManager.save(identityAuth0User);

        const accessControl = await this.accessControlRepository.create({
          roleId: role.id,
          organisationId: createUserDto.organisationId,
          hotelId: createUserDto.hotelId
        });

        await transactionalEntityManager.save(accessControl);

        const userAccessControl = await this.userAccessControlRepository.create({
          userId: identityUser.id,
          accessControlId: accessControl.id
        });

        await transactionalEntityManager.save(userAccessControl);

        return identityUser;
      });
    } catch (error) {
      if (awsUser) {
        try {
          await this.usersAwsService.deleteAwsUser(awsUserInput);
        } catch (error) {
          this.logger.error(`Failed to delete aws user: ${JSON.stringify(error)}`);
        }
      }
      throw new BadRequestException(error.message);
    }

    // const user = await this.identityUserRepository.create(createUserDto);
    // await this.identityUserRepository.save(user);
    // return user;
  }

  async userDetails(userId: string) {
    const user = await this.identityUserRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
      relations: [
        'userAccessControls',
        'userAccessControls.accessControl',
        'userAccessControls.accessControl.role',
        'userAccessControls.accessControl.hotel'
      ]
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.buildBasicUser(user);
  }

  async getHotelMembers(getHotelMembersDto: GetHotelMembersDto) {
    const { hotelId, isAssigned, ids } = getHotelMembersDto;

    const qb = this.identityUserRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userAccessControls', 'uac')
      .leftJoinAndSelect('uac.accessControl', 'ac')
      .leftJoinAndSelect('ac.role', 'role')
      .where('user.deletedAt IS NULL')
      .andWhere('role.group = :group', { group: IdentityRoleGroupEnum.PROPERTY });

    if (isAssigned === true) {
      qb.andWhere('(ac.hotelId = :hotelId)', { hotelId });
    } else if (isAssigned === false) {
      qb.andWhere('(ac.hotelId IS NULL)');
    }

    if (ids?.length) {
      qb.andWhere('user.id IN (:...ids)', { ids });
    }

    const members = await qb.getMany();
    return members.map((member) => this.buildBasicUser(member));
  }

  async assignHotelMember(assignHotelMemberDto: AssignHotelMemberDto) {
    const userIds = assignHotelMemberDto.items.map((item) => item.userId);

    if (userIds && userIds.length > 0) {
      const users = await this.identityUserRepository.find({
        where: { id: In(userIds), deletedAt: IsNull() },
        relations: [
          'userAccessControls',
          'userAccessControls.accessControl',
          'userAccessControls.accessControl.role',
          'userAccessControls.accessControl.hotel'
        ]
      });

      let accessControls: IdentityAccessControl[] = [];
      for (const user of users) {
        if (!user.userAccessControls || user.userAccessControls.length === 0) {
          continue;
        }

        if (!user.userAccessControls[0].accessControl?.id) {
          continue;
        }

        const accessControl = user.userAccessControls[0].accessControl;
        const hotelId = assignHotelMemberDto.items.find((item) => item.userId === user.id)?.hotelId;
        if (!hotelId) {
          continue;
        }

        const roleId = assignHotelMemberDto.items.find((item) => item.userId === user.id)?.roleId;
        if (!roleId) {
          continue;
        }

        accessControl.hotelId = hotelId;
        accessControl.roleId = roleId;
        accessControls.push(accessControl);
      }

      return this.accessControlRepository.save(accessControls);
    }

    return false;
  }

  async unassignHotelMember(unassignHotelMemberDto: UnassignHotelMemberDto) {
    const userIds = unassignHotelMemberDto.items.map((item) => item.userId);

    if (userIds && userIds.length > 0) {
      const users = await this.identityUserRepository.find({
        where: { id: In(userIds), deletedAt: IsNull() },
        relations: [
          'userAccessControls',
          'userAccessControls.accessControl',
          'userAccessControls.accessControl.role',
          'userAccessControls.accessControl.hotel'
        ]
      });

      const accessControlIds: string[] = [];
      for (const user of users) {
        if (!user.userAccessControls || user.userAccessControls.length === 0) {
          continue;
        }

        if (!user.userAccessControls[0].accessControl?.id) {
          continue;
        }

        accessControlIds.push(user.userAccessControls[0].accessControl?.id);
      }

      return this.accessControlRepository.save(
        accessControlIds.map((id) => ({ id, hotelId: null }))
      );
    }

    return false;
  }

  async updateHotelMemberRole(updateHotelMemberRoleDto: UpdateHotelMemberRoleDto) {
    const { userId, roleId, hotelId } = updateHotelMemberRoleDto;

    const user = await this.identityUserRepository.findOne({
      where: {
        id: userId,
        userAccessControls: {
          accessControl: {
            hotelId: hotelId
          }
        },
        deletedAt: IsNull()
      },
      relations: [
        'userAccessControls',
        'userAccessControls.accessControl',
        'userAccessControls.accessControl.role',
        'userAccessControls.accessControl.hotel'
      ]
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.userAccessControls || user.userAccessControls.length === 0) {
      throw new NotFoundException('User access control not found');
    }

    if (!user.userAccessControls[0].accessControl?.id) {
      throw new NotFoundException('Access control not found');
    }

    const accessControl = user.userAccessControls[0].accessControl;

    return this.accessControlRepository.update(accessControl.id, {
      roleId: roleId
    });
  }

  async updateUser(updateUserDto: UpdateUserDto) {
    const { user, identityAuth0User, userAccessControl, accessControl } = await this.getUserData(
      updateUserDto.id
    );

    let isAwsUserUpdated = false;
    let newAwsUserInput: AwsUserInput | null = null;
    let currentAwsUserInput: AwsUserInput | null = null;

    try {
      if (
        this.isAwsUserEnabled &&
        user.username &&
        user.emailAddress &&
        accessControl.roleId &&
        user.organisationId &&
        user.id &&
        user.firstName &&
        user.lastName &&
        identityAuth0User.auth0UserId
      ) {
        currentAwsUserInput = {
          id: user.id,
          username: user.username,
          emailAddress: user.emailAddress,
          roleId: accessControl.roleId,
          organisationId: user.organisationId,
          firstName: user.firstName,
          lastName: user.lastName,
          auth0UserId: identityAuth0User.auth0UserId
        };
        newAwsUserInput = {
          username: updateUserDto.username,
          emailAddress: updateUserDto.emailAddress,
          roleId: updateUserDto.roleId,
          organisationId: user.organisationId,
          firstName: updateUserDto.firstName,
          lastName: updateUserDto.lastName,
          auth0UserId: identityAuth0User.auth0UserId
        };

        await this.usersAwsService.updateAwsUser(newAwsUserInput);
      }

      if (updateUserDto.emailAddress) {
        user.emailAddress = updateUserDto.emailAddress;
      }

      user.firstName = updateUserDto.firstName;
      user.lastName = updateUserDto.lastName;
      if (updateUserDto.status) {
        user.status = updateUserDto.status;
      }

      if (updateUserDto.username) {
        user.username = updateUserDto.username;
      }

      if (accessControl.roleId) {
        accessControl.roleId = updateUserDto.roleId;
      }
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(accessControl);
        await transactionalEntityManager.save(user);
      });
    } catch (error) {
      if (isAwsUserUpdated && currentAwsUserInput) {
        try {
          await this.usersAwsService.updateAwsUser(currentAwsUserInput);
        } catch (error) {
          this.logger.error(`Failed to update aws user: ${JSON.stringify(error)}`);
        }
      }

      this.logger.error(`Failed to update user: ${JSON.stringify(error)}`);
      throw new BadRequestException(error.message);
    }

    return user;
  }

  async deleteUser(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const { user, identityAuth0User, userAccessControl, accessControl } =
      await this.getUserData(userId);

    let isAwsUserDeleted = false;
    let awsUserInput: AwsUserInput | null = null;
    try {
      if (
        this.isAwsUserEnabled &&
        user.id &&
        user.username &&
        user.emailAddress &&
        accessControl.roleId &&
        user.organisationId &&
        user.firstName &&
        user.lastName &&
        identityAuth0User.auth0UserId
      ) {
        awsUserInput = {
          id: user.id,
          username: user.username,
          emailAddress: user.emailAddress,
          roleId: accessControl.roleId,
          organisationId: user.organisationId,
          firstName: user.firstName,
          lastName: user.lastName,
          auth0UserId: identityAuth0User.auth0UserId
        };
        await this.usersAwsService.deleteAwsUser(awsUserInput);

        isAwsUserDeleted = true;
      }

      await this.dataSource.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.softDelete(
          IdentityUserAccessControl,
          userAccessControl.id
        );
        await transactionalEntityManager.softDelete(IdentityAccessControl, accessControl.id);
        await transactionalEntityManager.softDelete(IdentityAuth0User, identityAuth0User.id);
        await transactionalEntityManager.softDelete(IdentityUser, user.id);
      });

      return true;
    } catch (error) {
      if (isAwsUserDeleted && awsUserInput) {
        try {
          await this.usersAwsService.createAwsUser(awsUserInput);
        } catch (error) {
          this.logger.error(`Failed to delete aws user: ${JSON.stringify(error)}`);
        }
      }

      this.logger.error(`Failed to delete user: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  private async getUserData(userId: string) {
    const [user, identityAuth0User] = await Promise.all([
      this.identityUserRepository.findOne({
        where: { id: userId, deletedAt: IsNull() }
      }),
      this.identityAuth0UserRepository.findOne({
        where: { userId: userId, deletedAt: IsNull() }
      })
    ]);
    if (!user || !identityAuth0User) {
      throw new NotFoundException('User not found');
    }

    const userAccessControl = await this.userAccessControlRepository.findOne({
      where: { userId: userId, deletedAt: IsNull() }
    });

    if (!userAccessControl || !userAccessControl.accessControlId) {
      throw new NotFoundException('User access control not found');
    }

    const accessControl = await this.accessControlRepository.findOne({
      where: {
        id: userAccessControl.accessControlId,
        deletedAt: IsNull()
      }
    });

    if (!accessControl) {
      throw new NotFoundException('Access control not found');
    }
    return {
      user: user,
      identityAuth0User: identityAuth0User,
      userAccessControl: userAccessControl,
      accessControl: accessControl
    };
  }

  private buildBasicUser(user: IdentityUser): UserDto {
    return {
      id: user.id,
      username: user.username || undefined,
      hotelId: user.hotelId || undefined,
      organisationId: user.organisationId || undefined,
      emailAddress: user.emailAddress || '',
      fullName: this.buildFullName(user.firstName, user.lastName),
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      status: this.mapUserStatus(user.status),
      lastLoginActivity: user.lastLoginActivity || undefined,
      permissions: [],
      propertyIdList: [],
      role: {
        id: user.userAccessControls?.[0]?.accessControl?.role?.id,
        code: user.userAccessControls?.[0]?.accessControl?.role?.code || '',
        name: user.userAccessControls?.[0]?.accessControl?.role?.name || '',
        group: user.userAccessControls?.[0]?.accessControl?.role?.group || ''
      },
      propertyPermissionList: [],
      createdDate: user.createdAt
    };
  }

  private buildFullName(firstName: string | null, lastName: string | null): string {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return firstName || lastName || '';
  }

  private mapUserStatus(status: any): UserStatusEnum {
    return status === 'ACTIVE' ? UserStatusEnum.ACTIVE : UserStatusEnum.INACTIVE;
  }
}
