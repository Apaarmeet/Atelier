FROM oven/bun:1 as base

WORKDIR /app

# Copy the lockfile and package.json files
COPY bun.lock package.json ./
COPY apps/orchestrator/package.json ./apps/orchestrator/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN bun run postinstall

# Expose the port the orchestrator runs on
EXPOSE 3001

# Start the orchestrator
CMD ["bun", "run", "--cwd", "apps/orchestrator", "start"]
