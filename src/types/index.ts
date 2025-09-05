export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageBackend {
  name: string;
  upload(file: Buffer, filename: string, contentType?: string): Promise<UploadResult>;
  delete?(url: string): Promise<void>;
  getDownloadUrl?(key: string, expirationTime?: number): Promise<string>;
}

export interface BackendConfig {
  type: 'aws-s3' | 'qiniu' | 'alibaba-oss';
  [key: string]: any;
}

export interface CloudStorageConfig {
  backend: BackendConfig;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  urlPrefix?: string;
  expirationTime?: number; // Download URL expiration time in seconds, default 1 hour
}

export interface S3Config extends BackendConfig {
  type: 'aws-s3';
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint?: string;
  prefix?: string; // Optional path prefix for bucket
  cdn?: string; // Optional CDN URL for file access
}

export interface QiniuConfig extends BackendConfig {
  type: 'qiniu';
  accessKey: string;
  secretKey: string;
  bucket: string;
  domain: string;
  zone?: string;
  prefix?: string; // Optional path prefix for bucket
  cdn?: string; // Optional CDN URL for file access
}

export interface AlibabaOSSConfig extends BackendConfig {
  type: 'alibaba-oss';
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint?: string;
  prefix?: string; // Optional path prefix for bucket
  cdn?: string; // Optional CDN URL for file access
}
