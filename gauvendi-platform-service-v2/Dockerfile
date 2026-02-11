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
RUN npm i -g pm2

# Copy built app from builder
COPY --from=builder /app/dist ./dist
# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
# COPY entrypoint.sh /entrypoint.sh
# # Install dos2unix, convert line endings, và set executable
# RUN apk add --no-cache dos2unix \
#     && dos2unix /entrypoint.sh \
#     && chmod +x /entrypoint.sh
# Set env
ENV NODE_ENV=production
# Expose port
EXPOSE 3333

# Start app
ENTRYPOINT ["/entrypoint.sh"]
# CMD ["npm", "run", "start:prod"]
CMD ["pm2-runtime", "start", "dist/main.js", "--name", "gauvendi-platform-service-v2", "-i", "3", "--max-memory-restart", "2G"]