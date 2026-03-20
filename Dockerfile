FROM node:20-alpine

WORKDIR /app

# Build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Initialize database schema (before pruning devDeps since tsx is needed)
RUN npx tsx scripts/init-db.ts

# Remove devDependencies
RUN npm prune --production

# Create data directory
RUN mkdir -p data

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node", "server.js"]
