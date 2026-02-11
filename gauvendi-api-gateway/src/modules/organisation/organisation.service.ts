import { HttpStatus, Inject, Injectable, Res } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { Response } from "express";
import { map } from "rxjs";
import { CreateOrganizationWithHotelsDto } from "./organisation.dto";
import { User } from "@src/core/decorators/user.decorator";
import { Auth0Payload } from "@src/core/auth/jwt.strategy";

@Injectable()
export class OrganisationService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getOrganisationList(@Res() res: Response, @User() user: Auth0Payload) {
    return this.clientProxy.send({ cmd: CMD.ORGANISATION.GET_LIST }, user).pipe(
      map((data) => {
        res.status(HttpStatus.OK).send(data);
      })
    );
  }

  createOrganizationWithHotels(createOrganizationWithHotelsDto: CreateOrganizationWithHotelsDto) {
    return this.clientProxy.send({ cmd: CMD.ORGANISATION.CREATE_ORGANIZATION_WITH_HOTELS }, createOrganizationWithHotelsDto);
  }

  collectData() {
    return this.clientProxy.send({ cmd: CMD.ORGANISATION.COLLECT_ORGANISATION_DATA }, {});
  }
}
