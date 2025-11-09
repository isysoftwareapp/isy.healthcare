# Use official Node.js image as the base
FROM node:20-alpine

# Allow choosing JS-only bcrypt implementation at build time to avoid native compilation on low-RAM builders.
# Default to using bcryptjs (1) to skip installing build toolchain on constrained hosts.
ARG USE_BCRYPTJS=1

# Install build dependencies only when native modules are required
RUN if [ "$USE_BCRYPTJS" -eq "0" ]; then apk add --no-cache python3 build-base; fi

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer cache
COPY package*.json ./

# If USE_BCRYPTJS=1 we rewrite package.json to remove native `bcrypt` and ensure `bcryptjs` is present.
# This prevents npm from attempting to compile native bindings on low-RAM builders.
RUN if [ "$USE_BCRYPTJS" -eq "1" ]; then \
			node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json')); if(p.dependencies && p.dependencies['bcrypt']){delete p.dependencies['bcrypt'];} if(!p.dependencies) p.dependencies={}; if(!p.dependencies['bcryptjs']) p.dependencies['bcryptjs']='^2.4.3'; fs.writeFileSync('package.json', JSON.stringify(p,null,2));"; \
		fi

# Install dependencies deterministically. Use npm ci when possible for speed.
# If we rewrote package.json to prefer bcryptjs, regenerate a matching package-lock
# before running `npm ci` so lockfile and package.json are in sync.
RUN if [ "$USE_BCRYPTJS" -eq "1" ]; then \
			echo "Regenerating package-lock to match rewritten package.json"; \
			npm install --legacy-peer-deps --package-lock-only; \
		fi && npm ci --legacy-peer-deps

# Copy the rest of the application code (.dockerignore excludes node_modules)
COPY . .

# Rebuild bcrypt only when using the native implementation
RUN if [ "$USE_BCRYPTJS" -eq "0" ]; then npm rebuild bcrypt --build-from-source; else echo "Skipping bcrypt native rebuild (using bcryptjs)"; fi

# Set environment variables for build (placeholder - will be overridden at runtime)
ENV MONGODB_URI="mongodb://localhost:27017/isy_clinic"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-secret-placeholder"

# Increase Node.js max heap during the build to avoid "heap out of memory" on machines with limited RAM.
# Adjust this value to match available memory on your VPS (4096 = 4GB, 8192 = 8GB).
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV TSC_COMPILE_ON_ERROR=true

# Build the Next.js app (uses NODE_OPTIONS to increase the heap)
# Build the Next.js app
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production --legacy-peer-deps

# Expose port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
