import OSS from 'ali-oss';
import { StorageBackend, UploadResult, AlibabaOSSConfig } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class AlibabaOSSBackend implements StorageBackend {
  public readonly name = 'Alibaba Cloud OSS';
  private client: OSS;
  private bucket: string;

  constructor(private config: AlibabaOSSConfig) {
    this.bucket = config.bucket;
    
    this.client = new OSS({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
      region: config.region,
      endpoint: config.endpoint,
    });
  }

  async upload(file: Buffer, filename: string, contentType?: string): Promise<UploadResult> {
    try {
      const key = this.generateKey(filename);
      
      const options: any = {};
      if (contentType) {
        options.headers = {
          'Content-Type': contentType,
        };
      }

      const result = await this.client.put(key, file, options);
      
      // Use CDN URL if configured, otherwise use the default URL
      const url = this.config.cdn ? `${this.config.cdn.replace(/\/$/, '')}/${key}` : result.url;
      
      return {
        url,
        filename: key,
        size: file.length,
        contentType,
        metadata: {
          backend: this.name,
          bucket: this.bucket,
          key: key,
          etag: (result.res.headers as any).etag,
        },
      };
    } catch (error) {
      throw new Error(`Alibaba OSS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(url: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(url);
      await this.client.delete(key);
    } catch (error) {
      throw new Error(`Alibaba OSS delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDownloadUrl(key: string, expirationTime = 3600): Promise<string> {
    try {
      const url = this.client.signatureUrl(key, {
        expires: expirationTime,
        method: 'GET',
      });
      return url;
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
      // For Alibaba OSS URLs, the key is the pathname without the leading slash
      return urlObj.pathname.substring(1);
    } catch {
      // If URL parsing fails, assume the entire string is the key
      return url;
    }
  }
}
