import { S3Client, PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { StorageBackend, UploadResult, S3Config } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class S3Backend implements StorageBackend {
  public readonly name = 'AWS S3';
  private s3Client: S3Client;
  private bucket: string;

  constructor(private config: S3Config) {
    this.bucket = config.bucket;
    
    // Create S3 client with v3 SDK
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && {
        endpoint: config.endpoint,
        forcePathStyle: true,
      }),
    });
  }

  async upload(file: Buffer, filename: string, contentType?: string): Promise<UploadResult> {
    try {
      // Generate unique key with optional prefix
      const key = this.generateKey(filename);
      
      const uploadParams: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType || 'application/octet-stream',
        // Make file publicly readable by default
        // ACL: 'public-read',
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);
      
      // Construct the public URL with CDN support
      let url: string;
      if (this.config.cdn) {
        // Use CDN URL if configured
        url = `${this.config.cdn.replace(/\/$/, '')}/${key}`;
      } else {
        // Use default S3 URL
        const baseUrl = this.config.endpoint || `https://${this.bucket}.s3.${this.config.region}.amazonaws.com`;
        url = `${baseUrl}/${key}`;
      }
      
      return {
        url,
        filename: key,
        size: file.length,
        contentType,
        metadata: {
          backend: this.name,
          bucket: this.bucket,
          key: key,
        },
      };
    } catch (error) {
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(url: string): Promise<void> {
    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(url);
      
      const deleteParams: DeleteObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(`S3 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDownloadUrl(key: string, expirationTime = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: expirationTime });
    } catch (error) {
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateKey(filename: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uuid = uuidv4();
    const extension = filename.split('.').pop();
    const baseKey = `uploads/${timestamp}/${uuid}.${extension}`;
    
    // Add prefix if configured
    return this.config.prefix ? `${this.config.prefix.replace(/\/$/, '')}/${baseKey}` : baseKey;
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // For AWS S3 URLs, the key is the pathname without the leading slash
      return urlObj.pathname.substring(1);
    } catch {
      // If URL parsing fails, assume the entire string is the key
      return url;
    }
  }
}
