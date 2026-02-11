import { Controller } from '@nestjs/common';
import { ImageService } from './image.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UploadImageDto } from './image.dtos';

@Controller()
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @MessagePattern({ cmd: 'upload_image' })
  async uploadImage(@Payload() payload: UploadImageDto & { file: any }) {
    return this.imageService.uploadImage(payload);
  }

  @MessagePattern({ cmd: 'delete_image' })
  async deleteImage(@Payload() payload: { id: string }) {
    return this.imageService.deleteImage(payload);
  }

  @MessagePattern({ cmd: 'get_images' })
  async getImages(@Payload() payload: { hotelId: string }) {
    return this.imageService.getImages(payload);
  }
}
