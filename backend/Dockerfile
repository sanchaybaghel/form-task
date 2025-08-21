# Production stage
FROM node:18-alpine

# Install wget for healthcheck (if not already present)
RUN apk add --no-cache wget

# Create app directory and non-root user
WORKDIR /app



# Copy package files first (for better caching)
COPY --chown=node:node package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code with proper ownership
COPY --chown=node:node . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R node:node uploads && chmod 755 uploads

# Switch to non-root user
USER node

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start the application
CMD ["node", "index.js"]