# Frontend Dockerfile for InterviewMaster AI
# Node 20 with Vite

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=development

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

# Run the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
