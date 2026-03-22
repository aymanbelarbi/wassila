# Frontend Dockerfile - Node.js + React + Vite
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose port
EXPOSE 3000

# Dev server command (for development)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
