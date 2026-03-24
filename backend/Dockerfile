# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only manifest files first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: runtime ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Ensure the app user owns the working directory
RUN chown -R appuser:appgroup /app
USER appuser

# Port the Express server listens on (matches env.example default)
EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]
