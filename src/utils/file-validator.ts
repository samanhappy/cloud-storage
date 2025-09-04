import { CloudStorageConfig } from '../types/index.js';

export class FileValidator {
  constructor(private config: CloudStorageConfig) {}

  validateFile(file: Buffer, filename: string, contentType?: string): void {
    this.validateFileSize(file);
    this.validateMimeType(contentType);
    this.validateFilename(filename);
  }

  private validateFileSize(file: Buffer): void {
    if (this.config.maxFileSize && file.length > this.config.maxFileSize) {
      throw new Error(`File size ${file.length} bytes exceeds maximum allowed size of ${this.config.maxFileSize} bytes`);
    }
  }

  private validateMimeType(contentType?: string): void {
    if (!this.config.allowedMimeTypes || !contentType) {
      return; // No restrictions or no content type provided
    }

    if (!this.config.allowedMimeTypes.includes(contentType)) {
      throw new Error(`Content type '${contentType}' is not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`);
    }
  }

  private validateFilename(filename: string): void {
    if (!filename || filename.trim().length === 0) {
      throw new Error('Filename cannot be empty');
    }

    // Check for dangerous characters
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
      throw new Error('Filename contains invalid characters');
    }

    // Check filename length (reasonable limit)
    if (filename.length > 255) {
      throw new Error('Filename is too long (maximum 255 characters)');
    }
  }

  static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }

  static getMimeTypeFromExtension(filename: string): string {
    const extension = FileValidator.getFileExtension(filename);
    
    const mimeTypes: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'm4a': 'audio/mp4',
      
      // Video
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      
      // Code
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'html': 'text/html',
      'css': 'text/css',
      'csv': 'text/csv',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}
