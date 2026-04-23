import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/config/env';

export interface UploadOptions {
  fileName: string;
  mimeType: string;
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
}

export interface PresignedUrl {
  uploadUrl: string;
  expiresIn: number;
}

export interface StorageProvider {
  presignUpload(key: string, options: UploadOptions): Promise<PresignedUrl>;
  presignDownload(key: string, expiresInSeconds?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export class LocalS3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.endpoint = env.S3_ENDPOINT || 'http://localhost:9000';
    this.bucket = env.S3_BUCKET || 'rentnao-dev';

    this.client = new S3Client({
      region: env.AWS_REGION || 'us-east-1',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: env.S3_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async presignUpload(key: string, options: UploadOptions): Promise<PresignedUrl> {
    const { fileName, mimeType } = options;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        'original-filename': fileName,
      },
      ACL: 'private',
    });

    const expiresIn = 3600;
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return { uploadUrl, expiresIn };
  }

  async presignDownload(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const command = new HeadBucketCommand({
        Bucket: this.bucket,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      console.error('[S3] Health check failed:', {
        message: error.message,
        name: error.name,
      });
      return false;
    }
  }

  async ensureBucketExists(): Promise<void> {
    try {
      const headCommand = new HeadBucketCommand({
        Bucket: this.bucket,
      });
      await this.client.send(headCommand);
      return;
    } catch (error: any) {
      const notFound =
        error?.name === 'NotFound' ||
        error?.name === 'NoSuchBucket' ||
        error?.$metadata?.httpStatusCode === 404;

      if (!notFound) {
        throw error;
      }
    }

    try {
      const createCommand = new CreateBucketCommand({
        Bucket: this.bucket,
      });
      await this.client.send(createCommand);
      console.log(`[S3] Created bucket: ${this.bucket}`);
    } catch (error: any) {
      const alreadyExists =
        error?.name === 'BucketAlreadyOwnedByYou' ||
        error?.name === 'BucketAlreadyExists';

      if (!alreadyExists) {
        throw error;
      }
    }
  }
}

export const storage = new LocalS3StorageProvider();

/**
 * Ensure target bucket exists (create if missing)
 */
export async function ensureS3Bucket(): Promise<void> {
  try {
    await storage.ensureBucketExists();
  } catch (error: any) {
    console.error('[S3] Bucket initialization failed:', {
      message: error.message,
      name: error.name,
    });
    throw error;
  }
}

/**
 * Check if S3 storage is configured and reachable
 */
export async function checkS3Health(): Promise<boolean> {
  return storage.isHealthy();
}
