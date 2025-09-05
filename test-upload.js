#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpload() {
  try {
    // Read a test file
    const testFilePath = path.join(__dirname, 'test.txt');
    const fileContent = fs.readFileSync(testFilePath);
    const base64Content = fileContent.toString('base64');
    
    // Prepare upload request
    const uploadRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'upload_file',
        arguments: {
          fileData: base64Content,
          filename: 'test-upload.txt',
          contentType: 'text/plain',
          metadata: {
            test: 'true',
            uploadedBy: 'test-script'
          }
        }
      }
    };

    // Send request to MCP server
    const response = await fetch('http://localhost:3000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(uploadRequest)
    });

    const result = await response.json();
    console.log('Upload result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpload();
