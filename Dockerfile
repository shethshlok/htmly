# Use the official Bun image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
# If you have a lockfile, copy it too (optional but recommended)
COPY bun.lockb* ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Ensure the public directory exists
RUN mkdir -p public

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Expose the web server port
EXPOSE 3000

# Run the server
CMD ["bun", "run", "index.ts"]
