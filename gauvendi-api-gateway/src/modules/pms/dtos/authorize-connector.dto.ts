import { ConnectorTypeEnum } from "@src/core/enums/common.enum";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AuthorizeConnectorDto {
    @IsEnum(ConnectorTypeEnum)
    connectorType: ConnectorTypeEnum;

    @IsString()
    @IsNotEmpty()
    hotelCode: string;

    @IsString()
    @IsOptional()
    refreshToken?: string;

    @IsString()
    @IsOptional()
    authorizationCode?: string;

    @IsString()
    @IsOptional()
    clientId?: string;

    @IsString()
    @IsOptional()
    clientSecret?: string;

    @IsString()
    @IsOptional()
    redirectUrl?: string;

    @IsString()
    @IsOptional()
    accountCode?: string;
}