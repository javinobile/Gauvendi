import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { OrganisationService } from "./organisation.service";
import { CreateOrganizationWithHotelsDto } from "./organisation.dto";
import { Public } from "@src/core/decorators/is-public.decorator";
import { Auth0Payload } from "@src/core/auth/jwt.strategy";
import { User } from "@src/core/decorators/user.decorator";

@Controller("organisation")
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Get("list")
  getOrganisationList(@Res() res: Response, @User() user: Auth0Payload) {
    return this.organisationService.getOrganisationList(res, user);
  }

  @Post("create")
  @Public()
  createOrganisation(@Body() createOrganizationWithHotelsDto: CreateOrganizationWithHotelsDto) {
    return this.organisationService.createOrganizationWithHotels(createOrganizationWithHotelsDto);
  }

  @Get("collect-data")
  @Public()
  collectData() {
    return this.organisationService.collectData();
  }
}
