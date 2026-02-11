import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Auth0Service, Auth0User } from "@src/core/auth/auth0.service";
import { Auth0Payload } from "@src/core/auth/jwt.strategy";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { AxiosError, isAxiosError } from "axios";
import { lastValueFrom, Observable } from "rxjs";
import { ChangePasswordDto, CreateUserDto, UpdateUserDto, ValidateUserDto } from "./dtos/base-user.dto";
import { RoleDto, UserDto } from "./dtos/get-current-user.dto.";
import { GetRoleDto } from "./dtos/get-role.dto";
import { AssignHotelMemberDto, GetHotelMembersDto, UnassignHotelMemberDto, UpdateHotelMemberRoleDto } from "./dtos/hotel-member.dto";
import { AssignUsersToHotelInfraDto, UnassignUsersToHotelInfraDto } from "./dtos/internal-user.dto";

@Injectable()
export class AuthService {
  constructor(
    @Inject(PLATFORM_SERVICE)
    private readonly platformClient: ClientProxy,
    private readonly auth0Service: Auth0Service
  ) {}

  getUserPermission(providerUserId: string): Observable<UserDto> {
    return this.platformClient.send({ cmd: "get_user_permission" }, { providerUserId });
  }

  getListUser(query: { pageIndex: number; pageSize: number; organisation_id: string; hotelId: string }): Observable<UserDto[]> {
    return this.platformClient.send({ cmd: CMD.AUTH.GET_LIST_USER }, query);
  }

  getCurrentUser(auth0Payload: Auth0Payload): Observable<UserDto> {
    return this.platformClient.send({ cmd: "get_current_user" }, { auth0Payload });
  }

  getRoleList(query: GetRoleDto): Observable<RoleDto[]> {
    return this.platformClient.send({ cmd: CMD.AUTH.GET_ROLE_LIST }, query);
  }

  async validateUser(user: ValidateUserDto & { organisationId: string }) {
    return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.VALIDATE_USER }, { ...user }));
  }

  async createUser(user: CreateUserDto & { organisationId: string }) {
    let auth0User: Auth0User | null = null;
    let isAuth0UserCreated = false;
    try {
      const validateUser = await lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.VALIDATE_USER }, { ...user }));

      if (!validateUser?.valid) {
        throw new BadRequestException(validateUser?.message || "User is not valid");
      }

      const username = user.username.replace("@", ".") || user.emailAddress.replace("@", ".");

      auth0User = await this.auth0Service.createUser({
        email: user.emailAddress,
        username: username,
        password: user.password,
        given_name: user.firstName,
        family_name: user.lastName,
        user_metadata: {
          roleId: user.roleId,
          organisationId: user.organisationId,
        },
      });
      isAuth0UserCreated = true;
      const newUser = await lastValueFrom(
        this.platformClient.send(
          { cmd: CMD.AUTH.CREATE_USER },
          {
            ...user,
            username: username,
            auth0User,
          }
        )
      );

      return newUser;
    } catch (error) {
      if (isAuth0UserCreated && auth0User) {
        try {
          await this.auth0Service.deleteUserById(auth0User.user_id);
        } catch (error) {
          console.error("Failed to delete Auth0 user during rollback:", error);
          throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
      this.handleAuth0Error(error);
    }
  }

  async updateUser(
    input: UpdateUserDto & {
      id: string;
      organisationId: string;
    }
  ) {
    let currentAuth0User: Auth0User | null = null;
    let isAuth0UserUpdated = false;
    try {
      const internalUser = await lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.GET_INTERNAL_USER }, { id: input.id }));

      if (!internalUser) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      currentAuth0User = await this.auth0Service.getUserById(internalUser.auth0UserId);
      if (!currentAuth0User) {
        throw new HttpException("Auth0 user not found", HttpStatus.NOT_FOUND);
      }

      await this.auth0Service.updateUserById(internalUser.auth0UserId, {
        given_name: input.firstName,
        family_name: input.lastName,
        user_metadata: {
          roleId: input.roleId,
          organisationId: internalUser.organisationId,
        },
      });
      isAuth0UserUpdated = true;

      return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.UPDATE_USER }, input));
    } catch (error) {
      if (isAuth0UserUpdated && currentAuth0User) {
        try {
          await this.auth0Service.updateUserById(currentAuth0User.user_id, {
            given_name: currentAuth0User.given_name,
            family_name: currentAuth0User.family_name,
            user_metadata: currentAuth0User.user_metadata,
          });
        } catch (error) {
          console.error("Failed to update Auth0 user during rollback:", error);
          throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
      this.handleAuth0Error(error);
    }
  }

  async deleteUser(id: string) {
    let currentAuth0User: Auth0User | null = null;
    let isAuth0UserDeleted = false;
    try {
      const internalUser = await lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.GET_INTERNAL_USER }, { userId: id }));

      if (!internalUser) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      currentAuth0User = await this.auth0Service.getUserById(internalUser.auth0UserId);
      if (currentAuth0User) {
        await this.auth0Service.deleteUserById(internalUser.auth0UserId);
        isAuth0UserDeleted = true;
      }

      return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.DELETE_USER }, { userId: id }));
    } catch (error) {
      // if (isAuth0UserDeleted) {
      //   try {
      //     await this.auth0Service.createUser({
      //       email: currentAuth0User.email,
      //       username: currentAuth0User.username,
      //       password: "",
      //       given_name: currentAuth0User.given_name,
      //       family_name: currentAuth0User.family_name,
      //       user_metadata: currentAuth0User.user_metadata,
      //     });
      //   } catch (error) {
      //     console.error("Failed to update Auth0 user during rollback:", error);
      //     throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      //   }
      // }
      this.handleAuth0Error(error);
    }
  }

  async getUserDetails(userId: string) {
    return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.GET_USER_DETAILS }, { userId }));
  }

  async updateHotelMemberRole(input: UpdateHotelMemberRoleDto) {
    return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.UPDATE_HOTEL_MEMBER_ROLE }, input));
  }

  async assignHotelMember(input: AssignHotelMemberDto) {
    return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.ASSIGN_HOTEL_MEMBER }, input));
  }

  async unassignHotelMember(input: UnassignHotelMemberDto) {
    return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.UNASSIGN_HOTEL_MEMBER }, input));
  }

  async hotelMembers(filter: GetHotelMembersDto) {
    return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.GET_HOTEL_MEMBERS }, filter));
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    try {
      const internalUser = await lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.GET_INTERNAL_USER }, { userId: userId }));
      return this.auth0Service.changePassword(internalUser.auth0UserId, data.password);
    } catch (error) {
      this.handleAuth0Error(error);
    }
  }

  debugPermissions(user: Auth0Payload): Observable<any> {
    return this.platformClient.send({ cmd: "debug_permissions" }, { id: user.user_id, auth0Payload: user });
  }

  private handleAuth0Error(error: any) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.["message"] || axiosError.message;
      const statusCode = axiosError.response?.data?.["statusCode"] || axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, statusCode);
    } else {
      throw new InternalServerErrorException(error?.message || "Failed to create user");
    }
  }

  async assignUsersToHotel(data: AssignUsersToHotelInfraDto) {
    return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.ASSIGN_USERS_TO_HOTEL }, data));
  }

  async unassignUsersFromHotel(data: UnassignUsersToHotelInfraDto) {
    return lastValueFrom(this.platformClient.send({ cmd: CMD.AUTH.UNASSIGN_USERS_TO_HOTEL }, data));
  }
}
