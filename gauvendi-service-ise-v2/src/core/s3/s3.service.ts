import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '../constants/environment.const';
import { MulterFile } from './multer-file.dto';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>(ENVIRONMENT.S3_REGION);
    const accessKeyId = this.configService.get<string>(ENVIRONMENT.S3_ACCESS_KEY_ID);
    const secretAccessKey = this.configService.get<string>(ENVIRONMENT.S3_SECRET_ACCESS_KEY);

    // Ensure credentials are defined before creating the S3Client
    if (!region || !accessKeyId || !secretAccessKey) {
      this.logger.warn('Missing S3 configuration');
      return;
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    const bucketName = this.configService.get<string>(ENVIRONMENT.S3_BUCKET_NAME);
    if (!bucketName) {
      this.logger.warn('Missing S3 bucket configuration');
      return;
    }

    this.logger.verbose(`S3Service initialized with bucket: ${bucketName}`);
  }

  async uploadFile(file: MulterFile, key: string) {
    // Handle both buffer and data properties that might be present in the file
    const fileContent = file.buffer || file.data;

    // Check if fileContent is a Buffer or an object with data array
    const body = Buffer.isBuffer(fileContent)
      ? fileContent
      : fileContent && typeof fileContent === 'object' && 'data' in fileContent
        ? Buffer.from(fileContent?.['data'])
        : null;

    if (!body) {
      this.logger.error('Invalid file content: No buffer or data found');
      throw new InternalServerErrorException('Invalid file content');
    }

    const params = {
      Bucket: this.configService.get<string>(ENVIRONMENT.S3_BUCKET_NAME),
      Key: key,
      Body: body,
      ContentType: file.mimetype
    };

    try {
      const response = await this.s3Client.send(new PutObjectCommand(params));
      this.logger.log(JSON.stringify(response));
      return response;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`);
      throw new InternalServerErrorException('Error uploading file to S3');
    }
  }

  async getPreSignedUrl(objectKey: string) {
    if (!objectKey) return '';

    const expiresIn = 3600;
    try {
      // Check if objectKey contains assets URL pattern
      if (objectKey.includes('https://assets') || objectKey.includes('http://assets')) {
        return objectKey;
      }

      const bucketName = this.configService.get<string>(ENVIRONMENT.S3_BUCKET_NAME);
      const cdnEnabled = this.configService.get<string>(ENVIRONMENT.S3_CDN_ENABLED) === 'true';
      const cdnUrl = this.configService.get<string>(ENVIRONMENT.S3_CDN_URL);

      // Use CDN domain if enabled
      const baseUrl = cdnUrl && cdnUrl ? cdnUrl.replace(/\/$/, '') : `${bucketName}`;

      // Public URL (through CDN or S3 endpoint)
      const publicUrl = `${baseUrl}/${objectKey}`;

      if (cdnEnabled) {
        return publicUrl;
      }

      // Signed S3 URL (only works for direct S3 access, not CDN!)
      const objCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
      });
      const signedUrl = await getSignedUrl(this.s3Client, objCommand, { expiresIn });

      return signedUrl;
    } catch (error) {
      this.logger.error(`Error getting pre-signed URL: ${error.message}`);
      throw new InternalServerErrorException('Error getting pre-signed URL');
    }
  }

  async getDownloadUrl(objectKey: string, expiresIn = 3600) {
    try {
      const objCommand = new GetObjectCommand({
        Bucket: this.configService.get<string>(ENVIRONMENT.S3_BUCKET_NAME),
        Key: objectKey,
        ResponseContentDisposition: 'attachment'
      });
      const url = await getSignedUrl(this.s3Client, objCommand, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Error getting download URL: ${error.message}`);
      throw new InternalServerErrorException('Error getting download URL');
    }
  }

  async listObjects(prefix: string): Promise<ListObjectsV2CommandOutput> {
    const command = new ListObjectsV2Command({
      Bucket: this.configService.get<string>(ENVIRONMENT.S3_BUCKET_NAME),
      Prefix: prefix,
      Delimiter: '/'
    });

    try {
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      this.logger.error(`Error listing objects: ${error.message}`);
      throw new InternalServerErrorException('Error listing objects');
    }
  }

  async deleteFile(key: string): Promise<string> {
    const deleteParams = {
      Bucket: this.configService.get<string>(ENVIRONMENT.S3_BUCKET_NAME),
      Key: key
    };

    try {
      const command = new DeleteObjectCommand(deleteParams);
      await this.s3Client.send(command);
      return key;
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw new InternalServerErrorException('Error deleting file');
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<string> {
    const copyParams = {
      Bucket: this.configService.get<string>(ENVIRONMENT.S3_BUCKET_NAME),
      CopySource: `${this.configService.get<string>(ENVIRONMENT.S3_BUCKET_NAME)}/${sourceKey}`,
      Key: destinationKey
    };

    try {
      const command = new CopyObjectCommand(copyParams);
      await this.s3Client.send(command);
      return destinationKey;
    } catch (error) {
      this.logger.error(`Error copying file: ${error.message}`);
      throw new InternalServerErrorException('Error copying file');
    }
  }
}
