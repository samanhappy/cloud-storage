import { StorageBackend, UploadResult, CloudStorageConfig } from '../types/index.js';
import { BackendFactory } from '../backends/index.js';
import { FileValidator } from '../utils/file-validator.js';

export class CloudStorageService {
  private backend: StorageBackend;
  private validator: FileValidator;

  constructor(private config: CloudStorageConfig) {
    this.backend = BackendFactory.create(config.backend);
    this.validator = new FileValidator(config);
  }

  /**
   * Upload a file to the configured cloud storage backend
   */
  async uploadFile(
    file: Buffer, 
    filename: string, 
    options: {
      contentType?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<UploadResult> {
    try {
      // Auto-detect content type if not provided
      const contentType = options.contentType || FileValidator.getMimeTypeFromExtension(filename);
      
      // Validate the file
      this.validator.validateFile(file, filename, contentType);

      // Upload to the backend
      const result = await this.backend.upload(file, filename, contentType);

      // Merge additional metadata
      if (options.metadata) {
        result.metadata = {
          ...result.metadata,
          ...options.metadata,
        };
      }

      return result;
    } catch (error) {
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from cloud storage
   */
  async deleteFile(url: string): Promise<void> {
    try {
      // Remove URL prefix if configured
      let cleanUrl = url;
      if (this.backend.delete) {
        await this.backend.delete(cleanUrl);
      } else {
        throw new Error(`Delete operation not supported by ${this.backend.name}`);
      }
    } catch (error) {
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a signed download URL for a file
   */
  async getDownloadUrl(key: string, expirationTime?: number): Promise<string> {
    try {
      if (this.backend.getDownloadUrl) {
        return await this.backend.getDownloadUrl(key, expirationTime);
      } else {
        throw new Error(`Download URL generation not supported by ${this.backend.name}`);
      }
    } catch (error) {
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get backend information
   */
  getBackendInfo(): { name: string; type: string } {
    return {
      name: this.backend.name,
      type: this.config.backend.type,
    };
  }

  /**
   * Get configuration summary (without sensitive data)
   */
  getConfigSummary(): any {
    return {
      backend: this.config.backend.type,
      maxFileSize: this.config.maxFileSize,
      allowedMimeTypes: this.config.allowedMimeTypes,
    };
  }
}
