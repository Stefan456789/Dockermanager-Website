# Use the official Node.js 18 image as the base for building
FROM node:18 AS builder

# Enable corepack for pnpm
RUN corepack enable pnpm

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Copy .env for environment variables
COPY .env ./

# Build the application
RUN pnpm run build

# Production stage
FROM node:18 AS runner

# Enable corepack for pnpm
RUN corepack enable pnpm

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml for production dependencies
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application with environment variable logging
CMD ["sh", "-c", "echo 'NEXT_PUBLIC environment variables:' && env | grep NEXT_PUBLIC && echo 'Starting Next.js app...' && pnpm start"]
