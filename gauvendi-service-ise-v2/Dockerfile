# 1️⃣ Build stage
FROM node:21-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps (including devDeps for build)
RUN npm i

# Copy source code
COPY . .

# Build app
RUN npm run build:prod

# 2️⃣ Runtime stage
FROM node:21-alpine AS runner
WORKDIR /app

# Copy package files for prod deps install
COPY package*.json ./

# Install only prod deps
RUN npm i --only=production

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Set env
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "run", "start:prod"]
