import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { Auth0Service } from "./auth0.service";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "jwt" }), ConfigModule],
  providers: [JwtStrategy, Auth0Service],
  exports: [PassportModule, Auth0Service],
})
export class Auth0Module {}
