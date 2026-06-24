import {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/config/env';
import { AppError } from '@/errors/base';

const s3 = new S3Client({
  region: env.AWS_REGION || 'us-east-1',
  endpoint: env.S3_INTERNAL_ENDPOINT || env.S3_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const signingClient = new S3Client({
  region: env.AWS_REGION || 'us-east-1',
  endpoint: env.S3_PUBLIC_ENDPOINT || env.S3_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const BUCKET = env.S3_BUCKET || 'rentnao-dev';
const DEED_PREFIX = 'deeds';
const DOWNLOAD_URL_TTL = 15 * 60; // 15 minutes

// Track whether we've verified the bucket exists this session
let bucketVerified = false;

async function ensureBucket(): Promise<void> {
  if (bucketVerified) return;

  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    bucketVerified = true;
    return;
  } catch (error: any) {
    const notFound =
      error?.name === 'NotFound' ||
      error?.name === 'NoSuchBucket' ||
      error?.$metadata?.httpStatusCode === 404;

    if (!notFound) throw error;
  }

  try {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`[Storage Service] Created bucket: ${BUCKET}`);
    bucketVerified = true;
  } catch (error: any) {
    if (error?.name !== 'BucketAlreadyOwnedByYou' && error?.name !== 'BucketAlreadyExists') {
      throw error;
    }
    bucketVerified = true;
  }
}

/**
 * Uploads the generated rent deed PDF to S3.
 * Returns the S3 object key (NOT a presigned URL).
 *
 * Storage path: deeds/{dealId}/rent_deed.pdf
 */
export async function uploadDeedToStorage(dealId: string, pdfBuffer: Buffer): Promise<string> {
  // Buffer validation — reject empty or corrupted PDFs
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new AppError(500, 'PDF generation produced an empty buffer');
  }

  const key = `${DEED_PREFIX}/${dealId}/rent_deed.pdf`;

  try {
    // Ensure bucket exists (MinIO/CI — checked once per process lifetime)
    await ensureBucket();

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ContentDisposition: `attachment; filename="rent_deed_${dealId}.pdf"`,
      Metadata: {
        'deal-id': dealId,
        'generated-at': new Date().toISOString(),
      },
    });

    await s3.send(putCommand);
    console.log(`[Storage Service] Uploaded deed to s3://${BUCKET}/${key}`);
  } catch (error: any) {
    console.error('[Storage Service] Upload failed:', {
      dealId,
      bucket: BUCKET,
      key,
      error: error?.message,
      code: error?.name,
    });
    throw new AppError(502, 'Failed to upload rent deed to storage');
  }

  return key;
}

/**
 * Generates a short-lived (15 min) presigned download URL for a stored deed.
 * Call this on-demand whenever the owner or tenant requests a download.
 */
export async function generateDeedDownloadUrl(objectKey: string): Promise<string> {
  try {
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    });

    return await getSignedUrl(signingClient, getCommand, { expiresIn: DOWNLOAD_URL_TTL });
  } catch (error: any) {
    console.error('[Storage Service] Failed to generate download URL:', {
      objectKey,
      error: error?.message,
    });
    throw new AppError(502, 'Failed to generate deed download link');
  }
}
