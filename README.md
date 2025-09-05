# Cloud Storage MCP Server

A Model Context Protocol (MCP) server that provides file upload functionality with support for multiple cloud storage backends including Amazon S3, Qiniu Cloud Storage, and Alibaba Cloud OSS.

## Features

- **Multi-backend Support**: AWS S3 (v3 SDK), Qiniu, and Alibaba Cloud OSS
- **File Validation**: Size limits, MIME type filtering, filename validation
- **Flexible Configuration**: Environment variables or JSON config file
- **HTTP Transport**: Streamable HTTP transport for better performance and scalability
- **Stateless Operation**: No session management for better scalability
- **Automatic Download URLs**: Generate signed download URLs automatically for every upload
- **CDN Support**: Optional CDN configuration for faster file access
- **Path Prefix**: Configurable path prefix for organized file storage
- **Type Safety**: Built with TypeScript and Zod validation
- **Docker Support**: Container-ready with health checks and multi-stage builds

## Supported Storage Backends

1. **Amazon S3** - Industry standard object storage (using AWS SDK v3)
2. **Qiniu Cloud Storage** - Popular Chinese cloud storage service
3. **Alibaba Cloud OSS** - Alibaba's object storage service

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your cloud storage credentials

# Start development server
pnpm dev
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t cloud-storage-mcp .
docker run -p 3000:3000 --env-file .env cloud-storage-mcp
```

## Configuration

### Environment Variables

Key configuration options:

```bash
# MCP Server
MCP_SERVER_PORT=3000

# Backend Selection
CLOUD_STORAGE_BACKEND=aws-s3  # aws-s3, qiniu, alibaba-oss

# Common Settings
EXPIRATION_TIME=3600          # Download URL expiration (seconds)
MAX_FILE_SIZE=10485760        # Max file size (bytes)

# AWS S3 with CDN and prefix example
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=my-bucket
AWS_S3_PREFIX=my-app          # Files saved under my-app/uploads/...
AWS_S3_CDN=https://cdn.example.com  # Use CDN for faster access

# Qiniu with CDN and prefix
QINIU_ACCESS_KEY=your-key
QINIU_SECRET_KEY=your-secret
QINIU_BUCKET=my-bucket
QINIU_DOMAIN=files.example.com
QINIU_PREFIX=my-app
QINIU_CDN=https://cdn.example.com

# Alibaba OSS with CDN and prefix
ALIBABA_ACCESS_KEY_ID=your-key
ALIBABA_ACCESS_KEY_SECRET=your-secret
ALIBABA_OSS_BUCKET=my-bucket
ALIBABA_OSS_REGION=oss-cn-hangzhou
ALIBABA_OSS_PREFIX=my-app
ALIBABA_OSS_CDN=https://cdn.example.com
```

### Configuration File

Alternatively, use a JSON configuration file:

```json
{
  "backend": {
    "type": "aws-s3",
    "accessKeyId": "your-key",
    "secretAccessKey": "your-secret",
    "region": "us-east-1",
    "bucket": "my-bucket",
    "prefix": "my-app",
    "cdn": "https://cdn.example.com"
  },
  "expirationTime": 3600,
  "maxFileSize": 10485760
}
```
## Available Tools

### 1. Upload File
Upload a file to cloud storage and automatically get both its public URL and a signed download URL.

```json
{
  "tool": "upload_file",
  "arguments": {
    "fileData": "base64-encoded-file-content",
    "filename": "example.jpg",
    "contentType": "image/jpeg"
  }
}
```

Response includes both public URL and signed download URL:
```json
{
  "success": true,
  "url": "https://cdn.example.com/my-app/uploads/2024-01-01/uuid.jpg"
}
```

### 2. Delete File
Delete a file from cloud storage.

```json
{
  "tool": "delete_file", 
  "arguments": {
    "url": "https://cdn.example.com/my-app/uploads/file.jpg"
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

## Docker Deployment

### Using Docker Compose (Recommended)

1. Copy environment configuration:
```bash
cp .env.example .env
# Edit .env with your cloud storage credentials
```

2. Start the service:
```bash
docker-compose up -d
```

3. Check service health:
```bash
curl http://localhost:3000/health
```

### Manual Docker Build

```bash
# Build the image
docker build -t cloud-storage-mcp .

# Run with environment file
docker run -p 3000:3000 --env-file .env cloud-storage-mcp

# Or run with individual environment variables
docker run -p 3000:3000 \
  -e CLOUD_STORAGE_BACKEND=aws-s3 \
  -e AWS_ACCESS_KEY_ID=your-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret \
  -e AWS_S3_BUCKET=your-bucket \
  cloud-storage-mcp
```

### Docker Features

- **Multi-stage build** for optimal image size
- **Non-root user** for security
- **Health checks** for monitoring
- **Port exposure** on 3000
- **Production optimizations**

## Optional Configuration

```bash
# File size limit in bytes (default: 10MB)
MAX_FILE_SIZE=10485760

# Comma-separated list of allowed MIME types
ALLOWED_MIME_TYPES=image/jpeg,image/png,application/pdf

# URL prefix for returned URLs
URL_PREFIX=https://cdn.yourdomain.com/

# Download URL expiration time in seconds (default: 1 hour)
EXPIRATION_TIME=3600

# Path to JSON config file (alternative to env vars)
CONFIG_FILE=./config.json

# Server port (default: 3000)
MCP_SERVER_PORT=3000
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

### 4. Automatic Download URLs
- Always generate signed download URLs for uploaded files
- Expiration time configurable via environment variable
- No separate tool needed for URL generation

### 5. CDN and Prefix Support
- Optional CDN configuration for faster file access
- Configurable path prefix for organized storage
- Per-backend CDN and prefix settings

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
