import AWS from 'aws-sdk';
import { StorageBackend, UploadResult, S3Config } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class S3Backend implements StorageBackend {
  public readonly name = 'AWS S3';
  private s3: AWS.S3;
  private bucket: string;

  constructor(private config: S3Config) {
    this.bucket = config.bucket;
    
    // Configure AWS
    AWS.config.update({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
    });

    // Create S3 instance
    this.s3 = new AWS.S3({
      endpoint: config.endpoint,
      s3ForcePathStyle: !!config.endpoint, // Use path-style URLs for custom endpoints
    });
  }

  async upload(file: Buffer, filename: string, contentType?: string): Promise<UploadResult> {
    try {
      // Generate unique key
      const key = this.generateKey(filename);
      
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType || 'application/octet-stream',
        // Make file publicly readable by default
        ACL: 'public-read',
      };

      const result = await this.s3.upload(uploadParams).promise();
      
      return {
        url: result.Location,
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
      
      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
    } catch (error) {
      throw new Error(`S3 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDownloadUrl(key: string, expirationTime = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expirationTime,
      };

      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateKey(filename: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uuid = uuidv4();
    const extension = filename.split('.').pop();
    return `uploads/${timestamp}/${uuid}.${extension}`;
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
