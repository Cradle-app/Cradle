# Custom Dockerfile for Railway deployment
# Uses Node.js 20.19+ which is required by Prisma

FROM node:20.19-slim

# Install OpenSSL and other dependencies required by Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./

# Copy all package.json files from workspaces
COPY apps/orchestrator/package.json ./apps/orchestrator/
COPY apps/web/package.json ./apps/web/
COPY packages/blueprint-schema/package.json ./packages/blueprint-schema/
COPY packages/github/package.json ./packages/github/
COPY packages/plugin-sdk/package.json ./packages/plugin-sdk/
COPY packages/plugins/package.json ./packages/plugins/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

# Expose port (Railway will override this with PORT env var)
EXPOSE 3000

# Start the orchestrator
CMD ["pnpm", "start:orchestrator"]
