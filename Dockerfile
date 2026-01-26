# Production-only frontend container:
# serves the prebuilt React /build folder that you generate on your laptop

FROM node:20-alpine

WORKDIR /app
RUN npm install -g serve

# Copy the already-built static assets from your repo
COPY build ./build

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
