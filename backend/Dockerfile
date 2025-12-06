FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

# 1) Copy only package.json + lockfile
COPY package*.json ./

# 2) Install dependencies inside the image
RUN npm install --production

# 3) Copy the rest of the backend source
COPY . .

EXPOSE 5000 5001

CMD ["node", "server.js"]

