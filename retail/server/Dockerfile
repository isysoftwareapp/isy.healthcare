# Retail Server API

FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY server/package*.json ./
RUN npm install

# Copy server source
COPY server/ ./

# Expose API port
EXPOSE 3001

# Start server with tsx
CMD ["npx", "tsx", "index.ts"]
