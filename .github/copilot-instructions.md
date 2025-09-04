<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements: TypeScript MCP Server for cloud storage with multi-backend support (S3, Qiniu, Alibaba Cloud)

- [x] Scaffold the Project: Complete MCP server project structure with TypeScript, SDK dependencies, and cloud storage backends

- [x] Customize the Project: Implemented multi-backend cloud storage MCP server with upload, delete, and download URL tools

- [x] Install Required Extensions: No specific extensions required - TypeScript support included

- [x] Compile the Project: Successfully compiled TypeScript to JavaScript with all dependencies

- [x] Create and Run Task: Project includes npm scripts for development and production

- [x] Launch the Project: MCP server ready to run with proper configuration

- [x] Ensure Documentation is Complete: README.md, configuration examples, and copilot instructions completed

## Project Optimizations Completed

- [x] **AWS SDK v3 Migration**: Upgraded from AWS SDK v2 to v3 for better performance and smaller bundle size
- [x] **HTTP Transport**: Migrated from StdioServerTransport to StreamableHTTPServerTransport for better scalability
- [x] **Stateless Operation**: Removed session management for horizontal scaling support
- [x] **Integrated Download URLs**: Removed separate get_download_url tool and integrated functionality into upload_file tool
- [x] **Modern Architecture**: Server now uses HTTP transport with stateless design for better performance and scalability

## Key Features

- Multi-backend cloud storage support (AWS S3, Qiniu, Alibaba Cloud OSS)
- AWS SDK v3 for improved performance
- HTTP-based MCP server with stateless architecture
- Integrated file upload with optional signed download URL generation
- TypeScript with full type safety
- Comprehensive error handling and validation
- Production-ready configuration management
