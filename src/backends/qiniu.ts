import * as qiniu from 'qiniu';
import { StorageBackend, UploadResult, QiniuConfig } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class QiniuBackend implements StorageBackend {
  public readonly name = 'Qiniu Cloud Storage';
  private config: qiniu.conf.Config;
  private bucketManager: qiniu.rs.BucketManager;
  private formUploader: qiniu.form_up.FormUploader;
  private putPolicy: qiniu.rs.PutPolicy;

  constructor(private qiniuConfig: QiniuConfig) {
    // Configure Qiniu
    const mac = new qiniu.auth.digest.Mac(qiniuConfig.accessKey, qiniuConfig.secretKey);
    
    this.config = new qiniu.conf.Config();
    // Set zone if provided
    if (qiniuConfig.zone) {
      const zoneMap: Record<string, any> = {
        'z0': qiniu.zone.Zone_z0, // 华东
        'z1': qiniu.zone.Zone_z1, // 华北
        'z2': qiniu.zone.Zone_z2, // 华南
        'na0': qiniu.zone.Zone_na0, // 北美
        'as0': qiniu.zone.Zone_as0, // 东南亚
      };
      this.config.zone = zoneMap[qiniuConfig.zone] || qiniu.zone.Zone_z0;
    }

    this.bucketManager = new qiniu.rs.BucketManager(mac, this.config);
    this.formUploader = new qiniu.form_up.FormUploader(this.config);
    this.putPolicy = new qiniu.rs.PutPolicy({
      scope: qiniuConfig.bucket,
    });
    this.putPolicy.returnBody = '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}';
  }

  async upload(file: Buffer, filename: string, contentType?: string): Promise<UploadResult> {
    try {
      const key = this.generateKey(filename);
      const mac = new qiniu.auth.digest.Mac(this.qiniuConfig.accessKey, this.qiniuConfig.secretKey);
      const uploadToken = this.putPolicy.uploadToken(mac);

      const putExtra = new qiniu.form_up.PutExtra();
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

            const url = `${this.qiniuConfig.domain}/${key}`;
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
      // For public bucket, return direct URL
      const publicUrl = `${this.qiniuConfig.domain}/${key}`;
      
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
    return `uploads/${timestamp}/${uuid}.${extension}`;
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
