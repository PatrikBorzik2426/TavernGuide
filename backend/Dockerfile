# Use a Node.js base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# General Configuration
ENV TZ=UTC
ENV PORT=3333
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info
ENV APP_KEY=4OT1l7OmxJtQ5b_YqishmxIyzrFeUmhI
ENV NODE_ENV=development

ENV DB_HOST="192.168.1.10"
ENV DB_PORT=5432
ENV DB_USER=admin
ENV DB_PASSWORD=dndjecool
ENV DB_DATABASE=tavern_guide

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Expose the application on port 3000
EXPOSE 3333

# Start the application
CMD ["npm", "run", "prod"]
