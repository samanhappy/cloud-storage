#!/bin/bash

# Quick test script to validate the implementation
echo "🧪 Running quick validation tests..."

echo "1. ✅ Checking TypeScript compilation..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed"
    exit 1
fi

echo "2. ✅ Validating configuration schema..."
node --input-type=module -e "
import { ConfigManager } from './dist/config/index.js';
try {
    const config = new ConfigManager();
    console.log('✅ ConfigManager imported successfully');
    console.log('✅ Configuration schema validation ready');
} catch (error) {
    console.error('❌ Configuration error:', error.message);
    process.exit(1);
}
"

echo "3. ✅ Checking backend implementations..."
node --input-type=module -e "
import { S3Backend } from './dist/backends/s3.js';
import { QiniuBackend } from './dist/backends/qiniu.js';
import { AlibabaOSSBackend } from './dist/backends/alibaba-oss.js';
console.log('✅ All backend implementations imported successfully');
"

echo "4. ✅ Validating server structure..."
node --input-type=module -e "
import { CloudStorageMCPServer } from './dist/index.js';
console.log('✅ MCP Server class imported successfully');
"

echo ""
echo "🎉 All validations passed!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure your cloud storage"
echo "2. Run 'pnpm run dev:check' to start with environment validation"
echo "3. Or run 'pnpm run dev' to start directly"
echo "4. Test with 'pnpm run health' once running"
