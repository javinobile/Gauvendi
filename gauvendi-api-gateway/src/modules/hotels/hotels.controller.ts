import { Body, Controller, Get, HttpStatus, ParseFilePipeBuilder, Patch, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CompleteOnboardingHotelDto, GetPaymentAccountListQueryDto, HotelInformationQueryDto, HotelsQueryDto } from "./dtos/hotel-information-query.dto";
import { UpdateHotelInformationBodyDto } from "./dtos/update-hotel-information.dto";
import { UploadHotelFaviconDto, UploadHotelImageDto, UploadHotelLogoDto } from "./dtos/upload-hotel-image.dto";
import { HotelsService } from "./hotels.service";
import { User } from "@src/core/decorators/user.decorator";
import { Auth0Payload } from "@src/core/auth/jwt.strategy";

@Controller("hotels")
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  getHotels(@Query() query: HotelsQueryDto, @User() user: Auth0Payload) {
    return this.hotelsService.getHotels(query, user);
  }

  @Get("payment-account-list")
  getPaymentAccountList(@Query() query: GetPaymentAccountListQueryDto) {
    return this.hotelsService.getPaymentAccountList(query);
  }

  @Get("information")
  getHotelInformation(@Query() query: HotelInformationQueryDto) {
    return this.hotelsService.getHotelInformation(query);
  }

  @Get("mapping")
  getHotelMapping(@Query() query: { hotelId: string }) {
    return this.hotelsService.getHotelMapping(query.hotelId);
  }

  @Patch("information")
  updateHotelInformation(@Body() body: UpdateHotelInformationBodyDto) {
    return this.hotelsService.updateHotelInformation(body);
  }

  @Post("complete-onboarding")
  completeOnboarding(@Body() body: CompleteOnboardingHotelDto) {
    return this.hotelsService.completeOnboarding(body);
  }

  // https://assets-cdn.gauvendi.com/hotel/GVAPALUX/blob_1756719175409.octet-stream
  @Post("favicon")
  @UseInterceptors(FileInterceptor("file"))
  async uploadHotelImage(
    @Body() body: UploadHotelFaviconDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp("image/x-icon|image/vnd.microsoft.icon"),
        })
        .addMaxSizeValidator({
          maxSize: 1 * 1024 * 1024, // 1MB should be enough for favicon
          message: "File size must be less than 1MB",
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    )
    file: any
  ) {
    return this.hotelsService.uploadHotelFavicon(body, file);
  }

  // https://assets-cdn.gauvendi.com/hotel/GVAPALUX/blob_1756719175409.octet-stream
  @Post("logo")
  @UseInterceptors(FileInterceptor("file"))
  async uploadHotelLogo(
    @Body() body: UploadHotelLogoDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp("image/jpeg|image/png|image/jpg"),
        })
        .addMaxSizeValidator({
          maxSize: 3 * 1024 * 1024,
          message: "File size must be less than 3MB",
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    )
    file: any
  ) {
    return this.hotelsService.uploadHotelLogo(body, file);
  }

  // https://assets-cdn.gauvendi.com/hotel/GVAPALUX/blob_1756719175409.octet-stream
  @Post("upload-email-general-images")
  @UseInterceptors(FileInterceptor("file"))
  async uploadHotelImages(
    @Body() body: UploadHotelImageDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp("image/jpeg|image/png|image/jpg"),
        })
        .addMaxSizeValidator({
          maxSize: 0.5 * 1024 * 1024, // 500KB
          message: "File size must be less than 500KB",
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    )
    file: any
  ) {
    return this.hotelsService.uploadEmailGeneralImages(body, file);
  }
}
