import { z } from 'zod';
import { CloudStorageConfig, S3Config, QiniuConfig, AlibabaOSSConfig } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Zod schemas for validation
const S3ConfigSchema = z.object({
  type: z.literal('aws-s3'),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  region: z.string(),
  bucket: z.string(),
  endpoint: z.string().optional(),
  prefix: z.string().optional(),
  cdn: z.string().optional(),
});

const QiniuConfigSchema = z.object({
  type: z.literal('qiniu'),
  accessKey: z.string(),
  secretKey: z.string(),
  bucket: z.string(),
  domain: z.string(),
  zone: z.string().optional(),
  prefix: z.string().optional(),
  cdn: z.string().optional(),
});

const AlibabaOSSConfigSchema = z.object({
  type: z.literal('alibaba-oss'),
  accessKeyId: z.string(),
  accessKeySecret: z.string(),
  bucket: z.string(),
  region: z.string(),
  endpoint: z.string().optional(),
  prefix: z.string().optional(),
  cdn: z.string().optional(),
});

const BackendConfigSchema = z.discriminatedUnion('type', [
  S3ConfigSchema,
  QiniuConfigSchema,
  AlibabaOSSConfigSchema,
]);

const CloudStorageConfigSchema = z.object({
  backend: BackendConfigSchema,
  maxFileSize: z.number().positive().optional().default(10 * 1024 * 1024), // 10MB default
  allowedMimeTypes: z.array(z.string()).optional(),
  urlPrefix: z.string().optional(),
  expirationTime: z.number().positive().optional().default(3600), // 1 hour default
});

export class ConfigManager {
  private config: CloudStorageConfig | null = null;

  /**
   * Load configuration from environment variables
   */
  loadFromEnv(): CloudStorageConfig {
    const backendType = process.env.CLOUD_STORAGE_BACKEND as 'aws-s3' | 'qiniu' | 'alibaba-oss';
    
    if (!backendType) {
      throw new Error('CLOUD_STORAGE_BACKEND environment variable is required');
    }

    let backendConfig;

    switch (backendType) {
      case 'aws-s3':
        backendConfig = {
          type: 'aws-s3' as const,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          region: process.env.AWS_REGION || 'us-east-1',
          bucket: process.env.AWS_S3_BUCKET || '',
          endpoint: process.env.AWS_S3_ENDPOINT,
          prefix: process.env.AWS_S3_PREFIX,
          cdn: process.env.AWS_S3_CDN,
        };
        break;

      case 'qiniu':
        backendConfig = {
          type: 'qiniu' as const,
          accessKey: process.env.QINIU_ACCESS_KEY || '',
          secretKey: process.env.QINIU_SECRET_KEY || '',
          bucket: process.env.QINIU_BUCKET || '',
          domain: process.env.QINIU_DOMAIN || '',
          zone: process.env.QINIU_ZONE,
          prefix: process.env.QINIU_PREFIX,
          cdn: process.env.QINIU_CDN,
        };
        break;

      case 'alibaba-oss':
        backendConfig = {
          type: 'alibaba-oss' as const,
          accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID || '',
          accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET || '',
          bucket: process.env.ALIBABA_OSS_BUCKET || '',
          region: process.env.ALIBABA_OSS_REGION || '',
          endpoint: process.env.ALIBABA_OSS_ENDPOINT,
          prefix: process.env.ALIBABA_OSS_PREFIX,
          cdn: process.env.ALIBABA_OSS_CDN,
        };
        break;

      default:
        throw new Error(`Unsupported backend type: ${backendType}`);
    }

    const config = {
      backend: backendConfig,
      maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : undefined,
      allowedMimeTypes: process.env.ALLOWED_MIME_TYPES ? process.env.ALLOWED_MIME_TYPES.split(',') : undefined,
      urlPrefix: process.env.URL_PREFIX,
      expirationTime: process.env.EXPIRATION_TIME ? parseInt(process.env.EXPIRATION_TIME) : undefined,
    };

    this.config = CloudStorageConfigSchema.parse(config);
    return this.config;
  }

  /**
   * Load configuration from JSON file
   */
  loadFromFile(filePath: string): CloudStorageConfig {
    try {
      const configContent = fs.readFileSync(filePath, 'utf-8');
      const configData = JSON.parse(configContent);
      this.config = CloudStorageConfigSchema.parse(configData);
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load config from file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load configuration from multiple sources with priority:
   * 1. Command line argument (config file path)
   * 2. Environment variable CONFIG_FILE
   * 3. Environment variables
   */
  load(configFilePath?: string): CloudStorageConfig {
    // Try config file first (from argument or env)
    const configFile = configFilePath || process.env.CONFIG_FILE;
    
    if (configFile && fs.existsSync(configFile)) {
      return this.loadFromFile(configFile);
    }

    // Fall back to environment variables
    return this.loadFromEnv();
  }

  /**
   * Get current configuration
   */
  getConfig(): CloudStorageConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config;
  }

  /**
   * Validate backend configuration
   */
  static validateBackendConfig(config: any): boolean {
    try {
      BackendConfigSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  }
}
