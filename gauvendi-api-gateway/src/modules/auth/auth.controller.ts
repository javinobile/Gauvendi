import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { Auth0Payload } from "@src/core/auth/jwt.strategy";
import { Public } from "@src/core/decorators/is-public.decorator";
import { User } from "@src/core/decorators/user.decorator";
import { ApiKeyGuard } from "@src/core/guards/api-key.guard";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { ChangePasswordDto, CreateUserDto, UpdateUserDto, ValidateUserDto } from "./dtos/base-user.dto";
import { RoleDto, UserDto } from "./dtos/get-current-user.dto.";
import { GetListUserQueryDto } from "./dtos/get-list-user.dto";
import { GetRoleDto } from "./dtos/get-role.dto";
import { AssignHotelMemberDto, GetHotelMembersDto, UnassignHotelMemberDto, UpdateHotelMemberRoleDto } from "./dtos/hotel-member.dto";
import { AssignUsersToHotelInfraDto, UnassignUsersToHotelInfraDto } from "./dtos/internal-user.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ApiKeyGuard)
  @Post("user-permission")
  getUserPermission(@Body() data: { providerUserId: string }): Observable<UserDto> {
    return this.authService.getUserPermission(data.providerUserId);
  }

  @Get("users")
  getListUser(@User() user: Auth0Payload, @Query() query: GetListUserQueryDto): Observable<UserDto[]> {
    return this.authService.getListUser({
      ...query,
      hotelId: query.hotelId,
      pageIndex: query.pageIndex,
      pageSize: query.pageSize,
      organisation_id: user.organisation_id,
    });
  }

  @Get("me")
  getCurrentUser(@User() user: Auth0Payload): Observable<UserDto> {
    return this.authService.getCurrentUser(user);
  }

  @Post("user")
  createUser(@User() user: Auth0Payload, @Body() data: CreateUserDto): Promise<UserDto> {
    return this.authService.createUser({
      ...data,
      organisationId: user.organisation_id,
    });
  }

  @Put("user/:id")
  updateUser(
    @User() user: Auth0Payload,
    @Body() data: UpdateUserDto,
    @Param("id") id: string): Promise<UserDto> {
    return this.authService.updateUser({
      ...data,
      id,
      organisationId: user.organisation_id,
    });
  }


  @Post('user/:id/change-password')
  changePassword(@Param("id") id: string, @Body() data: ChangePasswordDto): Promise<UserDto> {
    return this.authService.changePassword(id, data);

  }
  @Get("user/:id/details")
  getUserDetails(@Param("id") id: string): Promise<UserDto> {
    return this.authService.getUserDetails(id);
  }


  @Get("user/hotel-members")
  getHotelMembers(@Query() query: GetHotelMembersDto): Promise<UserDto[]> {
    return this.authService.hotelMembers(query);
  }

  @Put("user/hotel-members/update-role")
  updateHotelMemberRole(@Body() data: UpdateHotelMemberRoleDto): Promise<any> {
    return this.authService.updateHotelMemberRole(data);
  }
  @Post("user/hotel-members/assign")
  assignHotelMember(@Body() data: AssignHotelMemberDto): Promise<any> {
    return this.authService.assignHotelMember(data);
  }
  @Post("user/hotel-members/unassign")
  unassignHotelMember(@Body() data: UnassignHotelMemberDto): Promise<any> {
    return this.authService.unassignHotelMember(data);
  }
  @Post("user/validate")
  validateUser(@Body() data: ValidateUserDto, @User() user: Auth0Payload): Promise<any> {
    return this.authService.validateUser({
      ...data,
      organisationId: user.organisation_id,
    });
  }


  @Delete("user/:id")
  deleteUser(@Param("id") id: string): Promise<UserDto> {
    return this.authService.deleteUser(id);
  }

  @Get("roles")
  getRoleList(@Query() query: GetRoleDto): Observable<RoleDto[]> {
    return this.authService.getRoleList(query);
  }

  @Get("debug-jwt")
  debugJwt(@User() user: Auth0Payload) {
    console.log("🔍 Debug JWT payload:", JSON.stringify(user, null, 2));
    return {
      message: "Check console for JWT payload",
      permissions: user.permission_codes,
      permissionCount: user.permission_codes?.length || 0,
    };
  }

  @Get("debug-permissions")
  debugPermissions(@User() user: Auth0Payload) {
    return this.authService.debugPermissions(user);
  }
  
  @Public()
  @Post("users/assign-to-hotel")
  assignUsersToHotel(@Body() data: AssignUsersToHotelInfraDto) {
    return this.authService.assignUsersToHotel(data);
  }

  @Public()
  @Post("users/unassign-from-hotel")
  unassignUsersFromHotel(@Body() data: UnassignUsersToHotelInfraDto) {
    return this.authService.unassignUsersFromHotel(data);
  }
}
