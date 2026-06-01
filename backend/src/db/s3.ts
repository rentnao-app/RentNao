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
  getObjectMetadata(key: string): Promise<{ contentLength: number; contentType: string } | null>;
}

export class LocalS3StorageProvider implements StorageProvider {
  private internalClient: S3Client;
  private signingClient: S3Client;
  private bucket: string;
  private internalEndpoint: string;
  private publicEndpoint: string;

  constructor() {
    this.internalEndpoint = env.S3_INTERNAL_ENDPOINT || env.S3_ENDPOINT || 'http://localhost:9000';
    this.publicEndpoint = env.S3_PUBLIC_ENDPOINT || env.S3_ENDPOINT || this.internalEndpoint;
    this.bucket = env.S3_BUCKET || 'rentnao-dev';

    const baseConfig = {
      region: env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: env.S3_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    };

    this.internalClient = new S3Client({
      ...baseConfig,
      endpoint: this.internalEndpoint,
    });

    this.signingClient = new S3Client({
      ...baseConfig,
      endpoint: this.publicEndpoint,
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
    const uploadUrl = await getSignedUrl(this.signingClient, command, { expiresIn });

    return { uploadUrl, expiresIn };
  }

  async presignDownload(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.signingClient, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.internalClient.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.internalClient.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getObjectMetadata(
    key: string
  ): Promise<{ contentLength: number; contentType: string } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.internalClient.send(command);
      return {
        contentLength: response.ContentLength ?? 0,
        contentType: response.ContentType ?? '',
      };
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error?.name === 'NoSuchKey' ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const command = new HeadBucketCommand({
        Bucket: this.bucket,
      });

      await this.internalClient.send(command);
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
      await this.internalClient.send(headCommand);
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
      await this.internalClient.send(createCommand);
      console.log(`[S3] Created bucket: ${this.bucket}`);
    } catch (error: any) {
      const alreadyExists =
        error?.name === 'BucketAlreadyOwnedByYou' || error?.name === 'BucketAlreadyExists';

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
