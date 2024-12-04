# Description: Dockerfile for the Node.js application
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json file
COPY package.json package-lock.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
