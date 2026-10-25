import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { StorageDriver } from './storage.interface';

@Injectable()
export class S3Storage implements StorageDriver {
  private readonly s3 = new S3Client({ region: process.env.S3_REGION });
  async save(key: string, data: Buffer, mime: string): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET, Key: key, Body: data, ContentType: mime,
      CacheControl: 'public, max-age=31536000, immutable',   // tên file có hash => cache vĩnh viễn
    }));
    return `${process.env.CDN_BASE}/${key}`;
  }
}
