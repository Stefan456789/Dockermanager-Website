# Use the official Node.js image as the base image
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy the built application from the base stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/next.config.ts ./
COPY --from=base /app/package.json ./

# Copy public directory
COPY ./public ./public

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application
CMD ["pnpm", "start"]
