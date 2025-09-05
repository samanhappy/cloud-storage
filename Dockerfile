# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Remove dev dependencies after build to reduce image size
RUN pnpm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cloudstore -u 1001

# Change ownership of the app directory
RUN chown -R cloudstore:nodejs /app

# Switch to non-root user
USER cloudstore

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 3000, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) process.exit(0); \
      else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();" || exit 1

# Start the application
CMD ["pnpm", "start"]
