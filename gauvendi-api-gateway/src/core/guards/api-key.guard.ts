import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { ENV_CONST } from "../constants/environment.const";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKeyFromHeader(request);
    console.log("apiKey: ", apiKey);

    if (!apiKey) {
      throw new UnauthorizedException(null, "Not found API Key");
    }

    if (apiKey === this.configService.get(ENV_CONST.AUTH0_API_KEY)) {
      return true;
    }
    throw new UnauthorizedException(null, "Invalid API Key");
  }

  private extractApiKeyFromHeader(request: Request): string | undefined {
    const apiKey = (request.headers["gv-api-key"] as string) || undefined;
    return apiKey;
  }
}
