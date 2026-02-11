import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { GetImagesDto } from "./image.dtos";

@Injectable()
export class ImageService {
  @Inject(PLATFORM_SERVICE)
  private readonly platformClient: ClientProxy;

  async uploadImage(file: any, hotelId: string) {
    return this.platformClient.send({ cmd: "upload_image" }, { file, hotelId });
  }

  async getImages(query: GetImagesDto) {
    return this.platformClient.send({ cmd: "get_images" }, query);
  }

  async deleteImage(id: string) {
    return this.platformClient.send({ cmd: "delete_image" }, { id });
  }
}
