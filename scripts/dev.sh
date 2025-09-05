#!/bin/bash

# Development script for the MCP server
# Starts the server with environment validation

echo "🚀 Starting Cloud Storage MCP Server in development mode"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Validate required environment variables
source .env

if [ -z "$CLOUD_STORAGE_BACKEND" ]; then
    echo "❌ CLOUD_STORAGE_BACKEND not set in .env"
    exit 1
fi

echo "✅ Using backend: $CLOUD_STORAGE_BACKEND"

case $CLOUD_STORAGE_BACKEND in
    "aws-s3")
        if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_S3_BUCKET" ]; then
            echo "❌ Missing AWS S3 configuration"
            exit 1
        fi
        echo "✅ AWS S3 configuration validated"
        ;;
    "qiniu")
        if [ -z "$QINIU_ACCESS_KEY" ] || [ -z "$QINIU_SECRET_KEY" ] || [ -z "$QINIU_BUCKET" ] || [ -z "$QINIU_DOMAIN" ]; then
            echo "❌ Missing Qiniu configuration"
            exit 1
        fi
        echo "✅ Qiniu configuration validated"
        ;;
    "alibaba-oss")
        if [ -z "$ALIBABA_ACCESS_KEY_ID" ] || [ -z "$ALIBABA_ACCESS_KEY_SECRET" ] || [ -z "$ALIBABA_OSS_BUCKET" ] || [ -z "$ALIBABA_OSS_REGION" ]; then
            echo "❌ Missing Alibaba OSS configuration"
            exit 1
        fi
        echo "✅ Alibaba OSS configuration validated"
        ;;
    *)
        echo "❌ Unknown backend: $CLOUD_STORAGE_BACKEND"
        exit 1
        ;;
esac

echo "🔧 Starting development server..."
pnpm run dev
