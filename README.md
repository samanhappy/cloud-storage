# Cloud Storage MCP Server

A Model Context Protocol (MCP) server that provides file upload functionality with support for multiple cloud storage backends including Amazon S3, Qiniu Cloud Storage, and Alibaba Cloud OSS.

## Features

- **Multi-backend Support**: AWS S3 (v3 SDK), Qiniu, and Alibaba Cloud OSS
- **File Validation**: Size limits, MIME type filtering, filename validation
- **Flexible Configuration**: Environment variables or JSON config file
- **HTTP Transport**: Streamable HTTP transport for better performance and scalability
- **Stateless Operation**: No session management for better scalability
- **Integrated Download URLs**: Generate signed download URLs directly from upload
- **Type Safety**: Built with TypeScript and Zod validation

## Supported Storage Backends

1. **Amazon S3** - Industry standard object storage (using AWS SDK v3)
2. **Qiniu Cloud Storage** - Popular Chinese cloud storage service
3. **Alibaba Cloud OSS** - Alibaba's object storage service

## Installation

```bash
npm install
npm run build
```

## Configuration

### Option 1: Environment Variables

Copy `.env.example` to `.env` and configure your storage backend:

```bash
cp .env.example .env
```

Example for AWS S3:
```bash
CLOUD_STORAGE_BACKEND=aws-s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Option 2: Configuration File

Copy `config.example.json` to `config.json` and customize:

```bash
cp config.example.json config.json
```

## Usage

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The server will start on port 3000 by default (configurable via PORT environment variable).

### MCP Client Configuration

Add this server to your MCP client configuration:

```json
{
  "servers": {
    "cloud-storage": {
      "type": "http",
      "url": "http://localhost:3000"
    }
  }
}
```

For VS Code with the MCP extension, add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "cloud-storage": {
      "type": "http", 
      "url": "http://localhost:3000"
    }
  }
}
```

## Available Tools

### 1. Upload File
Upload a file to cloud storage and get its accessible URL. Optionally generate a signed download URL.

```json
{
  "tool": "upload_file",
  "arguments": {
    "fileData": "base64-encoded-file-content",
    "filename": "example.jpg",
    "contentType": "image/jpeg",
    "metadata": {
      "uploadedBy": "user123"
    },
    "generateDownloadUrl": true,
    "downloadUrlExpiration": 3600
  }
}
```

Response includes both public URL and optional signed download URL:
```json
{
  "success": true,
  "url": "https://your-bucket.s3.amazonaws.com/uploads/2024-01-01/uuid.jpg",
  "filename": "uploads/2024-01-01/uuid.jpg",
  "size": 12345,
  "contentType": "image/jpeg",
  "metadata": {
    "backend": "AWS S3",
    "bucket": "your-bucket",
    "key": "uploads/2024-01-01/uuid.jpg"
  },
  "downloadUrl": "https://your-bucket.s3.amazonaws.com/uploads/2024-01-01/uuid.jpg?X-Amz-Algorithm=...",
  "downloadUrlExpiration": 3600
}
```

### 2. Delete File
Delete a file from cloud storage.

```json
{
  "tool": "delete_file", 
  "arguments": {
    "url": "https://your-bucket.s3.amazonaws.com/uploads/file.jpg"
  }
}
```

## Available Resources

### Storage Configuration
Get current configuration and status:
- Resource URI: `storage://config`

### Usage Examples  
Get documentation and examples:
- Resource URI: `storage://examples`

## Backend-Specific Configuration

### AWS S3

Required environment variables:
```bash
CLOUD_STORAGE_BACKEND=aws-s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

Optional:
```bash
AWS_S3_ENDPOINT=https://s3.amazonaws.com
```

**Note**: This version uses AWS SDK v3 for better performance and smaller bundle size.

### Qiniu Cloud Storage

Required environment variables:
```bash
CLOUD_STORAGE_BACKEND=qiniu
QINIU_ACCESS_KEY=your-access-key
QINIU_SECRET_KEY=your-secret-key
QINIU_BUCKET=your-bucket-name
QINIU_DOMAIN=https://your-domain.com
```

Optional:
```bash
QINIU_ZONE=z0  # z0, z1, z2, na0, as0
```

### Alibaba Cloud OSS

Required environment variables:
```bash
CLOUD_STORAGE_BACKEND=alibaba-oss
ALIBABA_ACCESS_KEY_ID=your-access-key
ALIBABA_ACCESS_KEY_SECRET=your-secret-key
ALIBABA_OSS_BUCKET=your-bucket-name
ALIBABA_OSS_REGION=oss-cn-beijing
```

Optional:
```bash
ALIBABA_OSS_ENDPOINT=https://oss-cn-beijing.aliyuncs.com
```

## Optional Configuration

```bash
# File size limit in bytes (default: 10MB)
MAX_FILE_SIZE=10485760

# Comma-separated list of allowed MIME types
ALLOWED_MIME_TYPES=image/jpeg,image/png,application/pdf

# URL prefix for returned URLs
URL_PREFIX=https://cdn.yourdomain.com/

# Path to JSON config file (alternative to env vars)
CONFIG_FILE=./config.json

# Server port (default: 3000)
PORT=3000
```

## Key Changes in This Version

### 1. AWS SDK v3 Migration
- Upgraded from AWS SDK v2 to v3 for better performance
- Smaller bundle size and modular imports
- Improved TypeScript support

### 2. HTTP Transport
- Migrated from stdio transport to StreamableHTTPServerTransport
- Better scalability and performance
- Support for HTTP requests and responses

### 3. Stateless Operation
- No session management for better horizontal scaling
- Each request is independent
- Simplified deployment and maintenance

### 4. Integrated Download URLs
- Removed separate `get_download_url` tool
- Download URL generation integrated into `upload_file` tool
- Optional parameter to generate signed URLs during upload

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run watch

# Build for production
npm run build

# Run built version
npm start
```

## Project Structure

```
src/
├── backends/           # Storage backend implementations
│   ├── s3.ts          # AWS S3 backend
│   ├── qiniu.ts       # Qiniu backend
│   ├── alibaba-oss.ts # Alibaba OSS backend
│   └── index.ts       # Backend factory
├── config/            # Configuration management
│   └── index.ts       # Config loader and validator
├── services/          # Business logic
│   └── cloud-storage.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Utility functions
│   └── file-validator.ts
└── index.ts           # Main MCP server
```

## Error Handling

The server provides detailed error messages for common issues:

- **Configuration errors**: Invalid or missing configuration
- **File validation errors**: File too large, invalid MIME type, etc.
- **Upload failures**: Network issues, permissions, etc.
- **Backend errors**: Service-specific error messages

## Security Considerations

- Validate file types and sizes before upload
- Use IAM roles with minimal required permissions
- Consider using signed URLs for sensitive files
- Regularly rotate access keys
- Monitor usage and costs

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the configuration examples
2. Review error messages in the console
3. Verify your cloud storage credentials and permissions
4. Open an issue with details about your setup
