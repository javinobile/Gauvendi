export interface GetHotelMembersDto {
  hotelId: string;
  isAssigned?: boolean;
  ids?: string[];
}

export interface AssignHotelMemberDto {
  items: {
    userId: string;
    hotelId: string;
    roleId: string;
  }[];
}

export interface UnassignHotelMemberDto {
  items: {
    userId: string;
    hotelId: string;
  }[];
}

export interface UpdateHotelMemberRoleDto {
  userId: string;
  roleId: string;
  hotelId: string;
}
