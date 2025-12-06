# Frontend Dockerfile for development and production
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source and public
COPY src/ ./src/
COPY public/ ./public/

# Build React app
RUN npm run build

# Production stage - serve with Node
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/build ./build

EXPOSE 3000

ENV REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_WS_URL=ws://localhost:5001

CMD ["serve", "-s", "build", "-l", "3000"]

