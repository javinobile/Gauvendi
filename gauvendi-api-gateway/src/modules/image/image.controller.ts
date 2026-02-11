import { Body, Controller, Delete, Get, HttpStatus, Param, ParseFilePipeBuilder, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { GetImagesDto, UploadImageDto } from "./image.dtos";
import { ImageService } from "./image.service";

@Controller("image")
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @Body() body: UploadImageDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp("image/jpeg|image/png|image/jpg"),
        })
        .addMaxSizeValidator({
          maxSize: 2 * 1024 * 1024,
          message: "File size must be less than 2MB",
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    )
    file: any
  ) {
    return this.imageService.uploadImage(file, body.hotelId);
  }

  @Get()
  async getImages(@Query() query: GetImagesDto) {
    return this.imageService.getImages(query);
  }

  @Delete(":id")
  async deleteImage(@Param("id") id: string) {
    return this.imageService.deleteImage(id);
  }
}
