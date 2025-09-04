import { StorageBackend, BackendConfig, S3Config, QiniuConfig, AlibabaOSSConfig } from '../types/index.js';
import { S3Backend } from './s3.js';
import { QiniuBackend } from './qiniu.js';
import { AlibabaOSSBackend } from './alibaba-oss.js';

export class BackendFactory {
  static create(config: BackendConfig): StorageBackend {
    switch (config.type) {
      case 'aws-s3':
        return new S3Backend(config as S3Config);
      
      case 'qiniu':
        return new QiniuBackend(config as QiniuConfig);
      
      case 'alibaba-oss':
        return new AlibabaOSSBackend(config as AlibabaOSSConfig);
      
      default:
        throw new Error(`Unsupported backend type: ${(config as any).type}`);
    }
  }

  static getSupportedBackends(): string[] {
    return ['aws-s3', 'qiniu', 'alibaba-oss'];
  }
}

// Export all backends
export { S3Backend } from './s3.js';
export { QiniuBackend } from './qiniu.js';
export { AlibabaOSSBackend } from './alibaba-oss.js';
