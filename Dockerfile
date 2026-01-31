# Stage 1: Build the Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the Backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy the rest of the backend code
COPY . .

# Expose the port
EXPOSE 3001

# Start the server
CMD ["npm", "run", "server"]
