#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ConfigManager } from './config/index.js';
import { CloudStorageService } from './services/cloud-storage.js';

// Configuration schema for the upload tool
const UploadFileInputSchema = {
  fileData: z.string().describe('Base64 encoded file data'),
  filename: z.string().describe('Name of the file to upload'),
  contentType: z.string().optional().describe('MIME type of the file (optional, will be auto-detected)'),
  metadata: z.record(z.string()).optional().describe('Additional metadata for the file'),
};

const DeleteFileInputSchema = {
  url: z.string().describe('URL of the file to delete'),
};

const GetDownloadUrlInputSchema = {
  key: z.string().describe('Key/path of the file in storage'),
  expirationTime: z.number().optional().describe('URL expiration time in seconds (default: 3600)'),
};

class CloudStorageMCPServer {
  private server: McpServer;
  private storageService: CloudStorageService | null = null;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
    
    this.server = new McpServer({
      name: 'cloud-storage-mcp-server',
      version: '1.0.0',
    });

    this.setupTools();
    this.setupResources();
  }

  private setupTools() {
    // Upload file tool
    this.server.registerTool(
      'upload_file',
      {
        title: 'Upload File to Cloud Storage',
        description: 'Upload a file to the configured cloud storage backend and return its accessible URL',
        inputSchema: UploadFileInputSchema,
      },
      async ({ fileData, filename, contentType, metadata }: {
        fileData: string;
        filename: string;
        contentType?: string;
        metadata?: Record<string, string>;
      }) => {
        try {
          if (!this.storageService) {
            throw new Error('Cloud storage not configured. Please check your configuration.');
          }

          // Decode base64 file data
          const fileBuffer = Buffer.from(fileData, 'base64');
          
          // Upload the file
          const result = await this.storageService.uploadFile(fileBuffer, filename, {
            contentType,
            metadata,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  url: result.url,
                  filename: result.filename,
                  size: result.size,
                  contentType: result.contentType,
                  metadata: result.metadata,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Delete file tool
    this.server.registerTool(
      'delete_file',
      {
        title: 'Delete File from Cloud Storage',
        description: 'Delete a file from cloud storage using its URL',
        inputSchema: DeleteFileInputSchema,
      },
      async ({ url }: { url: string }) => {
        try {
          if (!this.storageService) {
            throw new Error('Cloud storage not configured. Please check your configuration.');
          }

          await this.storageService.deleteFile(url);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'File deleted successfully',
                  url,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  url,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Get download URL tool
    this.server.registerTool(
      'get_download_url',
      {
        title: 'Generate Download URL',
        description: 'Generate a signed download URL for a file in cloud storage',
        inputSchema: GetDownloadUrlInputSchema,
      },
      async ({ key, expirationTime }: {
        key: string;
        expirationTime?: number;
      }) => {
        try {
          if (!this.storageService) {
            throw new Error('Cloud storage not configured. Please check your configuration.');
          }

          const url = await this.storageService.getDownloadUrl(key, expirationTime);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  downloadUrl: url,
                  key,
                  expirationTime: expirationTime || 3600,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  key,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  private setupResources() {
    // Storage configuration resource
    this.server.registerResource(
      'storage-config',
      'storage://config',
      {
        title: 'Storage Configuration',
        description: 'Current cloud storage configuration and status',
        mimeType: 'application/json',
      },
      async () => {
        try {
          const configSummary = this.storageService?.getConfigSummary() || { error: 'Not configured' };
          const backendInfo = this.storageService?.getBackendInfo() || { error: 'Not configured' };

          const status = {
            configured: !!this.storageService,
            backend: backendInfo,
            config: configSummary,
            supportedBackends: ['aws-s3', 'qiniu', 'alibaba-oss'],
          };

          return {
            contents: [
              {
                uri: 'storage://config',
                text: JSON.stringify(status, null, 2),
                mimeType: 'application/json',
              },
            ],
          };
        } catch (error) {
          return {
            contents: [
              {
                uri: 'storage://config',
                text: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Unknown error',
                }, null, 2),
                mimeType: 'application/json',
              },
            ],
          };
        }
      }
    );

    // Usage examples resource
    this.server.registerResource(
      'usage-examples',
      'storage://examples',
      {
        title: 'Usage Examples',
        description: 'Examples of how to use the cloud storage tools',
        mimeType: 'text/markdown',
      },
      async () => {
        const examples = `# Cloud Storage MCP Server Usage Examples

## Upload a File

\`\`\`json
{
  "tool": "upload_file",
  "arguments": {
    "fileData": "base64-encoded-file-content",
    "filename": "example.jpg",
    "contentType": "image/jpeg",
    "metadata": {
      "uploadedBy": "user123",
      "category": "profile-photo"
    }
  }
}
\`\`\`

## Delete a File

\`\`\`json
{
  "tool": "delete_file",
  "arguments": {
    "url": "https://your-bucket.s3.amazonaws.com/uploads/2024-01-01/uuid.jpg"
  }
}
\`\`\`

## Generate Download URL

\`\`\`json
{
  "tool": "get_download_url",
  "arguments": {
    "key": "uploads/2024-01-01/uuid.jpg",
    "expirationTime": 3600
  }
}
\`\`\`

## Configuration

Set environment variables:

### AWS S3
\`\`\`bash
export CLOUD_STORAGE_BACKEND=aws-s3
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
export AWS_S3_BUCKET=your-bucket-name
\`\`\`

### Qiniu Cloud Storage
\`\`\`bash
export CLOUD_STORAGE_BACKEND=qiniu
export QINIU_ACCESS_KEY=your-access-key
export QINIU_SECRET_KEY=your-secret-key
export QINIU_BUCKET=your-bucket-name
export QINIU_DOMAIN=https://your-domain.com
\`\`\`

### Alibaba Cloud OSS
\`\`\`bash
export CLOUD_STORAGE_BACKEND=alibaba-oss
export ALIBABA_ACCESS_KEY_ID=your-access-key
export ALIBABA_ACCESS_KEY_SECRET=your-secret-key
export ALIBABA_OSS_BUCKET=your-bucket-name
export ALIBABA_OSS_REGION=oss-cn-beijing
\`\`\`
`;

        return {
          contents: [
            {
              uri: 'storage://examples',
              text: examples,
              mimeType: 'text/markdown',
            },
          ],
        };
      }
    );
  }

  private async initializeStorage() {
    try {
      const config = this.configManager.load();
      this.storageService = new CloudStorageService(config);
      console.error(`✅ Cloud storage initialized with ${config.backend.type} backend`);
    } catch (error) {
      console.error(`❌ Failed to initialize cloud storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('💡 Please check your configuration and try again.');
    }
  }

  async start() {
    // Initialize storage configuration
    await this.initializeStorage();

    // Start the MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('🚀 Cloud Storage MCP Server started');
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new CloudStorageMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { CloudStorageMCPServer };
