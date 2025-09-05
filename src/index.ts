#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'node:http';
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

class CloudStorageMCPServer {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  private getStorageService(): CloudStorageService {
    // Create a new instance each time (stateless)
    const config = this.configManager.load();
    return new CloudStorageService(config);
  }

  private setupTools(server: McpServer) {
    // Upload file tool with automatic download URL generation
    server.registerTool(
      'upload_file',
      {
        title: 'Upload File to Cloud Storage',
        description: 'Upload a file to the configured cloud storage backend and automatically return its accessible URL with download URL.',
        inputSchema: UploadFileInputSchema,
      },
      async ({ fileData, filename, contentType, metadata }: {
        fileData: string;
        filename: string;
        contentType?: string;
        metadata?: Record<string, string>;
      }) => {
        try {
          const storageService = this.getStorageService();

          // Decode base64 file data
          const fileBuffer = Buffer.from(fileData, 'base64');
          
          // Upload the file
          const result = await storageService.uploadFile(fileBuffer, filename, {
            contentType,
            metadata,
          });

          const response: any = {
            success: true,
            url: result.url,
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2),
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
    server.registerTool(
      'delete_file',
      {
        title: 'Delete File from Cloud Storage',
        description: 'Delete a file from cloud storage using its URL',
        inputSchema: DeleteFileInputSchema,
      },
      async ({ url }: { url: string }) => {
        try {
          const storageService = this.getStorageService();
          await storageService.deleteFile(url);

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
  }

  private setupResources(server: McpServer) {
    // Storage configuration resource
    server.registerResource(
      'storage-config',
      'storage://config',
      {
        title: 'Storage Configuration',
        description: 'Current cloud storage configuration and status',
        mimeType: 'application/json',
      },
      async () => {
        try {
          const storageService = this.getStorageService();
          const configSummary = storageService.getConfigSummary();
          const backendInfo = storageService.getBackendInfo();

          const status = {
            configured: true,
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
                  configured: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  supportedBackends: ['aws-s3', 'qiniu', 'alibaba-oss'],
                }, null, 2),
                mimeType: 'application/json',
              },
            ],
          };
        }
      }
    );

    // Usage examples resource
    server.registerResource(
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
    },
    "generateDownloadUrl": true,
    "downloadUrlExpiration": 3600
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

  private createServer(): McpServer {
    const server = new McpServer({
      name: 'cloud-storage-mcp-server',
      version: '1.0.0',
    });

    this.setupTools(server);
    this.setupResources(server);
    
    return server;
  }

  async start() {
    try {
      // Test configuration on startup
      this.getStorageService();
      console.error('✅ Cloud storage configuration validated');
    } catch (error) {
      console.error(`❌ Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('💡 Please check your configuration and try again.');
    }

    // Create server instance
    const server = this.createServer();

    // Create HTTP transport (stateless mode)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
      enableJsonResponse: true,
    });
    
    await server.connect(transport);

    // Create HTTP server to handle requests
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const httpServer = createServer((req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Health check endpoint
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          service: 'cloud-storage-mcp-server' 
        }));
        return;
      }

      // Handle MCP requests
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const parsedBody = JSON.parse(body);
            transport.handleRequest(req, res, parsedBody);
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else {
        transport.handleRequest(req, res);
      }
    });

    httpServer.listen(port, () => {
      console.error(`🚀 Cloud Storage MCP Server started on port ${port}`);
      console.error(`📡 Server is running in stateless mode`);
      console.error(`🔗 Connect to: http://localhost:${port}`);
    });
  }
}

// Start the server
if (import.meta.url.endsWith((process.argv[1] || '').replace(/\\/g, '/'))) {
  console.error('Starting server...');
  const server = new CloudStorageMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { CloudStorageMCPServer };
