# Use official Node.js image as the base
FROM node:20-alpine

# Install build dependencies for native modules (bcrypt, etc)
RUN apk add --no-cache python3 build-base

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy the rest of the application code (.dockerignore excludes node_modules)
COPY . .

# Rebuild bcrypt for Alpine Linux (crucial for native modules)
RUN npm rebuild bcrypt --build-from-source

# Set environment variables for build (placeholder - will be overridden at runtime)
ENV MONGODB_URI="mongodb://localhost:27017/isy_clinic"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-secret-placeholder"

# Increase Node.js max heap during the build to avoid "heap out of memory" on machines with limited RAM.
# Adjust this value to match available memory on your VPS (4096 = 4GB, 8192 = 8GB).
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV TSC_COMPILE_ON_ERROR=true

# Build the Next.js app (uses NODE_OPTIONS to increase the heap)
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production --legacy-peer-deps

# Expose port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
