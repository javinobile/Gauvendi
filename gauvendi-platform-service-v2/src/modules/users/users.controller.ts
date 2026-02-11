import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { Auth0Payload } from './dtos/auth0-payload.dto';
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
import { ValidateUserDto } from './dtos/validate-user.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'get_user_permission' })
  async getUserPermission(@Payload() { providerUserId }: { providerUserId: string }) {
    return this.usersService.getUserPermission(providerUserId);
  }

  @MessagePattern({ cmd: 'get_current_user' })
  async getCurrentUser(@Payload() { auth0Payload }: { auth0Payload: Auth0Payload }) {
    return this.usersService.getCurrentUser(auth0Payload.sub);
  }

  @MessagePattern({ cmd: CMD.USERS.GET_LIST_USER })
  async getUserList(@Payload() filter: GetListUserQueryDto) {
    return this.usersService.getUserList(filter);
  }

  @MessagePattern({ cmd: CMD.USERS.VALIDATE_USER })
  async validateUser(@Payload() validateUserDto: ValidateUserDto) {
    return this.usersService.validateUser(validateUserDto);
  }


  @MessagePattern({ cmd: CMD.USERS.CREATE_USER })
  async createUser(@Payload() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @MessagePattern({ cmd: CMD.USERS.UPDATE_USER })
  async updateUser(@Payload() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(updateUserDto);
  }

  @MessagePattern({ cmd: CMD.USERS.DELETE_USER })
  async deleteUser(@Payload() deleteUserDto: { userId: string }) {
    return this.usersService.deleteUser(deleteUserDto.userId);
  }

  @MessagePattern({ cmd: CMD.USERS.GET_ROLE_LIST })
  async getRoles(@Payload() getRolesDto: GetRoleDto) {
    return this.usersService.getRoles(getRolesDto);
  }

  @MessagePattern({ cmd: CMD.USERS.GET_HOTEL_MEMBERS })
  async getHotelMembers(@Payload() getHotelMembersDto: GetHotelMembersDto) {
    return this.usersService.getHotelMembers(getHotelMembersDto);
  }

  @MessagePattern({ cmd: CMD.USERS.GET_USER_DETAILS })
  async getUserDetails(@Payload() getUserDetailsDto: { userId: string }) {
    return this.usersService.userDetails(getUserDetailsDto.userId);
  }

  @MessagePattern({ cmd: CMD.USERS.UPDATE_HOTEL_MEMBER_ROLE })
  async updateHotelMemberRole(@Payload() updateHotelMemberRoleDto: UpdateHotelMemberRoleDto) {
    return this.usersService.updateHotelMemberRole(updateHotelMemberRoleDto);
  }

  @MessagePattern({ cmd: CMD.USERS.ASSIGN_HOTEL_MEMBER })
  async assignHotelMember(@Payload() assignHotelMemberDto: AssignHotelMemberDto) {
    return this.usersService.assignHotelMember(assignHotelMemberDto);
  }

  @MessagePattern({ cmd: CMD.USERS.UNASSIGN_HOTEL_MEMBER })
  async unassignHotelMember(@Payload() unassignHotelMemberDto: UnassignHotelMemberDto) {
    return this.usersService.unassignHotelMember(unassignHotelMemberDto);
  }

  @MessagePattern({ cmd: CMD.USERS.GET_INTERNAL_USER })
  async getInternalUserById(@Payload() getInternalUserByIdDto: { userId: string }) {
    return this.usersService.getInternalUserById(getInternalUserByIdDto.userId);
  }
}
