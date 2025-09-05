import qiniu from 'qiniu';
import { StorageBackend, UploadResult, QiniuConfig } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class QiniuBackend implements StorageBackend {
  public readonly name = 'Qiniu Cloud Storage';
  private config: any;
  private bucketManager: any;
  private formUploader: any;
  private putPolicy: any;
  private mac: any;

  constructor(private qiniuConfig: QiniuConfig) {
    // Validate required configuration
    if (!qiniuConfig.accessKey || !qiniuConfig.secretKey) {
      throw new Error('Qiniu access key and secret key are required');
    }
    if (!qiniuConfig.bucket) {
      throw new Error('Qiniu bucket is required');
    }
    if (!qiniuConfig.domain) {
      throw new Error('Qiniu domain is required');
    }
    
    try {
      // Configure Qiniu with CommonJS compatibility
      const Mac = qiniu.auth?.digest?.Mac || (qiniu as any).auth?.digest?.Mac;
      const Config = qiniu.conf?.Config || (qiniu as any).conf?.Config;
      const BucketManager = qiniu.rs?.BucketManager || (qiniu as any).rs?.BucketManager;
      const FormUploader = qiniu.form_up?.FormUploader || (qiniu as any).form_up?.FormUploader;
      const PutPolicy = qiniu.rs?.PutPolicy || (qiniu as any).rs?.PutPolicy;
      
      if (!Mac || !Config || !BucketManager || !FormUploader || !PutPolicy) {
        throw new Error('Failed to load Qiniu SDK components');
      }

      this.mac = new Mac(qiniuConfig.accessKey, qiniuConfig.secretKey);
      
      this.config = new Config();
      // Set zone if provided
      if (qiniuConfig.zone) {
        const zones = qiniu.zone || (qiniu as any).zone;
        const zoneMap: Record<string, any> = {
          'z0': zones.Zone_z0, // 华东
          'z1': zones.Zone_z1, // 华北
          'z2': zones.Zone_z2, // 华南
          'na0': zones.Zone_na0, // 北美
          'as0': zones.Zone_as0, // 东南亚
        };
        this.config.zone = zoneMap[qiniuConfig.zone] || zones.Zone_z0;
      }

      this.bucketManager = new BucketManager(this.mac, this.config);
      this.formUploader = new FormUploader(this.config);
      this.putPolicy = new PutPolicy({
        scope: qiniuConfig.bucket,
      });
      this.putPolicy.returnBody = '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}';
    } catch (error) {
      throw new Error(`Failed to initialize Qiniu backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async upload(file: Buffer, filename: string, contentType?: string): Promise<UploadResult> {
    try {
      const key = this.generateKey(filename);
      const uploadToken = this.putPolicy.uploadToken(this.mac);

      const PutExtra = qiniu.form_up?.PutExtra || (qiniu as any).form_up?.PutExtra;
      const putExtra = new PutExtra();
      if (contentType) {
        putExtra.mimeType = contentType;
      }

      return new Promise((resolve, reject) => {
        this.formUploader.put(
          uploadToken,
          key,
          file,
          putExtra,
          (err: any, body: any, info: any) => {
            if (err) {
              reject(new Error(`Qiniu upload failed: ${err.message || err}`));
              return;
            }

            if (info.statusCode !== 200) {
              reject(new Error(`Qiniu upload failed with status ${info.statusCode}: ${JSON.stringify(body)}`));
              return;
            }

            const baseUrl = this.qiniuConfig.cdn || this.qiniuConfig.domain;
            const url = `${baseUrl}/${key}`;
            resolve({
              url,
              filename: key,
              size: file.length,
              contentType,
              metadata: {
                backend: this.name,
                bucket: this.qiniuConfig.bucket,
                key: key,
                hash: body.hash,
              },
            });
          }
        );
      });
    } catch (error) {
      throw new Error(`Qiniu upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(url: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(url);
      
      return new Promise((resolve, reject) => {
        this.bucketManager.delete(
          this.qiniuConfig.bucket,
          key,
          (err: any, body: any, info: any) => {
            if (err) {
              reject(new Error(`Qiniu delete failed: ${err.message || err}`));
              return;
            }

            if (info.statusCode !== 200 && info.statusCode !== 612) {
              // 612 means file not found, which is OK for delete operation
              reject(new Error(`Qiniu delete failed with status ${info.statusCode}: ${JSON.stringify(body)}`));
              return;
            }

            resolve();
          }
        );
      });
    } catch (error) {
      throw new Error(`Qiniu delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDownloadUrl(key: string, expirationTime = 3600): Promise<string> {
    try {
      // Use CDN URL if configured, otherwise use domain
      const baseUrl = this.qiniuConfig.cdn || this.qiniuConfig.domain;
      const publicUrl = `${baseUrl}/${key}`;
      
      // For private bucket, you would need to generate signed URL
      // This is a simplified implementation - in production you may need
      // to handle private buckets differently
      return publicUrl;
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
    return this.qiniuConfig.prefix ? `${this.qiniuConfig.prefix.replace(/\/$/, '')}/${baseKey}` : baseKey;
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // For Qiniu URLs, the key is the pathname without the leading slash
      return urlObj.pathname.substring(1);
    } catch {
      // If URL parsing fails, assume the entire string is the key
      return url;
    }
  }
}
