# Cloud Storage MCP Server

A Model Context Protocol (MCP) server that provides file upload functionality with support for multiple cloud storage backends including Amazon S3, Qiniu Cloud Storage, and Alibaba Cloud OSS.

## Features

- **Multi-backend Support**: AWS S3, Qiniu, and Alibaba Cloud OSS
- **File Validation**: Size limits, MIME type filtering, filename validation
- **Flexible Configuration**: Environment variables or JSON config file
- **MCP Tools**: Upload, delete, and generate download URLs for files
- **Type Safety**: Built with TypeScript and Zod validation

## Supported Storage Backends

1. **Amazon S3** - Industry standard object storage
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

### MCP Client Configuration

Add this server to your MCP client configuration:

```json
{
  "servers": {
    "cloud-storage": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

For VS Code with the MCP extension, add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "cloud-storage": {
      "type": "stdio", 
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

## Available Tools

### 1. Upload File
Upload a file to cloud storage and get its accessible URL.

```json
{
  "tool": "upload_file",
  "arguments": {
    "fileData": "base64-encoded-file-content",
    "filename": "example.jpg",
    "contentType": "image/jpeg",
    "metadata": {
      "uploadedBy": "user123"
    }
  }
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

### 3. Generate Download URL
Generate a signed download URL for private files.

```json
{
  "tool": "get_download_url",
  "arguments": {
    "key": "uploads/2024-01-01/file.jpg",
    "expirationTime": 3600
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
```

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
