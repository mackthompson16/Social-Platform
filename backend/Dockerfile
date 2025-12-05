# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app/backend

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy backend source
COPY backend/ .

# Expose ports
EXPOSE 5000 5001

# Set default environment variables
ENV PORT=5000
ENV WEBSOCKET_PORT=5001
ENV DATABASE_URL=postgres://wecal:wecalpw@db:5432/wecal
ENV CORS_ORIGINS=http://localhost:3000

# Start backend
CMD ["node", "server.js"]
