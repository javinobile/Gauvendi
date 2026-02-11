import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Image } from '@src/core/entities/image.entity';
import { Repository } from 'typeorm';
import { UploadImageDto } from './image.dtos';
import { S3Service } from '@src/core/s3/s3.service';
import { DbName } from '@src/core/constants/db-name.constant';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image, DbName.Postgres)
    private readonly imageRepository: Repository<Image>,

    private readonly s3Service: S3Service
  ) {}

  async uploadImage(payload: UploadImageDto & { file: Express.Multer.File }) {
    try {
      const { file, hotelId } = payload;

      if (!hotelId) {
        throw new BadRequestException('Hotel ID is required');
      }

      const originalFileName = file?.originalname?.replace(/\s+/g, '_');

      const fileName = `${Date.now()}_${originalFileName}`;

      const fileKey = `${hotelId}/images/${fileName}`;

      await this.s3Service.uploadFile(file, fileKey);

      const lastedImageSequence = await this.imageRepository.findOne({
        where: { hotelId },
        order: { sequence: 'DESC' }
      });

      const image = await this.imageRepository.save({
        hotelId,
        imageUrl: fileKey,
        sequence: lastedImageSequence?.sequence ? lastedImageSequence.sequence + 1 : 1,
        size: file.size,
        mimeType: file.mimetype,
        fileName: originalFileName
      });

      return image;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteImage(payload: { id: string }) {
    try {
      const { id } = payload;

      if (!id) {
        throw new BadRequestException('Image ID is required');
      }

      const image = await this.imageRepository.findOne({
        where: { id }
      });

      if (!image) {
        throw new BadRequestException('Image not found');
      }

      await this.imageRepository.delete(id);

      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getImages(payload: { hotelId: string }) {
    try {
      const { hotelId } = payload;

      if (!hotelId) {
        throw new BadRequestException('Hotel ID is required');
      }

      const images = await this.imageRepository.find({
        where: { hotelId },
        order: { sequence: 'DESC', createdAt: 'DESC' }
      });

      // map presign url:
      const presignedImages = await Promise.all(
        images.map(async (image) => {
          if (!image.imageUrl) {
            return image;
          }

          return {
            ...image,
            imageUrl: await this.s3Service.getPreSignedUrl(image.imageUrl),
            imageKey: image.imageUrl // keep the key to help client assign to other entities
          };
        })
      );

      return presignedImages;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
