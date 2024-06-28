# Stage 1: Build the React app
FROM node:20 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the React app source files
COPY ./ ./

# Build the React app
RUN npx vite build --base=/

# Stage 2: Set up the Express server
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only the server dependencies
RUN npm install

# Copy the Express server source files
COPY ./server ./server

# Copy the React build files from the previous stage
COPY --from=builder /app/dist ./dist

# Set environment variables for Node.js production
ENV NODE_ENV=production

# Expose the port the server will run on
EXPOSE 8080

# Start the Express server
CMD ["npx", "tsx", "server/server.ts"]
