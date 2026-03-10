# Use lightweight Node image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install transmart globally at build time
RUN npm install -g @transmart/cli

# Default command (can be overridden by compose)
CMD ["npx", "transmart"]