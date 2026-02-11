# 1️⃣ Build stage
FROM node:21-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps (including devDeps for build)
RUN npm ci

# Copy source code
COPY . .

# Build app
RUN npm run build:prod

# 2️⃣ Runtime stage
FROM node:21-alpine AS runner
WORKDIR /app

# ✅ Install PM2 globally
RUN npm install -g pm2

# Copy package files for prod deps install
COPY package*.json ./

# Install only prod deps
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Set env
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# ✅ Use PM2 to manage clustering (5 instances max)
CMD ["pm2-runtime", "start", "dist/main.js", "--name", "nestjs-app", "-i", "5", "--max-memory-restart", "512M"]