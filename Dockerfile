FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install all workspace dependencies
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install tools recursively
RUN npm run install:all

# Copy entire project
COPY . .

# Build Client Web UI
RUN npm run build --workspace=client

# Start mapping
EXPOSE 3001

# Set the single entrypoint
CMD ["npm", "start", "--workspace=server"]
