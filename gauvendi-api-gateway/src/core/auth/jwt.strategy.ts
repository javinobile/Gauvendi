import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";
import { ConfigService } from "@nestjs/config";

export interface Auth0Payload {
  email_address: string;
  user_id: string;
  user_name: string;
  organisation_id: string;
  full_name: string;
  permission_codes: string[];
  is_email_verified: boolean;
  onboarded_admin_sign_up: boolean;
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  scope: string;
  azp: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const domain = configService.get<string>("AUTH0_DOMAIN");
    const audience = configService.get<string>("AUTH0_AUDIENCE");

    // Debug configuration on startup
    console.log("🔧 JWT Strategy initialized with:");
    console.log("- Domain:", domain);
    console.log("- Audience:", audience);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>("AUTH0_AUDIENCE"),
      issuer: `https://${configService.get<string>("AUTH0_DOMAIN")}/`,
      algorithms: ["RS256"],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get<string>("AUTH0_DOMAIN")}/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: Auth0Payload) {
    // this.logger.debug("🎯 JWT Strategy validate() called!");
    // this.logger.debug("Payload:", JSON.stringify(payload, null, 2));
    return payload;
  }
}
