import { Body, Controller, Get, HttpStatus, InternalServerErrorException, ParseFilePipeBuilder, Post, Query, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { catchError, map, of, throwError } from "rxjs";
import { DeleteHotelAmenityDto, GetCppExtrasServiceListQueryDto, HotelAmenityInputDto, UploadHotelAmenityImageDto } from "./hotel-amenity.dto";
import { HotelAmenityService } from "./hotel-amenity.service";
@Controller("hotel-amenity")
export class HotelAmenityController {
  constructor(private readonly hotelAmenityService: HotelAmenityService) {}

  @Post("upload-image")
  @UseInterceptors(FileInterceptor("file"))
  uploadHotelAmenityImage(
    @Body() query: UploadHotelAmenityImageDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp("image/x-icon|image/vnd.microsoft.icon|image/jpeg|image/png|image/jpg|image/webp"),
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB should be enough for favicon
          message: "File size must be less than 10MB",
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    )
    file: any,
    @Res() response: Response
  ) {
    return this.hotelAmenityService.uploadHotelAmenityImage({ ...query, file }).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("create")
  createHotelAmenity(@Body() body: HotelAmenityInputDto, @Res() response: Response) {
    return this.hotelAmenityService.createHotelAmenity(body).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("update")
  updateHotelAmenity(@Body() dto: HotelAmenityInputDto, @Res() response: Response) {
    return this.hotelAmenityService.updateHotelAmenity(dto).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      }),
      catchError((error) => {
        return of(
          response.status(HttpStatus.OK).send({
            status: "ERROR",
            message: error?.message || "Update hotel amenity failed",
          })
        );
      })
    );
  }

  @Post("delete")
  deleteHotelAmenity(@Body() dto: DeleteHotelAmenityDto, @Res() response: Response) {
    return this.hotelAmenityService.deleteHotelAmenity(dto).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      }),
      catchError((error) => {
        return of(
          response.status(HttpStatus.OK).send({
            status: "ERROR",
            message: error?.message || "Delete hotel amenity failed",
          })
        );
      })
    );
  }

  @Post("cpp-extras-service-list")
  getCppExtrasServiceList(@Body() query: GetCppExtrasServiceListQueryDto) {
    return this.hotelAmenityService.getCppExtrasServiceList(query);
  }

  @Get("pms-amenity-list")
  getPmsAmenityList(@Query() hotelId: string) {
    return this.hotelAmenityService.getPmsAmenityList(hotelId);
  }

  @Post("update-hotel-amenity-list")
  updateHotelAmenityList(@Body() dto: HotelAmenityInputDto[], @Res() response: Response) {
    return this.hotelAmenityService.updateHotelAmenityList(dto).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }
}
